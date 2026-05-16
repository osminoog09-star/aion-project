import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as Updates from "expo-updates";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { UpdateUiPhase } from "../../hooks/useUpdates";
import type { UpdateManifestSummary } from "../../services/updateService";
import { getOtaDebugInfo } from "../../services/updateService";
import { GradientButton } from "../ui/GradientButton";

export type UpdateOverlayProps = {
  visible: boolean;
  phase: UpdateUiPhase;
  progress: number;
  errorMessage: string | null;
  manifestSummary: UpdateManifestSummary | null;
  onSnooze: () => void;
  onDownloadNow: () => void;
  onApplyReload: () => void;
  onRetry: () => void;
};

const AnimatedView = Animated.createAnimatedComponent(View);
const CardShell = Animated.createAnimatedComponent(View);

function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UpdateOverlay({
  visible,
  phase,
  progress,
  errorMessage,
  manifestSummary,
  onSnooze,
  onDownloadNow,
  onApplyReload,
  onRetry,
}: UpdateOverlayProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(380, width - 32);
  const maxBodyH = Math.min(height * 0.62, 420);
  const p = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslate = useSharedValue(18);
  const otaNow = getOtaDebugInfo();

  useEffect(() => {
    if (visible) {
      cardOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
      cardTranslate.value = withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) });
    } else {
      cardOpacity.value = 0;
      cardTranslate.value = 18;
    }
  }, [visible, cardOpacity, cardTranslate]);

  useEffect(() => {
    if (!visible || phase !== "prompt") return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [visible, phase]);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    p.value = withTiming(clamped, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, p]);

  const barAnim = useAnimatedStyle(() => ({
    width: `${p.value * 100}%`,
  }));

  const cardShellAnim = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }));

  if (!visible) return null;

  const laterDisabled = phase === "downloading";

  const title =
    phase === "error"
      ? "Не удалось обновить"
      : phase === "ready"
        ? "Готово к запуску"
        : phase === "downloading"
          ? "Загрузка обновления"
          : "Доступно обновление AION";

  const subtitle =
    phase === "error"
      ? errorMessage ??
        "Проверьте сеть и попробуйте снова. Приложение продолжит работать как обычно."
      : phase === "ready"
        ? "Перезапустите приложение, чтобы применить обновление без переустановки APK."
        : phase === "downloading"
          ? "Файлы кэшируются на устройстве. Не закрывайте приложение до завершения."
          : "Новая сборка на канале EAS Update. Можно обновить сейчас или отложить.";

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  const runningRv =
    Updates.runtimeVersion != null ? String(Updates.runtimeVersion) : otaNow.runtimeVersion;

  const metaBlock =
    manifestSummary && (phase === "prompt" || phase === "downloading" || phase === "ready") ? (
      <View className="mt-5 rounded-2xl border border-cyan-500/15 bg-slate-950/50 p-4">
        <Text className="text-[10px] uppercase tracking-[0.28em] text-cyan-400/80">Сборка</Text>
        <View className="mt-2 gap-1.5">
          {manifestSummary.runtimeVersion ? (
            <Text className="text-xs text-slate-300">
              <Text className="text-slate-500">Runtime: </Text>
              {manifestSummary.runtimeVersion}
            </Text>
          ) : runningRv ? (
            <Text className="text-xs text-slate-300">
              <Text className="text-slate-500">Runtime: </Text>
              {runningRv}
            </Text>
          ) : null}
          {manifestSummary.updateId ? (
            <Text className="text-xs text-slate-400" numberOfLines={2} selectable>
              <Text className="text-slate-500">Update ID: </Text>
              {manifestSummary.updateId}
            </Text>
          ) : null}
          {manifestSummary.commitHash ? (
            <Text className="text-xs text-slate-400" selectable>
              <Text className="text-slate-500">Commit: </Text>
              {manifestSummary.commitHash}
            </Text>
          ) : null}
          {formatShortDate(manifestSummary.createdAt) ? (
            <Text className="text-xs text-slate-500">
              Собрано: {formatShortDate(manifestSummary.createdAt)}
            </Text>
          ) : null}
          <Text className="text-xs text-slate-500">
            Объём: ~{manifestSummary.bundleParts} частей бандла (launch + assets)
          </Text>
          {otaNow.channel ? (
            <Text className="text-xs text-slate-500">
              Канал: <Text className="text-slate-300">{otaNow.channel}</Text>
            </Text>
          ) : null}
        </View>

        {manifestSummary.releaseMessage ? (
          <View className="mt-4 border-t border-white/5 pt-4">
            <Text className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Release notes</Text>
            <Text className="mt-2 text-sm leading-5 text-slate-300">{manifestSummary.releaseMessage}</Text>
          </View>
        ) : null}

        {manifestSummary.newFeatures.length > 0 ? (
          <View className="mt-4">
            <Text className="text-[10px] uppercase tracking-[0.25em] text-emerald-400/90">Новое</Text>
            {manifestSummary.newFeatures.slice(0, 8).map((line, i) => (
              <Text key={`f-${i}`} className="mt-1.5 text-sm text-slate-300">
                • {line}
              </Text>
            ))}
          </View>
        ) : null}

        {manifestSummary.bugFixes.length > 0 ? (
          <View className="mt-4">
            <Text className="text-[10px] uppercase tracking-[0.25em] text-amber-200/90">Исправления</Text>
            {manifestSummary.bugFixes.slice(0, 8).map((line, i) => (
              <Text key={`b-${i}`} className="mt-1.5 text-sm text-slate-300">
                • {line}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    ) : null;

  const inner = (
    <View
      className="border border-cyan-400/20 p-5"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <View className="mb-4 items-center">
        <LinearGradient
          colors={["rgba(34,211,238,0.35)", "rgba(99,102,241,0.2)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(34,211,238,0.35)",
          }}
        >
          <MaterialIcons name="system-update-alt" size={36} color="#e0f2fe" />
        </LinearGradient>
      </View>

      <Text className="text-center text-xl font-semibold tracking-tight text-slate-50">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-slate-400">{subtitle}</Text>

      {phase === "prompt" || phase === "downloading" || phase === "ready" ? (
        <ScrollView
          style={{ maxHeight: maxBodyH }}
          className="mt-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {metaBlock}
          <View className="mt-5">
            <View className="h-2 overflow-hidden rounded-full bg-slate-800/90">
              <AnimatedView
                className="h-2 rounded-full bg-cyan-400"
                style={[
                  barAnim,
                  {
                    shadowColor: "#22d3ee",
                    shadowOpacity: 0.55,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              />
            </View>
            <Text className="mt-2 text-center text-xs text-slate-500">
              {phase === "ready" ? "Готово к применению" : `${pct}%`}
            </Text>
          </View>
        </ScrollView>
      ) : null}

      <View className="mt-6 gap-3">
        {phase === "prompt" ? (
          <>
            <GradientButton title="Обновить сейчас" onPress={onDownloadNow} size="cockpit" />
            <GradientButton
              title="Позже"
              variant="ghost"
              onPress={onSnooze}
              disabled={laterDisabled}
              size="cockpit"
            />
          </>
        ) : null}

        {phase === "downloading" ? (
          <Text className="text-center text-xs text-slate-500">
            При нестабильной сети загрузка может занять чуть больше времени — мы повторим попытку
            автоматически.
          </Text>
        ) : null}

        {phase === "ready" ? (
          <>
            <GradientButton title="Перезапустить приложение" onPress={onApplyReload} size="cockpit" />
            <GradientButton title="Не сейчас" variant="ghost" onPress={onSnooze} size="cockpit" />
          </>
        ) : null}

        {phase === "error" ? (
          <>
            <GradientButton title="Повторить" onPress={onRetry} size="cockpit" />
            <GradientButton title="Позже" variant="ghost" onPress={onSnooze} size="cockpit" />
          </>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        if (!laterDisabled) onSnooze();
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
          backgroundColor: "rgba(3,7,18,0.86)",
        }}
      >
        <Pressable
          accessibilityLabel="Закрыть"
          disabled={laterDisabled}
          onPress={() => {
            if (!laterDisabled) onSnooze();
          }}
          className="absolute inset-0"
        />

        <CardShell
          style={[
            { width: cardW, borderRadius: 28, overflow: "hidden" },
            cardShellAnim,
          ]}
        >
          <LinearGradient
            colors={["rgba(15,23,42,0.95)", "rgba(3,7,18,0.88)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28 }}
          >
            {Platform.OS === "ios" ? (
              <BlurView intensity={42} tint="dark" style={{ borderRadius: 28 }}>
                {inner}
              </BlurView>
            ) : (
              <View className="bg-slate-950/95">{inner}</View>
            )}
          </LinearGradient>
        </CardShell>
      </View>
    </Modal>
  );
}
