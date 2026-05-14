/** Согласован с AION Driver: `aion-driver/src/core/updates/apkManifest.types.ts` */
export type ApkUpdateManifest = {
  latestVersion: string;
  minimumSupported: string;
  runtimeVersion?: string;
  buildNumber?: string;
  apkUrl: string;
  critical?: boolean;
  forceUpdate?: boolean;
  minimumRuntimeVersion?: string;
  rolloutState?: "full" | "staged" | "paused" | "emergency";
  emergency?: boolean;
  downloadSizeLabel?: string;
  releaseDate?: string;
  releaseNotes?: string;
  changelog?: string[];
  fallbackApkUrl?: string;
};
