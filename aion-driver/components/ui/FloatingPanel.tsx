import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { Platform, View } from "react-native";

export function FloatingPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`overflow-hidden rounded-[28px] border border-white/10 shadow-2xl shadow-cyan-500/10 ${className}`}
    >
      <LinearGradient
        colors={["rgba(15,23,42,0.75)", "rgba(2,6,23,0.92)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ borderRadius: 28 }}
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={38} tint="dark" style={{ borderRadius: 28 }}>
            <View className="px-2 py-2">{children}</View>
          </BlurView>
        ) : (
          <View className="rounded-[28px] bg-slate-950/90 px-2 py-2">
            {children}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
