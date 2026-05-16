import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { Platform, Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { blur, gradients, radius, springs, shadows, type GlowVariant } from "../../tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: ReactNode;
  className?: string;
  glow?: GlowVariant;
  onPress?: () => void;
};

const borderFor: Record<GlowVariant, string> = {
  cyan: "border-cyan-400/20",
  violet: "border-violet-400/20",
  neutral: "border-white/10",
};

export function GlowCard({ children, className = "", glow = "neutral", onPress }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const inner = (
    <LinearGradient
      colors={[...gradients.cardSurface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.xl }}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={blur.card} tint="dark" style={{ borderRadius: radius.xl }}>
          <View className="p-4">{children}</View>
        </BlurView>
      ) : (
        <View className="p-4" style={{ borderRadius: radius.xl, backgroundColor: "rgba(15,23,42,0.88)" }}>
          {children}
        </View>
      )}
    </LinearGradient>
  );

  const wrap = (
    <View
      className={`overflow-hidden border ${borderFor[glow]} ${className}`}
      style={{ borderRadius: radius.xl, ...shadows.card }}
    >
      {inner}
    </View>
  );

  if (!onPress) return wrap;

  return (
    <AnimatedPressable
      style={anim}
      onPressIn={() => {
        scale.value = withSpring(0.985, springs.cardPress);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.cardRelease);
      }}
      onPress={onPress}
    >
      {wrap}
    </AnimatedPressable>
  );
}
