import { Linking } from "react-native";
import type { ApkUpdateManifest } from "./apkManifest.types";

export type ApkDownloadOpenResult =
  | { ok: true; url: string; usedFallback: boolean }
  | { ok: false };

export async function openApkDownload(manifest: ApkUpdateManifest): Promise<ApkDownloadOpenResult> {
  const urls = [manifest.apkUrl, manifest.fallbackApkUrl]
    .filter((url): url is string => Boolean(url))
    .filter((url, index, all) => all.indexOf(url) === index);

  for (const [index, url] of urls.entries()) {
    try {
      await Linking.openURL(url);
      return { ok: true, url, usedFallback: index > 0 };
    } catch {
      // Try the fallback artifact before reporting the failure to the UI.
    }
  }
  return { ok: false };
}
