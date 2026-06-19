import { parseSemver, semverLess } from "./semverCompare";

/**
 * Удалённый манифест полного APK (JSON). Источник: Supabase / CDN / статический URL.
 * Поля расширяемы — неизвестные ключи игнорируются в UI, но сохраняются при парсинге.
 */
export type ApkUpdateManifest = {
  latestVersion: string;
  minimumSupported: string;
  /** Должен совпадать с runtimeVersion EAS, если указан — иначе рекомендуем APK. */
  runtimeVersion?: string;
  /** Нативный build / CI number (опционально). */
  buildNumber?: string;
  apkUrl: string;
  critical?: boolean;
  /** Жёстко требовать APK (даже если semver «мягкий»). */
  forceUpdate?: boolean;
  /** Минимальный runtime native-слоя (если задан — сравниваем с текущим). */
  minimumRuntimeVersion?: string;
  rolloutState?: "full" | "staged" | "paused" | "emergency";
  emergency?: boolean;
  /** Примерная строка для UI (байты часто неизвестны на клиенте). */
  downloadSizeLabel?: string;
  releaseDate?: string;
  /** Например `test` для внутренних проверок доставки APK (опционально, для портала/операторов). */
  releaseType?: string;
  releaseNotes?: string;
  changelog?: string[];
  /** Запасной URL, если основной недоступен. */
  fallbackApkUrl?: string;
  easBuildId?: string;
};

export function isApkManifest(v: unknown): v is ApkUpdateManifest {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const apkOk =
    typeof o.latestVersion === "string" &&
    typeof o.minimumSupported === "string" &&
    parseSemver(o.latestVersion) !== null &&
    parseSemver(o.minimumSupported) !== null &&
    !semverLess(o.latestVersion, o.minimumSupported) &&
    typeof o.apkUrl === "string" &&
    /^https?:\/\//i.test(o.apkUrl);
  if (!apkOk) return false;
  if (o.fallbackApkUrl != null && typeof o.fallbackApkUrl === "string" && !/^https?:\/\//i.test(o.fallbackApkUrl)) {
    return false;
  }
  return true;
}
