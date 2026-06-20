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

export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value) return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

function optionalBoolean(o: Record<string, unknown>, key: string): boolean {
  return o[key] == null || typeof o[key] === "boolean";
}

function optionalString(o: Record<string, unknown>, key: string): boolean {
  return o[key] == null || typeof o[key] === "string";
}

export function isApkManifest(v: unknown): v is ApkUpdateManifest {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const apkOk =
    typeof o.latestVersion === "string" &&
    typeof o.minimumSupported === "string" &&
    parseSemver(o.latestVersion) !== null &&
    parseSemver(o.minimumSupported) !== null &&
    !semverLess(o.latestVersion, o.minimumSupported) &&
    isHttpsUrl(o.apkUrl);
  if (!apkOk) return false;
  if (o.fallbackApkUrl != null && !isHttpsUrl(o.fallbackApkUrl)) {
    return false;
  }
  if (!["critical", "forceUpdate", "emergency"].every((key) => optionalBoolean(o, key))) {
    return false;
  }
  if (
    ![
      "runtimeVersion",
      "buildNumber",
      "minimumRuntimeVersion",
      "downloadSizeLabel",
      "releaseType",
      "releaseNotes",
      "easBuildId",
    ].every((key) => optionalString(o, key))
  ) {
    return false;
  }
  if (
    o.rolloutState != null &&
    !["full", "staged", "paused", "emergency"].includes(String(o.rolloutState))
  ) {
    return false;
  }
  if (o.releaseDate != null && (typeof o.releaseDate !== "string" || !Number.isFinite(Date.parse(o.releaseDate)))) {
    return false;
  }
  if (o.changelog != null && (!Array.isArray(o.changelog) || !o.changelog.every((line) => typeof line === "string"))) {
    return false;
  }
  return true;
}
