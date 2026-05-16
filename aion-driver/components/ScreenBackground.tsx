import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export function ScreenBackground({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-void">
      <LinearGradient
        colors={["#020617", "#0b1224", "#020617"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-0 bg-cyan-500/5" pointerEvents="none" />
      {children}
    </View>
  );
}
