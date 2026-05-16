import Constants from "expo-constants";

/** Canonical aion.com (or preview) base for deep links from the app — no trailing slash. */
export function getAionPortalBaseUrl(): string {
  const fromEnv =
    typeof process !== "undefined" && typeof process.env.EXPO_PUBLIC_AION_PORTAL_URL === "string"
      ? process.env.EXPO_PUBLIC_AION_PORTAL_URL.trim()
      : "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const extra = Constants.expoConfig?.extra as { aionPortalBaseUrl?: string } | undefined;
  const fromExtra = typeof extra?.aionPortalBaseUrl === "string" ? extra.aionPortalBaseUrl.trim() : "";
  if (fromExtra) return fromExtra.replace(/\/$/, "");
  return "https://aion-com.vercel.app";
}

export function aionPortalControlUrl(): string {
  return `${getAionPortalBaseUrl()}/control`;
}
