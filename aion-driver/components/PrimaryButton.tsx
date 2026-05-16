import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  className = "",
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors =
    variant === "danger"
      ? (["#fb7185", "#f43f5e"] as const)
      : variant === "ghost"
        ? (["rgba(148,163,184,0.25)", "rgba(148,163,184,0.12)"] as const)
        : (["#22d3ee", "#6366f1"] as const);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      }}
      onPress={onPress}
      style={[animatedStyle, style]}
      className={`overflow-hidden rounded-2xl ${className}`}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="relative">
          <Text
            className={`px-6 py-4 text-center text-base font-semibold ${
              variant === "ghost" ? "text-slate-100" : "text-slate-950"
            }`}
          >
            {loading ? " " : title}
          </Text>
          {loading ? (
            <ActivityIndicator
              pointerEvents="none"
              className="absolute left-0 right-0 top-0 bottom-0"
              color={variant === "ghost" ? "#e2e8f0" : "#0f172a"}
            />
          ) : null}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}
