import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { ApkUpdateManifest } from "../../src/core/updates/apkManifest.types";
import type { ApkUpdateReason } from "../../src/core/updates/useApkUpdateController";
import Constants from "expo-constants";
import { deriveApkUpdateExplanation } from "../../features/updates/deriveApkUpdateExplanation";

export function ApkUpdateModal({
  visible,
  manifest,
  reason,
  critical,
  onLater,
  onUpdate,
}: {
  visible: boolean;
  manifest: ApkUpdateManifest;
  reason: ApkUpdateReason;
  critical: boolean;
  onLater: () => void;
  onUpdate: () => void;
}) {
  const { semantic, resolved } = useTheme();
  const cur = Constants.expoConfig?.version ?? "—";
  const explanation = deriveApkUpdateExplanation({ manifest, evaluation: { reason, critical } });
  const borderTint = resolved === "light" ? semantic.borderStrong : "rgba(34,211,238,0.25)";
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end px-4 pb-10 pt-16" style={{ backgroundColor: "rgba(0,0,0,0.72)" }}>
        <LinearGradient
          colors={
            resolved === "light"
              ? (["#ffffff", "#f1f5f9"] as const)
              : (["rgba(15,23,42,0.98)", "rgba(3,7,18,0.99)"] as const)
          }
          className="overflow-hidden rounded-3xl border p-5"
          style={{ borderColor: borderTint }}
        >
          <Text className="text-[10px] uppercase tracking-[0.35em]" style={{ color: semantic.accent }}>
            AION · полная сборка
          </Text>
          <Text className="mt-2 text-2xl font-semibold" style={{ color: semantic.textPrimary }}>
            {explanation.title}
          </Text>
          <Text className="mt-2 text-xs leading-5" style={{ color: semantic.textSecondary }}>
            {explanation.detail}
          </Text>
          <Text className="mt-3 text-sm leading-5" style={{ color: semantic.textSecondary }}>
            Текущая версия: {cur}
            {"\n"}
            Актуальная: {manifest.latestVersion}
            {manifest.releaseDate ? ` · ${manifest.releaseDate}` : ""}
            {manifest.downloadSizeLabel ? `\nРазмер: ${manifest.downloadSizeLabel}` : ""}
          </Text>
          {manifest.changelog?.length ? (
            <ScrollView className="mt-4 max-h-40" showsVerticalScrollIndicator={false}>
              <Text className="text-xs uppercase tracking-widest" style={{ color: semantic.textTertiary }}>
                Что нового
              </Text>
              {manifest.changelog.map((line, i) => (
                <Text key={i} className="mt-1.5 text-sm" style={{ color: semantic.textSecondary }}>
                  • {line}
                </Text>
              ))}
            </ScrollView>
          ) : null}
          <Text className="mt-4 text-xs leading-5" style={{ color: semantic.textTertiary }}>
            Откроется загрузка APK. После установки снова доступны OTA-обновления интерфейса и логики без
            переустановки, пока не меняется runtime или нативные модули.
          </Text>
          <View className="mt-5 flex-row gap-3">
            {!explanation.mandatory ? (
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  onLater();
                }}
                className="flex-1 items-center rounded-2xl border py-3.5"
                style={{ borderColor: semantic.border }}
              >
                <Text className="text-sm font-semibold" style={{ color: semantic.textSecondary }}>
                  Позже
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onUpdate();
              }}
              className="flex-1 items-center rounded-2xl py-3.5"
              style={{ backgroundColor: semantic.accent }}
            >
              <Text className="text-sm font-semibold text-slate-950">{explanation.actionLabel}</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
