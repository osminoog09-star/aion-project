import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  checkForUpdateDetailed,
  DEFAULT_SNOOZE_MS,
  fetchUpdateWithRetry,
  reloadToApplyUpdate,
  type UpdateManifestSummary,
} from "../services/updateService";
import {
  getOtaMinCheckGapMs,
  getOtaPeriodicCheckMs,
  getOtaStartupCheckDelayMs,
  isOtaPreviewTestMode,
  useDiscreteOtaBannerFlow,
} from "../lib/otaTestMode";
import {
  clearOtaSnooze,
  getOtaSnoozeUntil,
  setOtaSnoozeUntil,
} from "../storage/core/otaStorage";
import { appendAionTimelineEvent } from "../storage/core/aionTimelineStorage";

export type UpdateUiPhase =
  | "idle"
  | "checking"
  | "prompt"
  | "downloading"
  | "ready"
  | "error";

export type UseUpdatesResult = {
  phase: UpdateUiPhase;
  updateStatus: UpdateUiPhase;
  visible: boolean;
  /** Баннер (preview / discrete OTA) — тихая предзагрузка, без навязчивой модалки. */
  bannerVisible: boolean;
  /** EXPO_PUBLIC_OTA_PREVIEW_TEST */
  isOtaPreviewTest: boolean;
  /** Баннерный UX: preview или EXPO_PUBLIC_OTA_DISCRETE_BANNER */
  discreteBannerUx: boolean;
  /** Время последней попытки checkForUpdate (локальные мс). */
  lastOtaCheckAtMs: number | null;
  progress: number;
  updateProgress: number;
  errorMessage: string | null;
  manifestSummary: UpdateManifestSummary | null;
  releaseNotes: string | null;
  currentVersion: string;
  pendingUpdateId: string | null;
  checkNow: () => void;
  /** Сбрасывает анти-спам окно и сразу проверяет сервер. */
  checkNowForce: () => void;
  snooze: () => Promise<void>;
  startDownload: () => Promise<void>;
  applyReload: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  retryAfterError: () => Promise<void>;
  /** Открыть полноэкранный overlay (из баннера). */
  expandUpdateOverlay: () => void;
  /** Локальный UI-тест без сервера (preview / discrete build). */
  runSimulatedUpdatePrompt: () => void;
};

