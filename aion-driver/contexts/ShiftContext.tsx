import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import type { ActiveShift, FuelEntry, FuelKind, Shift, UserProfile } from "../types";
import { emitShiftRecorded } from "../features/trips/services/shiftRecordedBus";
import { onCloudDataRestored } from "../features/cloud/services/cloudRestoreBus";
import { scheduleCloudBackupPush } from "../features/cloud/services/scheduleCloudBackup";
import { loadActiveShift, saveActiveShift } from "../storage/driver/activeShiftStorage";
import {
  appendPendingFuelEntry,
  clearPendingFuelEntries,
  loadPendingFuelEntries,
  removePendingFuelEntry,
  updatePendingFuelEntry,
} from "../storage/driver/pendingFuelStorage";
import { buildManualFuelEntry } from "../utils/fuelEntryFromManual";
import { diagLog } from "../lib/diagnosticLog";
import { pickCurrencyReconcileAction } from "../services/currencyReconcile";
import { loadProfile, saveProfile } from "../storage/driver/profileStorage";
import {
  appendShift,
  loadShiftHistory,
} from "../storage/driver/shiftHistoryStorage";
import { appendAionTimelineEvent } from "../storage/core/aionTimelineStorage";
import { getLastSyncFlushAt } from "../storage/core/syncDebugMeta";
import { peekSyncQueue } from "../features/sync/services/offlineQueue";
import {
  buildActiveShiftRuntime,
  deriveShiftState,
  type ActiveShiftRuntime,
  type ShiftState,
} from "../features/shift/runtime/activeShiftRuntimeTypes";
import type { LiveShiftMetrics } from "../features/shift/runtime/liveShiftTypes";
import { buildLiveShiftMetrics } from "../utils/activeShiftMetrics";
import { pickProfitFromRuntime } from "../utils/shiftDisplayEconomics";
import {
  ensureForegroundPermission,
  startFilteredLocationSession,
  type LocationSession,
} from "../services/locationService";
import { resolveLocationWatchTiming } from "../services/locationPolicy";
import type { MotionState } from "../services/locationPolicy";
import {
  getBackgroundTrackingAdapter,
  type BackgroundTrackingHandle,
} from "../services/backgroundTracking";
import {
  isAionOverlayOrbNativeAvailable,
  orbNativeHide,
  orbNativeIsPermissionGranted,
  orbNativeShow,
  orbNativeUpdateHud,
  orbNativeUpdateState,
} from "../services/aionOverlayOrbNative";
import { useDevice } from "./DeviceContext";
import { loadPostShiftHandoff, savePostShiftHandoff } from "../storage/driver/postShiftHandoffStorage";
import { computeDriverIntelligence } from "../features/driver/intelligence/computeDriverIntelligence";
import type { DriverIntelligenceSnapshot } from "../features/driver/intelligence/computeDriverIntelligence";
import { clearBackgroundShiftLocationRuntimeState } from "../tasks/shiftLocationTask";
import { buildPostShiftAnalytics } from "../features/analytics/engine/buildPostShiftAnalytics";
import { persistShiftAnalytics } from "../features/analytics/storage/shiftAnalyticsStorage";
import { gpsIngestionGateway } from "../features/gps/ingestion/gpsIngestionGateway";
import { loadGpsTripSession } from "../features/gps/tripStore/gpsTripStorage";
import { useRuntimePulse } from "../src/core/aion/runtime/runtimePulseBus";
import { resetStatisticsElement } from "../features/statistics/resetStatisticsElement";
import type { StatResetResult, StatResetTarget } from "../features/statistics/types";

function createShiftId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export type { LiveShiftMetrics } from "../features/shift/runtime/liveShiftTypes";

