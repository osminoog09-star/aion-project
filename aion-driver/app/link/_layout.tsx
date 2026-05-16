import { Stack } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

export default function LinkLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.canvas },
        animation: "fade",
      }}
    />
  );
}
