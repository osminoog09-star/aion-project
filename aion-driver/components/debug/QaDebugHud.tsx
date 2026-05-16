import NetInfo from "@react-native-community/netinfo";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { peekSyncQueue } from "../../features/sync/services/offlineQueue";
import { getOtaChannelTier } from "../../lib/otaTestMode";
import { getLastSyncFlushAt } from "../../storage/core/syncDebugMeta";
import { colors } from "../../tokens";

/**
 * Минимальный QA overlay: сеть, канал, размер очереди синка, последний flush.
 * Расширяемый фундамент под FPS / инспектор запросов.
 */
export function QaDebugHud() {
  const [net, setNet] = useState<string>("—");
  const [queueLen, setQueueLen] = useState<number>(0);
  const [lastFlush, setLastFlush] = useState<string>("—");

  const refresh = useCallback(async () => {
    const q = await peekSyncQueue();
    setQueueLen(q.length);
    const t = await getLastSyncFlushAt();
    setLastFlush(t != null ? new Date(t).toLocaleTimeString() : "—");
  }, []);

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => {
      const t = s.type ?? "?";
      const c = s.isConnected === true ? "on" : s.isConnected === false ? "off" : "?";
      setNet(`${t} ${c}`);
    });
    return () => sub();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      void refresh();
    }, 2500);
    void refresh();
    return () => clearInterval(id);
  }, [refresh]);

  const tier = getOtaChannelTier();
  const ch = Updates.channel ?? "—";

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 8,
        top: 52,
        zIndex: 60,
        maxWidth: "88%",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "rgba(2,6,23,0.78)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
      }}
    >
      <Text style={{ color: colors.slate400, fontSize: 9, fontWeight: "700", letterSpacing: 1 }}>
        QA
      </Text>
      <Text style={{ color: colors.slate300, fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>
        net {net}
      </Text>
      <Text style={{ color: colors.slate300, fontSize: 10, marginTop: 2, fontFamily: "monospace" }}>
        ota {tier} · ch {ch}
      </Text>
      <Text style={{ color: colors.slate300, fontSize: 10, marginTop: 2, fontFamily: "monospace" }}>
        sync q={queueLen} flush {lastFlush}
      </Text>
    </View>
  );
}