export function useUpdatesController(): UseUpdatesResult {
  const preview = isOtaPreviewTestMode();
  const discreteFlow = useDiscreteOtaBannerFlow();
  const [phase, setPhase] = useState<UpdateUiPhase>("idle");
  const [visible, setVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manifestSummary, setManifestSummary] = useState<UpdateManifestSummary | null>(null);
  const [lastOtaCheckAtMs, setLastOtaCheckAtMs] = useState<number | null>(null);

  const lastCheckAt = useRef(0);
  const downloadStarted = useRef(false);
  const mounted = useRef(true);
  const autoDownloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startDownloadRef = useRef<() => Promise<void>>(async () => {});
  /** Пользователь открыл модалку вручную — не прятать её при тихой загрузке. */
  const overlayUserOpenedRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearAutoTimer = () => {
    if (autoDownloadTimer.current != null) {
      clearTimeout(autoDownloadTimer.current);
      autoDownloadTimer.current = null;
    }
  };

  const startDownload = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    if (downloadStarted.current) return;
    downloadStarted.current = true;
    clearAutoTimer();

    if (discreteFlow && !overlayUserOpenedRef.current) {
      setBannerVisible(true);
      setVisible(false);
    } else {
      setBannerVisible(false);
      setVisible(true);
    }

    await clearOtaSnooze();
    setPhase("downloading");
    setErrorMessage(null);
    setProgress(0.05);

    const res = await fetchUpdateWithRetry((p) => {
      if (mounted.current) setProgress(p);
    });

    if (!mounted.current) return;

    if (res.ok && res.isNew === false) {
      setVisible(false);
      setBannerVisible(false);
      setPhase("idle");
      setProgress(0);
      downloadStarted.current = false;
      return;
    }

    if (res.ok) {
      setPhase("ready");
      setProgress(1);
      void appendAionTimelineEvent({
        type: "ota_updated",
        title: "OTA загружен",
        detail: "Готов к перезапуску для применения",
      });
      if (discreteFlow && !overlayUserOpenedRef.current) {
        setBannerVisible(true);
        setVisible(false);
      }
      return;
    }

    setPhase("error");
    setErrorMessage(res.message);
    downloadStarted.current = false;
    setBannerVisible(false);
    setVisible(true);
  }, [discreteFlow]);

  startDownloadRef.current = startDownload;

  const runCheck = useCallback(
    async (force: boolean) => {
      if (__DEV__ || !Updates.isEnabled) return;

      const now = Date.now();
      const gap = getOtaMinCheckGapMs();
      if (!force && now - lastCheckAt.current < gap) {
        return;
      }
      lastCheckAt.current = now;

      const snoozeUntil = await getOtaSnoozeUntil();
      if (!force && snoozeUntil > now) {
        return;
      }

      setBannerVisible(false);
      setPhase("checking");
      const outcome = await checkForUpdateDetailed();
      setLastOtaCheckAtMs(Date.now());

      if (!mounted.current) return;

      if (!outcome.ok) {
        setPhase("idle");
        return;
      }

      if (!outcome.available) {
        setPhase("idle");
        return;
      }

      setManifestSummary(outcome.manifestSummary);
      setErrorMessage(null);
      setProgress(0);
      downloadStarted.current = false;
      clearAutoTimer();
      overlayUserOpenedRef.current = false;
      setPhase("prompt");

      if (discreteFlow) {
        setBannerVisible(true);
        setVisible(false);
        autoDownloadTimer.current = setTimeout(() => {
          autoDownloadTimer.current = null;
          if (!mounted.current || downloadStarted.current) return;
          void startDownloadRef.current();
        }, 450);
      } else {
        setBannerVisible(false);
        setVisible(true);
        autoDownloadTimer.current = setTimeout(() => {
          autoDownloadTimer.current = null;
          if (!mounted.current || downloadStarted.current) return;
          void startDownloadRef.current();
        }, 700);
      }
    },
    [discreteFlow],
  );

  const snooze = useCallback(async () => {
    clearAutoTimer();
    overlayUserOpenedRef.current = false;
    await setOtaSnoozeUntil(Date.now() + DEFAULT_SNOOZE_MS);
    setVisible(false);
    setBannerVisible(false);
    setPhase("idle");
    setProgress(0);
    setErrorMessage(null);
    setManifestSummary(null);
    downloadStarted.current = false;
  }, []);

  const applyReload = useCallback(async () => {
    try {
      await reloadToApplyUpdate(manifestSummary);
    } catch {
      setPhase("error");
      setErrorMessage("Не удалось перезапустить. Закройте приложение и откройте снова.");
    }
  }, [manifestSummary]);

  const retryAfterError = useCallback(async () => {
    setErrorMessage(null);
    setPhase("prompt");
    setProgress(0);
    downloadStarted.current = false;
    clearAutoTimer();
    if (!discreteFlow) {
      autoDownloadTimer.current = setTimeout(() => {
        autoDownloadTimer.current = null;
        if (!mounted.current || downloadStarted.current) return;
        void startDownloadRef.current();
      }, 400);
    }
  }, [discreteFlow]);

  const checkNow = useCallback(() => {
    void runCheck(true);
  }, [runCheck]);

  const checkNowForce = useCallback(() => {
    lastCheckAt.current = 0;
    void runCheck(true);
  }, [runCheck]);

  const expandUpdateOverlay = useCallback(() => {
    overlayUserOpenedRef.current = true;
    setBannerVisible(false);
    setVisible(true);
  }, []);

  const runSimulatedUpdatePrompt = useCallback(() => {
    if (__DEV__ || !Updates.isEnabled || !discreteFlow) return;
    setManifestSummary({
      updateId: "00000000-0000-4000-8000-000000000099",
      createdAt: new Date().toISOString(),
      runtimeVersion: Updates.runtimeVersion != null ? String(Updates.runtimeVersion) : "1.0.0",
      bundleParts: 2,
      releaseMessage:
        "[Симуляция UI] Локальный тест баннера/модалки.\nНовое:\n• проверка отображения\nФиксы:\n• без сети",
      commitHash: "simulated",
      newFeatures: ["проверка отображения"],
      bugFixes: ["без сети"],
    });
    setErrorMessage(null);
    setProgress(0);
    downloadStarted.current = false;
    clearAutoTimer();
    overlayUserOpenedRef.current = false;
    setPhase("prompt");
    setBannerVisible(true);
    setVisible(false);
  }, [discreteFlow]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return undefined;

    const delay = getOtaStartupCheckDelayMs();
    const t = setTimeout(() => {
      void runCheck(false);
    }, delay);

    const onChange = (s: AppStateStatus) => {
      if (s === "active") {
        void runCheck(false);
      }
    };
    const sub = AppState.addEventListener("change", onChange);

    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [runCheck]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return undefined;

    const period = getOtaPeriodicCheckMs();
    const id = setInterval(() => {
      if (AppState.currentState === "active") {
        void runCheck(false);
      }
    }, period);

    return () => clearInterval(id);
  }, [runCheck]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return undefined;

    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected === true) {
        void runCheck(false);
      }
    });
    return () => {
      unsub();
    };
  }, [runCheck]);

  useEffect(
    () => () => {
      clearAutoTimer();
    },
    [],
  );

  return useMemo(
    () => ({
      phase,
      updateStatus: phase,
      visible,
      bannerVisible,
      isOtaPreviewTest: preview,
      discreteBannerUx: discreteFlow,
      lastOtaCheckAtMs,
      progress,
      updateProgress: progress,
      errorMessage,
      manifestSummary,
      releaseNotes: manifestSummary?.releaseMessage ?? null,
      currentVersion: Constants.expoConfig?.version ?? "1.0.0",
      pendingUpdateId: manifestSummary?.updateId ?? null,
      checkNow,
      checkNowForce,
      snooze,
      startDownload,
      applyReload,
      applyUpdate: applyReload,
      retryAfterError,
      expandUpdateOverlay,
      runSimulatedUpdatePrompt,
    }),
    [
      phase,
      visible,
      bannerVisible,
      preview,
      discreteFlow,
      lastOtaCheckAtMs,
      progress,
      errorMessage,
      manifestSummary,
      checkNow,
      checkNowForce,
      snooze,
      startDownload,
      applyReload,
      retryAfterError,
      expandUpdateOverlay,
      runSimulatedUpdatePrompt,
    ],
  );
}
