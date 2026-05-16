import { Stack } from "expo-router";
import { colors } from "../../tokens";

/**
 * Корневой layout платформы AION: хаб экосистемы + вложенные модули (Driver и др.).
 */
export default function AionPlatformLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: "fade",
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="driver" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
