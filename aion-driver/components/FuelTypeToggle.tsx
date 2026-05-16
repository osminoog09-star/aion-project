import { Text, View, Pressable } from "react-native";
import type { FuelKind } from "../types";

type Props = {
  value: FuelKind;
  onChange: (kind: FuelKind) => void;
  disabled?: boolean;
};

export function FuelTypeToggle({ value, onChange, disabled }: Props) {
  return (
    <View className="flex-row rounded-2xl border border-white/10 bg-slate-950/70 p-1">
      <Segment
        label="Бензин"
        active={value === "petrol"}
        disabled={disabled}
        onPress={() => onChange("petrol")}
      />
      <Segment
        label="Газ"
        active={value === "gas"}
        disabled={disabled}
        onPress={() => onChange("gas")}
      />
    </View>
  );
}

function Segment({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`flex-1 rounded-xl py-3 ${active ? "bg-cyan-500/25" : ""}`}
    >
      <Text
        className={`text-center text-sm font-semibold ${
          active ? "text-cyan-100" : "text-slate-500"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
