import { getAionPortalBaseUrl } from "./aionPortalUrl";

/** Public JSON манифест preview APK на портале (после sync + deploy). */
export function getApkManifestUrl(): string {
  const fromEnv =
    typeof process !== "undefined" && typeof process.env.EXPO_PUBLIC_APK_MANIFEST_URL === "string"
      ? process.env.EXPO_PUBLIC_APK_MANIFEST_URL.trim()
      : "";
  if (fromEnv) return fromEnv;
  return `${getAionPortalBaseUrl()}/apk-manifest.preview.json`;
}
