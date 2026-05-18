import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useApkUpdates } from "../../contexts/ApkUpdatesContext";
import { GlowCard } from "../ui/GlowCard";

/** Постоянная полоса на дашборде, пока доступна новая полная сборка. */
export function ApkUpdateBanner() {
  const { manifest, evald, visible } = useApkUpdates();
  if (!manifest || !evald || evald.reason === "none" || !visible) return null;

  return (
    <Pressable onPress={() => router.push("/update-center")} className="mb-4">
      <GlowCard glow="cyan">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1">
            <Text className="text-[10px] uppercase tracking-widest text-cyan-300/80">
              Обновление AION
            </Text>
            <Text className="mt-1 text-sm font-semibold text-white">
              Доступна версия {manifest.latestVersion}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Нажмите — скачать APK или отложить
            </Text>
          </View>
          <Text className="text-lg text-cyan-300">→</Text>
        </View>
      </GlowCard>
    </Pressable>
  );
}
