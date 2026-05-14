import type { ApkUpdateManifest } from "./apkManifestTypes";

export async function fetchPublishedApkManifest(): Promise<ApkUpdateManifest | null> {
  const url = process.env.NEXT_PUBLIC_APK_MANIFEST_URL?.trim();
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const j = (await res.json()) as unknown;
    if (!j || typeof j !== "object") return null;
    const o = j as Record<string, unknown>;
    if (
      typeof o.latestVersion === "string" &&
      typeof o.minimumSupported === "string" &&
      typeof o.apkUrl === "string" &&
      /^https?:\/\//i.test(o.apkUrl)
    ) {
      return j as ApkUpdateManifest;
    }
    return null;
  } catch {
    return null;
  }
}
