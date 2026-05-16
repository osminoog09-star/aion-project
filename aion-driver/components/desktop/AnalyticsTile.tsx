import { memo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  value: string;
  hint?: string;
  /** Web hover affordance */
  onPress?: () => void;
  children?: ReactNode;
};

export const AnalyticsTile = memo(function AnalyticsTile({ title, value, hint, onPress, children }: Props) {
  const inner = (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 2, opacity: 0.65 }}>{title}</Text>
      <Text style={{ fontSize: 22, fontWeight: "800" }} numberOfLines={2}>
        {value}
      </Text>
      {hint ? (
        <Text style={{ fontSize: 11, opacity: 0.55 }} numberOfLines={3}>
          {hint}
        </Text>
      ) : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 140,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 14, borderWidth: 1 }}>{inner}</View>
  );
});
