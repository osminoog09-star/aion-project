/** Согласован с AION Driver: `aion-driver/src/core/updates/apkManifest.types.ts` */
export type ApkUpdateManifest = {
  latestVersion: string;
  minimumSupported: string;
  runtimeVersion?: string;
  apkUrl: string;
  critical?: boolean;
  downloadSizeLabel?: string;
  releaseDate?: string;
  changelog?: string[];
};
