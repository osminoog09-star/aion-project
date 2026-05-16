import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { UpdateUiPhase } from "../../hooks/useUpdatesController";
import type { UpdateManifestSummary } from "../../services/updateService";
import { GradientButton } from "../ui/GradientButton";
import { blur, colors, radius } from "../../tokens";

const AnimatedView = Animated.createAnimatedComponent(View);

export type UpdateBannerProps = {
  visible: boolean;
  phase: UpdateUiPhase;
  progress: number;
  manifestSummary: UpdateManifestSummary | null;
  onDownload: () => void;
  onApplyReload: () => void;
  onLater: () => void;
  onOpenDetails: () => void;
};

/**
 * Компактный баннер OTA: preview / discrete — тихая предзагрузка, прогресс, мгновенный restart.
 */
export function UpdateBanner({
  visible,
  phase,
  progress,
  manifestSummary,
  onDownload,
  onApplyReload,
  onLater,
  onOpenDetails,
}: UpdateBannerProps) {
  const insets = useSafeAreaInsets();
  const p = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    p.value = withTiming(clamped, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [progress, p]);

  const barAnim = useAnimatedStyle(() => ({
    width: `${p.value * 100}%`,
  }));

  if (!visible) return null;

  const title =
    phase === "ready"
      ? "Обновление готово"
      : phase === "downloading"
        ? "Загрузка обновления…"
        : manifestSummary?.releaseMessage?.split("\n")[0]?.trim() ?? "Доступно обновление";
  const sub =
    manifestSummary?.runtimeVersion != null
      ? `Runtime ${manifestSummary.runtimeVersion}`
      : "EAS Update";

  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + 6,
        left: 12,
        right: 12,
        zIndex: 120,
      }}
    >
      <View
        style={{
          borderRadius: radius.xl,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(34,211,238,0.35)",
        }}
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={blur.panel} tint="dark" style={{ overflow: "hidden" }}>
            <LinearGradient
              colors={["rgba(15,23,42,0.95)", "rgba(3,7,18,0.92)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 12, paddingHorizontal: 14 }}
            >
              <BannerInner
                title={title}
                sub={sub}
                phase={phase}
                progress={clamped}
                barAnim={barAnim}
                onDownload={onDownload}
                onApplyReload={onApplyReload}
                onLater={onLater}
                onOpenDetails={onOpenDetails}
              />
            </LinearGradient>
          </BlurView>
        ) : (
          <View style={{ backgroundColor: "rgba(2,6,23,0.96)" }}>
            <LinearGradient
              colors={["rgba(15,23,42,0.95)", "rgba(3,7,18,0.92)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 12, paddingHorizontal: 14 }}
            >
              <BannerInner
                title={title}
                sub={sub}
                phase={phase}
                progress={clamped}
                barAnim={barAnim}
                onDownload={onDownload}
                onApplyReload={onApplyReload}
                onLater={onLater}
                onOpenDetails={onOpenDetails}
              />
            </LinearGradient>
          </View>
        )}
      </View>
    </View>
  );
}

function BannerInner({
  title,
  sub,
  phase,
  progress,
  barAnim,
  onDownload,
  onApplyReload,
  onLater,
  onOpenDetails,
}: {
  title: string;
  sub: string;
  phase: UpdateUiPhase;
  progress: number;
  barAnim: AnimatedStyle<ViewStyle>;
  onDownload: () => void;
  onApplyReload: () => void;
  onLater: () => void;
  onOpenDetails: () => void;
}) {
  const showProgress = phase === "downloading" || phase === "ready";
  const pct = Math.round(progress * 100);

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {phase === "downloading" ? (
          <ActivityIndicator size="small" color={colors.cyan400} />
        ) : null}
        <Text style={{ color: colors.slate100, fontSize: 15, fontWeight: "700", flex: 1 }} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <Text style={{ color: colors.slate500, fontSize: 11, marginTop: 4 }}>{sub}</Text>

      {showProgress ? (
        <View style={{ marginTop: 10 }}>
          <View style={{ height: 4, overflow: "hidden", borderRadius: 999, backgroundColor: "rgba(15,23,42,0.9)" }}>
            <AnimatedView
              style={[
                barAnim,
                {
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: colors.cyan400,
                },
              ]}
            />
          </View>
          <Text style={{ color: colors.slate500, fontSize: 10, marginTop: 4 }}>
            {phase === "ready" ? "Готово — можно перезапустить" : `${pct}%`}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {phase === "prompt" ? (
          <>
            <View style={{ flex: 1, minWidth: 120 }}>
              <GradientButton
                title="Скачать и обновить"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDownload();
                }}
                size="default"
              />
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <GradientButton title="Позже" variant="ghost" onPress={onLater} size="default" />
            </View>
          </>
        ) : null}
        {phase === "downloading" ? (
          <View style={{ flex: 1, minWidth: 120 }}>
            <GradientButton title="Подробнее" variant="glass" onPress={onOpenDetails} size="default" />
          </View>
        ) : null}
        {phase === "ready" ? (
          <>
            <View style={{ flex: 1, minWidth: 120 }}>
              <GradientButton
                title="Перезапустить"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  void onApplyReload();
                }}
                size="default"
              />
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <GradientButton title="Позже" variant="ghost" onPress={onLater} size="default" />
            </View>
          </>
        ) : null}
      </View>

      {phase === "prompt" ? (
        <Pressable onPress={onOpenDetails} style={{ marginTop: 10 }} hitSlop={8}>
          <Text style={{ color: colors.cyan400, fontSize: 12, fontWeight: "600" }}>
            Подробнее и changelog →
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}
