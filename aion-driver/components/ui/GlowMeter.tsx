import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  /** 0..1 */
  progress: number;
  className?: string;
};

export function GlowMeter({ progress, className = "" }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View className={`h-2.5 w-full overflow-hidden rounded-full bg-white/8 ${className}`}>
      <LinearGradient
        colors={["#22d3ee", "#818cf8"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: `${p * 100}%`, height: "100%", borderRadius: 999 }}
      />
    </View>
  );
}
