import NetInfo from "@react-native-community/netinfo";
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
import { useAuth } from "../../../../features/auth/hooks/useAuth";
import { useUpdates } from "../../../../contexts/UpdatesContext";
import { deriveRecommendations } from "../ai/deriveRecommendations";
import type { AionRecommendation } from "../ai/memoryTypes";
import { collectAionDiagnosticsSnapshot } from "../diagnostics/collectAionDiagnosticsSnapshot";
import { deriveAionEntityState } from "../entity/deriveAionEntityState";
import { useAionEntityStore } from "../entity/aionEntityStore";
import type { AionDiagnosticsSnapshot, AionDevOpsStub, AionEntityState } from "../diagnostics/types";
import { AION_MODULES, type AionModuleDefinition } from "../modules/registry";
import { getDevOpsStatusStub } from "../telemetry/devopsStatus";
import {
  appendAionTimelineEvent,
  listAionTimeline,
  type AionTimelineEvent,
} from "../../../../storage/core/aionTimelineStorage";

export type AionCoreContextValue = {
  snapshot: AionDiagnosticsSnapshot | null;
  /** Состояние живой сущности (орб / ядро AION) */
  entityState: AionEntityState;
  /** @deprecated используйте entityState */
  orbState: AionEntityState;
  recommendations: AionRecommendation[];
  devops: AionDevOpsStub;
  modules: readonly AionModuleDefinition[];
  timeline: AionTimelineEvent[];
  refreshing: boolean;
  refresh: () => Promise<void>;
  refreshTimeline: () => Promise<void>;
};

const AionCoreContext = createContext<AionCoreContextValue | null>(null);

export function AionCoreProvider({ children }: { children: ReactNode }) {
  const updates = useUpdates();
  const { session, isGuest, isConfigured } = useAuth();
  const ocrActive = useAionEntityStore((x) => x.ocrActive);
  const successUntilMs = useAionEntityStore((x) => x.successUntilMs);
  const [snapshot, setSnapshot] = useState<AionDiagnosticsSnapshot | null>(null);
  const [timeline, setTimeline] = useState<AionTimelineEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const devops = useMemo(() => getDevOpsStatusStub(), []);
  const lastNet = useRef<boolean | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const loadTimeline = useCallback(async () => {
    const rows = await listAionTimeline(16);
    setTimeline(rows);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const s = await collectAionDiagnosticsSnapshot(updates, {
        sessionPresent: !!session,
        isGuest,
        isConfigured,
      });
      setSnapshot(s);
      await loadTimeline();
    } finally {
      setRefreshing(false);
    }
  }, [updates, loadTimeline, session, isGuest, isConfigured]);

  refreshRef.current = refresh;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshRef.current();
    }, 12_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const on = state.isConnected === true;
      if (lastNet.current === null) {
        lastNet.current = on;
        void refreshRef.current();
        return;
      }
      if (lastNet.current === true && !on) {
        void appendAionTimelineEvent({
          type: "offline_entered",
          title: "Офлайн",
          detail: "Сеть недоступна",
        });
      } else if (lastNet.current === false && on) {
        void appendAionTimelineEvent({
          type: "reconnect_completed",
          title: "Reconnect завершён",
          detail: "Сеть восстановлена",
        });
      }
      lastNet.current = on;
      void refreshRef.current();
    });
    return () => {
      unsub();
    };
  }, []);

  const entityState = useMemo(
    () =>
      snapshot
        ? deriveAionEntityState(snapshot, { ocrActive, successUntilMs })
        : "idle",
    [snapshot, ocrActive, successUntilMs],
  );

  const recommendations = useMemo(
    () => (snapshot ? deriveRecommendations(snapshot) : []),
    [snapshot],
  );

  const value = useMemo(
    (): AionCoreContextValue => ({
      snapshot,
      entityState,
      orbState: entityState,
      recommendations,
      devops,
      modules: AION_MODULES,
      timeline,
      refreshing,
      refresh,
      refreshTimeline: loadTimeline,
    }),
    [
      snapshot,
      entityState,
      recommendations,
      devops,
      timeline,
      refreshing,
      refresh,
      loadTimeline,
    ],
  );

  return <AionCoreContext.Provider value={value}>{children}</AionCoreContext.Provider>;
}

export function useAionCore(): AionCoreContextValue {
  const ctx = useContext(AionCoreContext);
  if (!ctx) {
    throw new Error("useAionCore must be used within AionCoreProvider");
  }
  return ctx;
}
