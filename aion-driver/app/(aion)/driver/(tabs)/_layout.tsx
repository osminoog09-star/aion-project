import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../../../components/navigation/FloatingTabBar";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDevice } from "../../../../hooks/useDevice";
import { spacing } from "../../../../tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { settings } = useDevice();
  const { canvas } = useTheme();
  const companion = settings.companionMode;
  const insets = useSafeAreaInsets();
  const tabReserve = spacing.tabSceneBottom + Math.max(insets.bottom, 12);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          paddingBottom: tabReserve,
          backgroundColor: canvas,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Пульт", tabBarLabel: "Пульт" }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "История",
          tabBarLabel: "История",
          href: companion ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="import"
        options={{ title: "Импорт", tabBarLabel: "Импорт" }}
      />
      <Tabs.Screen
        name="fleet"
        options={{
          title: "Гараж",
          tabBarLabel: "Гараж",
          href: companion ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: "Хаб",
          tabBarLabel: "Хаб",
          href: companion ? null : undefined,
        }}
      />
    </Tabs>
  );
}
