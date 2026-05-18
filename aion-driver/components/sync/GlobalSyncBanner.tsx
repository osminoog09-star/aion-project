import NetInfo from "@react-native-community/netinfo";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { peekSyncQueue } from "../../features/sync/services/offlineQueue";
import { radius, spacing } from "../../tokens";
import { useOnline } from "../../features/sync/hooks/useNetworkStatus";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getLastSyncFlushAt } from "../../storage/core/syncDebugMeta";

function formatRelative(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "только что";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}

/**
 * Сеть, очередь синка, статус облака (аккаунт vs гость).
 */
export function GlobalSyncBanner() {
  const pathname = usePathname() ?? "";
  const insets = useSafeAreaInsets();
  const { semantic: s } = useTheme();
  const online = useOnline();
  const { session, isGuest, isConfigured } = useAuth();
  const [queueLen, setQueueLen] = useState(0);
  const [lastFlush, setLastFlush] = useState<number | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/desktop") || pathname.startsWith("/link")) return;
    const tick = () => {
      void peekSyncQueue().then((q) => setQueueLen(q.length));
      void getLastSyncFlushAt().then(setLastFlush);
    };
    tick();
    const id = setInterval(tick, 4000);
    const sub = NetInfo.addEventListener(() => tick());
    return () => {
      clearInterval(id);
      sub();
    };
  }, [pathname]);

  if (pathname.startsWith("/desktop") || pathname.startsWith("/link")) return null;

  const cloudLine =
    !isConfigured || isGuest
      ? "Локальный режим"
      : session
        ? "Облако · аккаунт"
        : "Войдите для синхронизации";

  if (!online || queueLen > 0) {
    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: insets.top + spacing.xs,
          left: spacing.md,
          right: spacing.md,
          zIndex: 100,
          borderRadius: radius.md,
          backgroundColor: online ? s.accentMuted : "rgba(248,113,113,0.12)",
          borderWidth: 1,
          borderColor: online ? s.borderStrong : s.danger,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
        }}
      >
        <Text style={{ color: s.textPrimary, fontSize: 12, fontWeight: "600" }}>
          {!online
            ? "Офлайн — данные на устройстве"
            : isGuest || !session
              ? `В очереди ${queueLen} — войдите в аккаунт для отправки`
              : `Синхронизация · в очереди ${queueLen} ${queueLen === 1 ? "операция" : "операций"}`}
        </Text>
        <Text style={{ color: s.textTertiary, fontSize: 10, marginTop: 2 }}>{cloudLine}</Text>
      </View>
    );
  }

  if (session && !isGuest && isConfigured) {
    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: insets.top + spacing.xs,
          left: spacing.md,
          right: spacing.md,
          zIndex: 99,
          borderRadius: radius.md,
          backgroundColor: s.accentMuted,
          borderWidth: 1,
          borderColor: s.border,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
        }}
      >
        <Text style={{ color: s.textSecondary, fontSize: 11, fontWeight: "600" }}>
          {cloudLine}
          {lastFlush != null ? ` · синк ${formatRelative(lastFlush)}` : ""}
        </Text>
      </View>
    );
  }

  return null;
}
