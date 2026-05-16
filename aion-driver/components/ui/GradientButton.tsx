import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { gradients, springs, radius } from "../../tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "ghost" | "glass";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Крупная зона нажатия (второй телефон / машина) */
  size?: "default" | "cockpit";
};

export function GradientButton({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  className = "",
  style,
  size = "default",
}: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors =
    variant === "danger"
      ? gradients.buttonDanger
      : variant === "ghost"
        ? gradients.buttonGhost
        : variant === "glass"
          ? gradients.buttonGlass
          : gradients.buttonPrimary;

  const py = size === "cockpit" ? "py-5" : "py-3.5";
  const textSize = size === "cockpit" ? "text-lg" : "text-base";

  const dimmed = Boolean(disabled || loading);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.97, springs.buttonPress);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.buttonRelease);
      }}
      onPress={onPress}
      style={[{ borderRadius: radius.lg, opacity: dimmed ? 0.5 : 1 }, anim, style]}
      className={`overflow-hidden ${className}`}
    >
      <LinearGradient colors={[...colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="relative">
          <Text
            className={`px-5 text-center font-semibold ${py} ${textSize} ${
              variant === "ghost" ? "text-slate-100" : "text-slate-950"
            }`}
          >
            {loading ? " " : title}
          </Text>
          {loading ? (
            <ActivityIndicator
              pointerEvents="none"
              className="absolute left-0 right-0 top-0 bottom-0"
              color={variant === "ghost" || variant === "glass" ? "#e2e8f0" : "#0f172a"}
            />
          ) : null}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}
