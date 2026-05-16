import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { Platform, View } from "react-native";

type Props = {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "violet" | "none";
};

export function GlassCard({ children, className = "", glow = "cyan" }: Props) {
  const glowClass =
    glow === "cyan"
      ? "border-cyan-400/25"
      : glow === "violet"
        ? "border-violet-400/25"
        : "border-white/10";

  return (
    <View className={`overflow-hidden rounded-3xl border ${glowClass} ${className}`}>
      <LinearGradient
        colors={["rgba(15,23,42,0.85)", "rgba(2,6,23,0.55)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24 }}
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={32} tint="dark" style={{ borderRadius: 24 }}>
            <View className="p-4">{children}</View>
          </BlurView>
        ) : (
          <View className="rounded-3xl bg-slate-900/85 p-4">{children}</View>
        )}
      </LinearGradient>
    </View>
  );
}