type ShiftContextValue = {
  hydrated: boolean;
  profile: UserProfile | null;
  saveUserProfile: (p: UserProfile) => Promise<void>;
  activeShift: ActiveShift | null;
  history: Shift[];
  isTracking: boolean;
  motionState: MotionState;
  shiftState: ShiftState;
  activeShiftRuntime: ActiveShiftRuntime | null;
  postShiftHandoff: Shift | null;
  dismissPostShiftHandoff: () => Promise<void>;
  driverIntelligence: DriverIntelligenceSnapshot;
  startShift: () => Promise<{ ok: boolean; error?: string }>;
  pauseShift: () => Promise<void>;
  resumeShift: () => Promise<void>;
  endShift: () => Promise<void>;
  addIncome: (amount: number) => Promise<void>;
  addConfirmedFuelEntry: (entry: FuelEntry) => Promise<void>;
  updateFuelEntry: (
    id: string,
    input: { totalCost: number; liters: number; fuelType: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  removeFuelEntry: (id: string) => Promise<{ ok: boolean; error?: string }>;
  pendingFuelEntries: FuelEntry[];
  refreshPendingFuel: () => Promise<void>;
  setActiveFuelType: (kind: FuelKind) => Promise<void>;
  liveMetrics: LiveShiftMetrics | null;
  refreshHistory: () => Promise<void>;
  /** Сброс истории смен и связанной статистики (профиль сохраняется). */
  resetStatistics: (opts?: { includeCloud?: boolean; userId?: string | null }) => Promise<{
    ok: boolean;
    error?: string;
    message?: string;
  }>;
  /** Точечный сброс одного блока (см. экран «Статистика»). */
  resetStatisticElement: (
    target: StatResetTarget,
    opts?: { userId?: string | null },
  ) => Promise<StatResetResult>;
};

const ShiftContext = createContext<ShiftContextValue | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { settings: deviceSettings, updateSettings } = useDevice();
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [pendingFuelEntries, setPendingFuelEntries] = useState<FuelEntry[]>([]);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [motionState, setMotionState] = useState<MotionState>("moving");
  const [postShiftHandoff, setPostShiftHandoff] = useState<Shift | null>(null);
  const [syncMeta, setSyncMeta] = useState<{
    pending: number;
    lastFlush: number | null;
  }>({ pending: 0, lastFlush: null });

  const motionStateRef = useRef<MotionState>("moving");
  const sessionRef = useRef<LocationSession | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingEnabledRef = useRef(false);
  const activeShiftRef = useRef<ActiveShift | null>(null);
  const lastDistanceSnapshotRef = useRef(0);
  const stagnantSinceRef = useRef<number | null>(null);
  const bgTrackingRef = useRef<BackgroundTrackingHandle | null>(null);
  const [appInForeground, setAppInForeground] = useState(
    () => AppState.currentState === "active",
  );
  const orbVisualRef = useRef<{ shiftId: string; visual: string } | null>(null);

  activeShiftRef.current = activeShift;
  const profileRef = useRef<UserProfile | null>(null);
  profileRef.current = profile;
  const syncMetaRef = useRef(syncMeta);
  syncMetaRef.current = syncMeta;

  useEffect(() => {
    motionStateRef.current = motionState;
  }, [motionState]);

  const schedulePersist = useCallback((next: ActiveShift) => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      void saveActiveShift(next);
    }, 300);
  }, []);

  const stopTracking = useCallback(() => {
    trackingEnabledRef.current = false;
    sessionRef.current?.stop();
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [p, shift, hist, handoff, pendingFuel] = await Promise.all([
        loadProfile(),
        loadActiveShift(),
        loadShiftHistory(),
        loadPostShiftHandoff(),
        loadPendingFuelEntries(),
      ]);
      if (cancelled) return;
      setProfile(p);
      setActiveShift(shift);
      setHistory(hist);
      setPostShiftHandoff(handoff);
      setPendingFuelEntries(pendingFuel);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return onCloudDataRestored(() => {
      void (async () => {
        const [p, hist] = await Promise.all([loadProfile(), loadShiftHistory()]);
        setProfile(p);
        setHistory(hist);
      })();
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !profile) return;
    const action = pickCurrencyReconcileAction(
      deviceSettings.currencyCode,
      deviceSettings.regionCountryCode,
      profile,
    );
    if (action === "none") return;
    if (action === "profile-to-settings" && profile.currencyCode) {
      void updateSettings({ currencyCode: profile.currencyCode });
      return;
    }
    if (action === "settings-to-profile") {
      const next = { ...profile, currencyCode: deviceSettings.currencyCode };
      void saveProfile(next).then(() => setProfile(next));
    }
  }, [
    hydrated,
    profile,
    deviceSettings.currencyCode,
    deviceSettings.regionCountryCode,
    updateSettings,
  ]);

  useEffect(() => {
    if (!hydrated || !activeShift?.id) return;
    void gpsIngestionGateway.resumeShift(activeShift.id);
  }, [hydrated, activeShift?.id]);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    const tick = async () => {
      try {
        const [q, flush] = await Promise.all([peekSyncQueue(), getLastSyncFlushAt()]);
        if (!alive) return;
        setSyncMeta({ pending: q.length, lastFlush: flush });
      } catch {
        if (!alive) return;
        setSyncMeta((s) => ({ ...s }));
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 12_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!activeShift) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeShift]);

  useEffect(() => {
    if (!hydrated || !activeShift || activeShift.paused) return;
    const id = setInterval(() => {
      const cur = activeShiftRef.current;
      if (!cur || cur.paused) return;
      const idle = motionStateRef.current === "idle";
      const next: ActiveShift = {
        ...cur,
        motionMovingMs: (cur.motionMovingMs ?? 0) + (idle ? 0 : 1000),
        motionIdleMs: (cur.motionIdleMs ?? 0) + (idle ? 1000 : 0),
      };
      schedulePersist(next);
      setActiveShift(next);
    }, 1000);
    return () => clearInterval(id);
  }, [hydrated, activeShift?.id, activeShift?.paused, schedulePersist]);

  useEffect(() => {
    const onChange = (s: AppStateStatus) => {
      setAppInForeground(s === "active");
      if (s !== "active") return;
      void (async () => {
        const cur = activeShiftRef.current;
        if (!cur || cur.paused) return;
        const disk = await loadActiveShift();
        if (!disk || disk.id !== cur.id) return;
        if (
          disk.distanceMeters !== cur.distanceMeters ||
          disk.distanceMetersPetrol !== cur.distanceMetersPetrol ||
          disk.distanceMetersGas !== cur.distanceMetersGas ||
          disk.lastAcceptedLat !== cur.lastAcceptedLat ||
          disk.lastAcceptedLng !== cur.lastAcceptedLng
        ) {
          setActiveShift(disk);
        }
      })();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  /** Пауза GPS-логики при отсутствии прироста дистанции (машина стоит). */
  useEffect(() => {
    if (!activeShift) {
      setMotionState("moving");
      stagnantSinceRef.current = null;
      lastDistanceSnapshotRef.current = 0;
      return;
    }
    lastDistanceSnapshotRef.current = activeShift.distanceMeters;
    stagnantSinceRef.current = null;
    setMotionState("moving");

    const id = setInterval(() => {
      const cur = activeShiftRef.current;
      if (!cur) return;
      const m = cur.distanceMeters;
      if (m > lastDistanceSnapshotRef.current + 2) {
        lastDistanceSnapshotRef.current = m;
        stagnantSinceRef.current = null;
        setMotionState("moving");
        return;
      }
      const now = Date.now();
      if (stagnantSinceRef.current === null) stagnantSinceRef.current = now;
      else if (now - stagnantSinceRef.current > 48_000) {
        setMotionState("idle");
      }
    }, 5000);
    return () => clearInterval(id);
  }, [activeShift?.id]);

  const beginLocationSession = useCallback(
    (shift: ActiveShift) => {
      stopTracking();
      const resume =
        shift.lastAcceptedLat != null && shift.lastAcceptedLng != null
          ? {
              lastLat: shift.lastAcceptedLat,
              lastLng: shift.lastAcceptedLng,
              totalMeters: shift.distanceMeters,
            }
          : undefined;

      const timing = resolveLocationWatchTiming(deviceSettings, motionState);

      sessionRef.current = startFilteredLocationSession({
        resume,
        timeIntervalMs: timing.timeIntervalMs,
        distanceIntervalMeters: timing.distanceIntervalMeters,
        onTick: (tick) => {
          gpsIngestionGateway.ingestForegroundTick(tick);
          useRuntimePulse.getState().pingGps();
          setActiveShift((prev) => {
            if (!trackingEnabledRef.current || !prev) return prev;
            const newTotal = tick.totalDistanceMeters;
            const delta = Math.max(0, newTotal - prev.distanceMeters);
            const petrol =
              prev.distanceMetersPetrol +
              (prev.activeFuelType === "petrol" ? delta : 0);
            const gas =
              prev.distanceMetersGas +
              (prev.activeFuelType === "gas" ? delta : 0);
            const next: ActiveShift = {
              ...prev,
              distanceMeters: newTotal,
              distanceMetersPetrol: petrol,
              distanceMetersGas: gas,
              lastAcceptedLat: tick.point.lat,
              lastAcceptedLng: tick.point.lng,
            };
            schedulePersist(next);
            return next;
          });
        },
      });
      trackingEnabledRef.current = true;
    },
    [
      schedulePersist,
      stopTracking,
      deviceSettings.batteryOptimization,
      deviceSettings.gpsUpdateIntervalMs,
      motionState,
    ]
  );

  useEffect(() => {
    if (!hydrated) {
      stopTracking();
      return;
    }
    if (!activeShift || activeShift.paused || !appInForeground) {
      stopTracking();
      return;
    }
    beginLocationSession(activeShift);
    return () => {
      stopTracking();
    };
  }, [
    hydrated,
    activeShift?.id,
    activeShift?.paused,
    appInForeground,
    beginLocationSession,
    stopTracking,
    motionState,
    deviceSettings.batteryOptimization,
    deviceSettings.gpsUpdateIntervalMs,
  ]);

  /**
   * FGS headless task только вне AppState active — иначе дублирует foreground watch.
   */
  useEffect(() => {
    if (!hydrated) return;
    if (!activeShift || activeShift.paused || appInForeground) {
      bgTrackingRef.current?.dispose();
      bgTrackingRef.current = null;
      return;
    }
    let cancelled = false;
    void (async () => {
      const shift = activeShiftRef.current;
      if (!shift || shift.paused) return;
      bgTrackingRef.current?.dispose();
      const handle = await getBackgroundTrackingAdapter().enableForShift(shift);
      if (!cancelled) bgTrackingRef.current = handle;
    })();
    return () => {
      cancelled = true;
      bgTrackingRef.current?.dispose();
      bgTrackingRef.current = null;
    };
  }, [hydrated, activeShift?.id, activeShift?.paused, appInForeground]);

  /** Android: орбита через FGS + persistence (не привязана к Activity). */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!hydrated || cancelled) return;
      if (!deviceSettings.androidOverlayOrbEnabled || !isAionOverlayOrbNativeAvailable()) {
        orbVisualRef.current = null;
        await orbNativeHide();
        return;
      }
      const shift = activeShiftRef.current;
      if (!shift) {
        orbVisualRef.current = null;
        await orbNativeHide();
        return;
      }
      const permitted = await orbNativeIsPermissionGranted();
      if (!permitted || cancelled) {
        orbVisualRef.current = null;
        await orbNativeHide();
        return;
      }
      const visual = shift.paused
        ? "paused"
        : appInForeground
          ? "shift_active"
          : "background";
      const last = orbVisualRef.current;
      const sameShift = last != null && last.shiftId === shift.id;
      const visualOnly = sameShift && last.visual !== visual;
      orbVisualRef.current = { shiftId: shift.id, visual };
      try {
        if (visualOnly) {
          await orbNativeUpdateState(visual);
        } else {
          await orbNativeShow(visual, shift.id);
        }
      } catch {
        orbVisualRef.current = null;
        await orbNativeHide();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    activeShift?.id,
    activeShift?.paused,
    appInForeground,
    deviceSettings.androidOverlayOrbEnabled,
  ]);

  useEffect(() => {
    return () => {
      void orbNativeHide();
    };
  }, []);

  const saveUserProfile = useCallback(
    async (p: UserProfile) => {
      await saveProfile(p);
      setProfile(p);
      if (p.currencyCode && p.currencyCode !== deviceSettings.currencyCode) {
        await updateSettings({ currencyCode: p.currencyCode });
      }
      scheduleCloudBackupPush();
    },
    [deviceSettings.currencyCode, updateSettings],
  );

  const startShift = useCallback(async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    if (activeShift) return { ok: false, error: "Смена уже активна" };
    const okPerm = await ensureForegroundPermission();
    if (!okPerm) {
      return {
        ok: false,
        error: "Нужен доступ к геолокации, чтобы считать километраж.",
      };
    }
    await savePostShiftHandoff(null);
    setPostShiftHandoff(null);
    const pendingFuel = await loadPendingFuelEntries();
    const next: ActiveShift = {
      id: createShiftId(),
      startedAt: new Date().toISOString(),
      distanceMeters: 0,
      distanceMetersPetrol: 0,
      distanceMetersGas: 0,
      activeFuelType: "petrol",
      totalIncome: 0,
      lastAcceptedLat: null,
      lastAcceptedLng: null,
      paused: false,
      pauseStartedAtMs: null,
      accumulatedPauseMs: 0,
      incomeEventsCount: 0,
      milestonesHit: [],
      fuelEntries: [...pendingFuel],
      incomeLedger: [],
      motionMovingMs: 0,
      motionIdleMs: 0,
    };
    if (pendingFuel.length > 0) {
      await clearPendingFuelEntries();
    }
    await clearBackgroundShiftLocationRuntimeState();
    await saveActiveShift(next);
    setActiveShift(next);
    const startedMs = Date.parse(next.startedAt);
    await gpsIngestionGateway.startShift(
      next.id,
      Number.isFinite(startedMs) ? startedMs : Date.now(),
    );
    return { ok: true };
  }, [activeShift]);

  const pauseShift = useCallback(async () => {
    if (!activeShift || activeShift.paused) return;
    stopTracking();
    bgTrackingRef.current?.dispose();
    bgTrackingRef.current = null;
    await gpsIngestionGateway.pauseFlush();
    const now = Date.now();
    const next: ActiveShift = {
      ...activeShift,
      paused: true,
      pauseStartedAtMs: now,
    };
    await saveActiveShift(next);
    setActiveShift(next);
    void appendAionTimelineEvent({
      type: "shift_paused",
      title: "Смена на паузе",
      detail: "GPS и учёт времени остановлены",
      moduleId: "driver",
    });
  }, [activeShift, stopTracking]);

  const resumeShift = useCallback(async () => {
    if (!activeShift || !activeShift.paused) return;
    const now = Date.now();
    const startPause = activeShift.pauseStartedAtMs ?? now;
    const delta = Math.max(0, now - startPause);
    const next: ActiveShift = {
      ...activeShift,
      paused: false,
      pauseStartedAtMs: null,
      accumulatedPauseMs: (activeShift.accumulatedPauseMs ?? 0) + delta,
    };
    await saveActiveShift(next);
    setActiveShift(next);
    void appendAionTimelineEvent({
      type: "shift_resumed",
      title: "Смена снова в движении",
      moduleId: "driver",
    });
  }, [activeShift]);

  const endShift = useCallback(async () => {
    if (!activeShift || !profile) return;
    bgTrackingRef.current?.dispose();
    bgTrackingRef.current = null;
    const sessionMeters = sessionRef.current?.getTotalMeters();
    stopTracking();
    const finalMeters =
      sessionMeters != null ? sessionMeters : activeShift.distanceMeters;
    const endedAt = new Date().toISOString();
    const endMs = new Date(endedAt).getTime();
    const endedShift: ActiveShift = {
      ...activeShift,
      distanceMeters: finalMeters,
    };
    const gpsSummary = await gpsIngestionGateway.endShift(activeShift.id);
    const gpsSession = await loadGpsTripSession(activeShift.id);

    const live = buildLiveShiftMetrics(profile, endedShift, endMs);
    const kmTotal = live.distanceKm;
    const income = live.income;
    const record: Shift = {
      id: activeShift.id,
      startedAt: activeShift.startedAt,
      endedAt,
      durationMs: live.durationMs,
      distanceKm: kmTotal,
      distanceKmPetrol: live.distanceKmPetrol,
      distanceKmGas: live.distanceKmGas,
      income,
      fuelUsedPetrolLiters: live.fuelUsedPetrolLiters,
      fuelUsedGasLiters: live.fuelUsedGasLiters,
      fuelCostPetrol: live.fuelCostPetrol,
      fuelCostGas: live.fuelCostGas,
      fuelCostTotal: live.fuelCostTotal,
      gasSavingsRub: live.gasSavingsRub,
      netProfit: live.netProfit,
      profitPerHour: live.profitPerHour,
      profitPerKm: live.profitPerKm,
      ...(live.operationalCosts
        ? {
            rentalCostAccrued: live.operationalCosts.rentalAccrued,
            fixedOpsCost: live.operationalCosts.fixedOpsAccrued,
            netProfitAfterCosts: live.operationalCosts.profitAfterCosts,
            profitPerHourAfterCosts: live.operationalCosts.profitPerHourAfterCosts,
          }
        : {}),
      ...(gpsSummary
        ? {
            gpsPointCount: gpsSummary.pointCount,
            gpsStopCount: gpsSummary.stopCount,
          }
        : {}),
    };
    const hist = await appendShift(record);
    setHistory(hist);

    const analyticsSnapshot = buildPostShiftAnalytics({
      shift: record,
      activeShift: endedShift,
      gpsSummary,
      gpsSession,
    });
    await persistShiftAnalytics(analyticsSnapshot);
    void appendAionTimelineEvent({
      type: "shift_completed",
      title: "Смена завершена",
      detail: `Доход ${income.toFixed(0)} · ${kmTotal.toFixed(1)} км`,
      moduleId: "driver",
    });
    const prevBestPph = hist
      .slice(1)
      .reduce((m, s) => Math.max(m, s.profitPerHour), 0);
    if (record.profitPerHour > prevBestPph && prevBestPph > 0) {
      void appendAionTimelineEvent({
        type: "new_best_hour",
        title: "Новый рекорд смены",
        detail: `Прибыль/час ${record.profitPerHour.toFixed(0)} · было до ${prevBestPph.toFixed(0)}`,
        moduleId: "driver",
      });
    }
    const prevShift = hist[1];
    if (
      prevShift &&
      record.distanceKm > 5 &&
      record.profitPerKm > prevShift.profitPerKm * 1.12
    ) {
      void appendAionTimelineEvent({
        type: "efficiency_improved",
        title: "Эффективность выросла",
        detail: `Профит/км +${((record.profitPerKm / prevShift.profitPerKm - 1) * 100).toFixed(0)}% к прошлой смене`,
        moduleId: "driver",
      });
    }
    emitShiftRecorded(record);
    await savePostShiftHandoff(record);
    setPostShiftHandoff(record);
    await saveActiveShift(null);
    await clearBackgroundShiftLocationRuntimeState();
    setActiveShift(null);
  }, [activeShift, profile, stopTracking]);

  const addIncome = useCallback(async (amount: number) => {
    if (amount <= 0) return;
    setActiveShift((prev) => {
      if (!prev) return prev;
      const entry = {
        id: createShiftId(),
        atMs: Date.now(),
        amount,
      };
      const next: ActiveShift = {
        ...prev,
        totalIncome: prev.totalIncome + amount,
        incomeEventsCount: (prev.incomeEventsCount ?? 0) + 1,
        incomeLedger: [...(prev.incomeLedger ?? []), entry],
      };
      void saveActiveShift(next);
      return next;
    });
  }, []);

  const refreshPendingFuel = useCallback(async () => {
    const pending = await loadPendingFuelEntries();
    setPendingFuelEntries(pending);
  }, []);

  const addConfirmedFuelEntry = useCallback(async (entry: FuelEntry) => {
    const prev = activeShiftRef.current;
    if (!prev) {
      await appendPendingFuelEntry(entry);
      await refreshPendingFuel();
      scheduleCloudBackupPush();
      diagLog("info", "fuel", "Заправка в очередь (без смены)", {
        totalCost: entry.totalCost,
        liters: entry.liters,
      });
      return;
    }
    const next: ActiveShift = {
      ...prev,
      fuelEntries: [...(prev.fuelEntries ?? []), entry],
    };
    await saveActiveShift(next);
    setActiveShift(next);
    scheduleCloudBackupPush();
    diagLog("info", "fuel", "Заправка добавлена в смену", {
      totalCost: entry.totalCost,
      liters: entry.liters,
    });
  }, [refreshPendingFuel]);

  const updateFuelEntry = useCallback(
    async (
      id: string,
      input: { totalCost: number; liters: number; fuelType: string },
    ): Promise<{ ok: boolean; error?: string }> => {
      const rebuilt = buildManualFuelEntry(input);
      if (!rebuilt) {
        return { ok: false, error: "Проверьте сумму и литры" };
      }
      const prev = activeShiftRef.current;
      if (prev) {
        const list = prev.fuelEntries ?? [];
        const idx = list.findIndex((e) => e.id === id);
        if (idx >= 0) {
          const kept = list[idx];
          const updated: FuelEntry = {
            ...rebuilt,
            id,
            addedAtMs: kept.addedAtMs,
            source: kept.source,
          };
          const nextEntries = [...list];
          nextEntries[idx] = updated;
          const next: ActiveShift = { ...prev, fuelEntries: nextEntries };
          await saveActiveShift(next);
          setActiveShift(next);
          scheduleCloudBackupPush();
          diagLog("info", "fuel", "Заправка исправлена", { id, totalCost: updated.totalCost });
          return { ok: true };
        }
      }
      const pendingUpdated = await updatePendingFuelEntry(id, {
        fuelType: rebuilt.fuelType,
        liters: rebuilt.liters,
        totalCost: rebuilt.totalCost,
        unitPrice: rebuilt.unitPrice,
      });
      if (pendingUpdated) {
        await refreshPendingFuel();
        diagLog("info", "fuel", "Ожидающая заправка исправлена", { id });
        return { ok: true };
      }
      return { ok: false, error: "Запись не найдена" };
    },
    [refreshPendingFuel],
  );

  const removeFuelEntry = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      const prev = activeShiftRef.current;
      if (prev) {
        const list = prev.fuelEntries ?? [];
        if (list.some((e) => e.id === id)) {
          const next: ActiveShift = {
            ...prev,
            fuelEntries: list.filter((e) => e.id !== id),
          };
          await saveActiveShift(next);
          setActiveShift(next);
          scheduleCloudBackupPush();
          diagLog("warn", "fuel", "Заправка удалена из смены", { id });
          return { ok: true };
        }
      }
      const removed = await removePendingFuelEntry(id);
      if (removed) {
        await refreshPendingFuel();
        diagLog("warn", "fuel", "Ожидающая заправка удалена", { id });
        return { ok: true };
      }
      return { ok: false, error: "Запись не найдена" };
    },
    [refreshPendingFuel],
  );

  const setActiveFuelType = useCallback(async (kind: FuelKind) => {
    setActiveShift((prev) => {
      if (!prev || prev.activeFuelType === kind) return prev;
      const next: ActiveShift = { ...prev, activeFuelType: kind };
      void saveActiveShift(next);
      return next;
    });
  }, []);

  const refreshHistory = useCallback(async () => {
    const hist = await loadShiftHistory();
    setHistory(hist);
  }, []);

  const applyStatisticsStateFromDisk = useCallback(async () => {
    const [hist, shift, pending, handoff] = await Promise.all([
      loadShiftHistory(),
      loadActiveShift(),
      loadPendingFuelEntries(),
      loadPostShiftHandoff(),
    ]);
    setHistory(hist);
    setActiveShift(shift);
    setPendingFuelEntries(pending);
    setPostShiftHandoff(handoff);
  }, []);

  const resetStatisticElementFn = useCallback(
    async (
      target: StatResetTarget,
      opts?: { userId?: string | null },
    ): Promise<StatResetResult> => {
      const needsStop =
        target.id === "active_shift" ||
        target.id === "everything_local" ||
        (target.id === "shift_one" && activeShiftRef.current?.id === target.shiftId);
      if (needsStop) {
        stopTracking();
        bgTrackingRef.current?.dispose();
        bgTrackingRef.current = null;
        trackingEnabledRef.current = false;
      }
      const result = await resetStatisticsElement(target, {
        hasActiveShift: Boolean(activeShiftRef.current),
        userId: opts?.userId ?? null,
      });
      if (result.ok) {
        await applyStatisticsStateFromDisk();
        diagLog("info", "stats_reset", `Элемент: ${target.id}`, { message: result.message });
      }
      return result;
    },
    [applyStatisticsStateFromDisk, stopTracking],
  );

  const resetStatistics = useCallback(
    async (opts?: { includeCloud?: boolean; userId?: string | null }) => {
      if (activeShiftRef.current) {
        return {
          ok: false,
          error: "Сначала завершите активную смену или сбросьте её в «Статистика».",
        };
      }
      stopTracking();
      bgTrackingRef.current?.dispose();
      bgTrackingRef.current = null;
      trackingEnabledRef.current = false;
      const local = await resetStatisticElementFn({ id: "everything_local" });
      if (!local.ok) {
        return { ok: false, error: local.error };
      }
      if (opts?.includeCloud && opts.userId) {
        const cloud = await resetStatisticElementFn({ id: "cloud_trips" });
        if (!cloud.ok) {
          return { ok: false, error: cloud.error, message: local.message };
        }
        return { ok: true, message: `${local.message ?? ""} · ${cloud.message ?? ""}` };
      }
      return { ok: true, message: local.message };
    },
    [resetStatisticElementFn, stopTracking],
  );

  const dismissPostShiftHandoff = useCallback(async () => {
    await savePostShiftHandoff(null);
    setPostShiftHandoff(null);
  }, []);

  useEffect(() => {
    if (!activeShift || activeShift.paused || !profile) return;
    const live = buildLiveShiftMetrics(profile, activeShift, nowTick);
    const kmTotal = live.distanceKm;
    const income = live.income;
    const durationMs = live.durationMs;
    const metrics = live;
    const hit = new Set(activeShift.milestonesHit ?? []);
    let changed = false;
    const tryHit = (id: string, title: string, detail: string) => {
      if (hit.has(id)) return;
      hit.add(id);
      changed = true;
      void appendAionTimelineEvent({
        type: "milestone_reached",
        title,
        detail,
        moduleId: "driver",
      });
    };
    if (kmTotal >= 10) tryHit("km_10", "10 км в смене", "Отличный прогресс.");
    if (kmTotal >= 25) tryHit("km_25", "25 км", "Солидный километраж.");
    if (kmTotal >= 50) tryHit("km_50", "50 км", "Серьёзная дистанция.");
    if (income >= 1000) tryHit("inc_1k", "Доход 1k+", "Порог по выручке.");
    if (income >= 3000) tryHit("inc_3k", "Доход 3k+", "Сильная смена.");
    if (durationMs >= 4 * 3_600_000) tryHit("dur_4h", "4 часа в линии", "Устойчивое окно.");
    if (durationMs >= 8 * 3_600_000) tryHit("dur_8h", "8 часов", "Длинная смена — следите за отдыхом.");
    if (income > 80 && metrics.fuelCostTotal > income * 0.42 && !hit.has("fuel_warn")) {
      hit.add("fuel_warn");
      changed = true;
      void appendAionTimelineEvent({
        type: "fuel_warning",
        title: "Топливо давит на маржу",
        detail: "Топливо >42% от выручки — проверьте газ и маршрут.",
        moduleId: "driver",
      });
    }
    if (!changed) return;
    setActiveShift((prev) => {
      if (!prev || prev.id !== activeShift.id) return prev;
      const next = { ...prev, milestonesHit: [...hit] };
      void saveActiveShift(next);
      return next;
    });
  }, [activeShift, profile, nowTick]);

  const shiftState = useMemo(
    () => deriveShiftState({ hydrated, activeShift, postShiftHandoff }),
    [hydrated, activeShift, postShiftHandoff],
  );

  const liveMetrics = useMemo((): LiveShiftMetrics | null => {
    if (!hydrated || !profile || !activeShift) return null;
    return buildLiveShiftMetrics(profile, activeShift, nowTick);
  }, [hydrated, profile, activeShift, nowTick]);

  const activeShiftRuntime = useMemo((): ActiveShiftRuntime | null => {
    if (!hydrated || !activeShift || !liveMetrics) return null;
    return buildActiveShiftRuntime({
      activeShift,
      live: liveMetrics,
      syncPending: syncMeta.pending,
      syncLastFlush: syncMeta.lastFlush,
      motionState,
    });
  }, [hydrated, activeShift, liveMetrics, syncMeta, motionState]);

  const driverIntelligence = useMemo(
    () =>
      computeDriverIntelligence(
        history,
        activeShiftRuntime,
        activeShift
          ? {
              movingMs: activeShift.motionMovingMs ?? 0,
              idleMs: activeShift.motionIdleMs ?? 0,
            }
          : null,
        profile?.rentalEconomics,
      ),
    [history, activeShiftRuntime, activeShift, profile?.rentalEconomics],
  );

  /** Live profit pulse на сфере/орбе каждые 30 с во время активной смены. */
  useEffect(() => {
    if (!hydrated || !activeShift || activeShift.paused) return;
    const id = setInterval(() => {
      const shift = activeShiftRef.current;
      const p = profileRef.current;
      if (!shift || shift.paused || !p) return;
      const live = buildLiveShiftMetrics(p, shift, Date.now());
      const meta = syncMetaRef.current;
      const runtime = buildActiveShiftRuntime({
        activeShift: shift,
        live,
        syncPending: meta.pending,
        syncLastFlush: meta.lastFlush,
        motionState: motionStateRef.current,
      });
      const { profit } = pickProfitFromRuntime(runtime);
      useRuntimePulse.getState().pingProfit();
      diagLog("info", "profit_pulse", "Тик прибыли смены", { profit: Math.round(profit) });
    }, 30_000);
    return () => clearInterval(id);
  }, [hydrated, activeShift?.id, activeShift?.paused]);

  useEffect(() => {
    if (!hydrated || Platform.OS !== "android") return;
    if (!deviceSettings.androidOverlayOrbEnabled || !isAionOverlayOrbNativeAvailable()) return;
    if (!activeShiftRuntime) return;
    const km = (activeShiftRuntime.distanceMeters / 1000).toFixed(1);
    const min = Math.round(activeShiftRuntime.durationMs / 60_000);
    const title = activeShiftRuntime.paused ? "Пауза" : "Смена AION";
    const { profit, profitPerHour: pph } = pickProfitFromRuntime(activeShiftRuntime);
    const body = `Чистая ${Math.round(profit)} · ${Math.round(pph)}/ч · ${km} км · ${min} мин`;
    void orbNativeUpdateHud(title, body);
  }, [hydrated, activeShiftRuntime, deviceSettings.androidOverlayOrbEnabled]);

  const value = useMemo<ShiftContextValue>(
    () => ({
      hydrated,
      profile,
      saveUserProfile,
      activeShift,
      history,
      isTracking: Boolean(activeShift && !activeShift.paused),
      motionState,
      shiftState,
      activeShiftRuntime,
      postShiftHandoff,
      dismissPostShiftHandoff,
      driverIntelligence,
      startShift,
      pauseShift,
      resumeShift,
      endShift,
      addIncome,
      addConfirmedFuelEntry,
      updateFuelEntry,
      removeFuelEntry,
      pendingFuelEntries,
      refreshPendingFuel,
      setActiveFuelType,
      liveMetrics,
      refreshHistory,
      resetStatistics,
      resetStatisticElement: resetStatisticElementFn,
    }),
    [
      hydrated,
      profile,
      saveUserProfile,
      activeShift,
      history,
      motionState,
      shiftState,
      activeShiftRuntime,
      postShiftHandoff,
      dismissPostShiftHandoff,
      driverIntelligence,
      startShift,
      pauseShift,
      resumeShift,
      endShift,
      addIncome,
      addConfirmedFuelEntry,
      updateFuelEntry,
      removeFuelEntry,
      pendingFuelEntries,
      refreshPendingFuel,
      setActiveFuelType,
      liveMetrics,
      refreshHistory,
      resetStatistics,
      resetStatisticElementFn,
    ]
  );

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
}

export function useShift(): ShiftContextValue {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error("useShift must be used within ShiftProvider");
  return ctx;
}
