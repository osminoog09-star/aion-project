import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { DESKTOP_NAV_ITEMS } from "./navConfig";
import { useBreakpoints } from "../../hooks/useBreakpoints";
import { useWorkspaceDensity } from "../../hooks/useWorkspaceDensity";

type Props = {
  children: ReactNode;
  pathname: string;
};

function densityPadding(d: "compact" | "analytics" | "cinematic") {
  if (d === "compact") return 12;
  if (d === "cinematic") return 26;
  return 18;
}

/**
 * Desktop-first workspace shell: persistent sidebar, density modes, keyboard routing (web).
 */
export function DesktopShell({ children, pathname }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { isWide, tier, isUltrawide } = useBreakpoints();
  const { density, setDensity } = useWorkspaceDensity();
  const pad = densityPadding(density);
  const s = theme.semantic;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const shortcuts: Record<string, Href> = {
      "1": "/desktop",
      "2": "/desktop/control-center",
      "3": "/desktop/cloud",
      "4": "/desktop/finance",
      "5": "/desktop/garage",
      "6": "/desktop/maps",
      "7": "/desktop/ai-room",
    };
    const densityOrder = ["compact", "analytics", "cinematic"] as const;
    const onKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (ev.altKey && !ev.repeat && ev.key === "0") {
        ev.preventDefault();
        router.push("/driver");
        return;
      }
      if (ev.altKey && !ev.repeat && (ev.key === "[" || ev.key === "]")) {
        ev.preventDefault();
        const i = densityOrder.indexOf(density);
        const next =
          ev.key === "]"
            ? densityOrder[(i + 1 + densityOrder.length) % densityOrder.length]
            : densityOrder[(i - 1 + densityOrder.length) % densityOrder.length];
        setDensity(next);
        return;
      }
      if (!ev.altKey || ev.repeat) return;
      const dest = shortcuts[ev.key];
      if (!dest) return;
      ev.preventDefault();
      router.push(dest);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, density, setDensity]);

  const sidebarW = isUltrawide ? 276 : isWide ? 252 : tier === "tablet" ? 200 : 0;

  const navPadV = density === "compact" ? 7 : density === "cinematic" ? 11 : 9;

  const navBody = (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8, gap: density === "compact" ? 3 : 5 }}
    >
      {DESKTOP_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== "/desktop" && pathname.startsWith(item.href));
        return (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as Href)}
            style={{
              paddingVertical: navPadV,
              paddingHorizontal: isWide ? 14 : 10,
              borderRadius: 10,
              backgroundColor: active ? s.accentMuted : "transparent",
              borderWidth: 1,
              borderColor: active ? s.borderStrong : "transparent",
            }}
          >
            <Text
              style={{
                color: active ? s.textPrimary : s.textSecondary,
                fontSize: isWide ? 14 : 13,
                fontWeight: active ? "800" : "600",
              }}
              numberOfLines={2}
            >
              {item.label}
            </Text>
            {Platform.OS === "web" && item.shortcut ? (
              <Text style={{ marginTop: 4, fontSize: 10, color: s.textTertiary }}>Alt+{item.shortcut}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const sidebar = sidebarW > 0 && (
    <View
      style={{
        width: sidebarW,
        borderRightWidth: 1,
        borderRightColor: s.border,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 8,
        paddingHorizontal: 10,
        backgroundColor: s.surfaceMuted,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: "900", letterSpacing: 3, color: s.textTertiary }}>AION</Text>
      <Text style={{ marginTop: 4, fontSize: 16, fontWeight: "900", color: s.textPrimary }}>Operations</Text>
      <Text style={{ marginTop: 4, fontSize: 11, color: s.textTertiary }}>
        Alt+[ / ] плотность · Alt+0 кокпит
      </Text>
      <View style={{ height: 14 }} />
      {navBody}
      <Pressable
        onPress={() => router.push("/driver")}
        style={{
          marginTop: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: s.border,
        }}
      >
        <Text style={{ color: s.accent, fontWeight: "800", fontSize: 13 }}>Мобильный кокпит</Text>
        <Text style={{ marginTop: 4, fontSize: 11, color: s.textTertiary }}>Смены, OCR, поле</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/home")} style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
        <Text style={{ color: s.textSecondary, fontSize: 12 }}>Экосистемный хаб</Text>
      </Pressable>
    </View>
  );

  const narrowNav = !isWide && tier !== "tablet" && (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: s.border,
        paddingTop: insets.top + 6,
        paddingHorizontal: pad,
        paddingBottom: 8,
        backgroundColor: s.surfaceMuted,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {DESKTOP_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/desktop" && pathname.startsWith(item.href));
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as Href)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: active ? s.accentMuted : "transparent",
                borderWidth: 1,
                borderColor: active ? s.borderStrong : s.border,
              }}
            >
              <Text style={{ color: active ? s.textPrimary : s.textSecondary, fontSize: 12, fontWeight: "700" }}>
                {item.label.split(" ")[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: s.canvas }}>
      {sidebar}
      <View style={{ flex: 1, minWidth: 0 }}>
        {narrowNav}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: sidebarW > 0 ? insets.top + 8 : 8,
            paddingBottom: 10,
            paddingHorizontal: pad,
            borderBottomWidth: 1,
            borderBottomColor: s.border,
            backgroundColor: s.surface,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: s.textTertiary, letterSpacing: 2 }}>
              WORKSPACE
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: s.textSecondary }}>
              Плотность: {density === "compact" ? "компакт" : density === "cinematic" ? "кино" : "аналитика"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["compact", "analytics", "cinematic"] as const).map((d) => (
              <Pressable
                key={d}
                onPress={() => setDensity(d)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: density === d ? s.borderStrong : s.border,
                  backgroundColor: density === d ? s.accentMuted : "transparent",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: s.textPrimary }}>
                  {d === "compact" ? "Компакт" : d === "cinematic" ? "Кино" : "Аналитика"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={{
            flex: 1,
            padding: pad,
            paddingHorizontal: isUltrawide ? pad + 10 : pad,
            maxWidth: isUltrawide ? 1680 : undefined,
            alignSelf: isUltrawide ? "center" : "stretch",
            width: "100%",
            backgroundColor: s.canvas,
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
