import type { StyleProp, TextStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

type Props = {
  value: string;
  className?: string;
  style?: StyleProp<TextStyle>;
};

/** Лёгкий fade при смене значения. */
export function AnimatedCounter({ value, className = "", style }: Props) {
  return (
    <Animated.Text
      key={value}
      entering={FadeIn.duration(280)}
      className={className}
      style={style}
    >
      {value}
    </Animated.Text>
  );
}
