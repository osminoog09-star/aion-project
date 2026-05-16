import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { blur, gradients, radius, shadows } from "../../tokens";
import type { AionSemantic } from "../../tokens/semantic";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const bottomPad = Math.max(insets.bottom, 10);
  const { semantic, resolved } = useTheme();
  const blurTint = resolved === "light" ? "light" : "dark";
  const androidBarBg =
    resolved === "light" ? "rgba(255,255,255,0.94)" : "rgba(2,6,23,0.94)";

  return (
    <View
      className="absolute left-0 right-0 px-5"
      style={{ bottom: 0, paddingBottom: bottomPad, backgroundColor: semantic.canvas }}
      pointerEvents="box-none"
    >
      <View
        className="overflow-hidden"
        style={{
          borderRadius: radius.xxl,
          borderWidth: 1,
          borderColor: semantic.border,
          ...shadows.tabBar,
        }}
      >
        <LinearGradient
          colors={
            resolved === "light"
              ? ([semantic.surface, semantic.surfaceMuted] as const)
              : ([...gradients.cardSurface] as const)
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radius.xxl }}
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={blur.tabBar} tint={blurTint} style={{ borderRadius: radius.xxl }}>
              <BarContent
                semantic={semantic}
                state={state}
                descriptors={descriptors}
                navigation={navigation}
              />
            </BlurView>
          ) : (
            <View style={{ borderRadius: radius.xxl, backgroundColor: androidBarBg }}>
              <BarContent
                semantic={semantic}
                state={state}
                descriptors={descriptors}
                navigation={navigation}
              />
            </View>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

type BarContentProps = Pick<
  BottomTabBarProps,
  "state" | "descriptors" | "navigation"
>;

function BarContent({
  semantic,
  state,
  descriptors,
  navigation,
}: BarContentProps & {
  semantic: AionSemantic;
}) {
  return (
    <View className="flex-row items-center px-1 py-2">
      <Pressable
        accessibilityLabel="Экосистема AION"
        onPress={() => router.push("/home")}
        className="mr-1 items-center justify-center rounded-2xl px-2 py-2 active:opacity-80"
        hitSlop={10}
      >
        <MaterialIcons name="apps" size={24} color={semantic.accent} />
      </Pressable>
      <View className="flex-1 flex-row items-center justify-around">
        {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? String(options.tabBarLabel)
            : options.title ?? route.name;
        const isFocused = state.index === index;
        const color = isFocused ? semantic.accent : semantic.textTertiary;
        const icon =
          route.name === "index"
            ? "dashboard"
            : route.name === "history"
              ? "history"
              : route.name === "import"
                ? "image"
                : route.name === "fleet"
                  ? "directions-car"
                  : route.name === "hub"
                    ? "auto-awesome"
                    : "circle";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            label={label}
            icon={icon as "dashboard" | "history" | "image" | "directions-car" | "auto-awesome" | "circle"}
            color={color}
            active={isFocused}
            accentMuted={semantic.accentMuted}
            onPress={onPress}
          />
        );
      })}
      </View>
    </View>
  );
}

function TabItem({
  label,
  icon,
  color,
  active,
  accentMuted,
  onPress,
}: {
  label: string;
  icon: "dashboard" | "history" | "image" | "directions-car" | "auto-awesome" | "circle";
  color: string;
  active: boolean;
  accentMuted: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 14, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      style={style}
      className="min-w-[72px] flex-1 items-center py-2"
    >
      <View
        className="mb-1 rounded-2xl px-3 py-1"
        style={active ? { backgroundColor: accentMuted } : undefined}
      >
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
