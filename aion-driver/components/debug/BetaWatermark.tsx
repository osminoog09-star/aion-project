import { Text, View } from "react-native";
import { colors } from "../../tokens";

/** Лёгкий водяной знак для internal / beta APK. */
export function BetaWatermark() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        right: 10,
        bottom: 96,
        zIndex: 50,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: "rgba(15,23,42,0.72)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.25)",
      }}
    >
      <Text style={{ color: colors.cyan400, fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>
        BETA
      </Text>
    </View>
  );
}
