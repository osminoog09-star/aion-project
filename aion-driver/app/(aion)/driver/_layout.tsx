import { Stack } from "expo-router";

/**
 * Модуль Driver: табы кокпита (смены, импорт, гараж, …).
 */
export default function DriverModuleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="route-timeline" />
    </Stack>
  );
}
