import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo, useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { useOnline } from "../../features/sync/hooks/useNetworkStatus";
import { peekSyncQueue } from "../../features/sync/services/offlineQueue";

export const DriverSyncStrip = memo(function DriverSyncStrip() {
  const { semantic } = useTheme();
  const online = useOnline();
  const [pending, setPending] = useState(0);
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    void peekSyncQueue().then((q) => setPending(q.length));
    const t = setInterval(() => {
      void peekSyncQueue().then((q) => setPending(q.length));
    }, 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.55 + 0.35,
    transform: [{ scale: 0.92 + pulse.value * 0.12 }],
  }));

  return (
    <View
      className="mb-4 flex-row items-center gap-3 rounded-2xl border px-3 py-2.5"
      style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
    >
      <View className="relative h-9 w-9 items-center justify-center">
        <MaterialIcons
          name={online ? "cloud-done" : "cloud-off"}
          size={20}
          color={online ? semantic.success : semantic.danger}
        />
        {online && pending > 0 ? (
          <Animated.View
            style={[
              dotStyle,
              {
                position: "absolute",
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: semantic.accent,
              },
            ]}
          />
        ) : null}
      </View>
      <View className="flex-1">
        <Text className="text-[10px] uppercase tracking-widest" style={{ color: semantic.textTertiary }}>
          Синхронизация
        </Text>
        <Text className="text-xs font-medium" style={{ color: semantic.textPrimary }}>
          {online ? "Онлайн" : "Офлайн"} · очередь {pending} {pending === 1 ? "операция" : "операций"}
        </Text>
        <Text className="mt-0.5 text-[10px]" style={{ color: semantic.textSecondary }}>
          {online ? "Изменения уходят в облако при сети." : "Офлайн-режим: всё сохраняется локально."}
        </Text>
      </View>
    </View>
  );
});
