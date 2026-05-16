/**
 * Release safety — keep in sync with Проекты/shared/runtime-compatibility.ts
 */

export type RuntimeRequirement = {
  minRuntimeVersion: string;
  minAppVersion?: string;
  minVersionCode?: number;
  requiredFeatures: string[];
  requiredRoutes: string[];
  requiresNativeBuild?: boolean;
};

export type DeviceBuildInfo = {
  appVersion: string;
  runtimeVersion: string;
  versionCode?: number;
  gitSha?: string;
  buildTimestamp?: string;
  features: string[];
  routes: string[];
  channel?: string;
  updateId?: string;
};

export type CompatibilityResult = {
  compatible: boolean;
  missingFeatures: string[];
  missingRoutes: string[];
  upgradeRequired: boolean;
  reasonRu: string;
  versionGap?: { field: string; required: string; actual: string };
};

export function parseSemver(v: string): [number, number, number] {
  const parts = v.trim().split(".").map((p) => Number.parseInt(p, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export function semverGte(a: string, b: string): boolean {
  const [am, ai, ap] = parseSemver(a);
  const [bm, bi, bp] = parseSemver(b);
  if (am !== bm) return am > bm;
  if (ai !== bi) return ai > bi;
  return ap >= bp;
}

export function validateCompatibility(
  requirements: RuntimeRequirement,
  device: DeviceBuildInfo | null | undefined,
): CompatibilityResult {
  if (!device?.runtimeVersion) {
    return {
      compatible: false,
      missingFeatures: requirements.requiredFeatures,
      missingRoutes: requirements.requiredRoutes,
      upgradeRequired: true,
      reasonRu: "Нет данных о сборке приложения — обновите Driver APK/OTA.",
    };
  }

  if (!semverGte(device.runtimeVersion, requirements.minRuntimeVersion)) {
    return {
      compatible: false,
      missingFeatures: [],
      missingRoutes: [],
      upgradeRequired: true,
      reasonRu: `Сборка устарела: runtime ${device.runtimeVersion}, нужен ≥ ${requirements.minRuntimeVersion}.`,
      versionGap: {
        field: "runtimeVersion",
        required: requirements.minRuntimeVersion,
        actual: device.runtimeVersion,
      },
    };
  }

  if (
    requirements.minAppVersion &&
    device.appVersion &&
    !semverGte(device.appVersion, requirements.minAppVersion)
  ) {
    return {
      compatible: false,
      missingFeatures: [],
      missingRoutes: [],
      upgradeRequired: true,
      reasonRu: `Версия приложения ${device.appVersion} < ${requirements.minAppVersion}.`,
      versionGap: {
        field: "appVersion",
        required: requirements.minAppVersion,
        actual: device.appVersion,
      },
    };
  }

  if (
    requirements.minVersionCode != null &&
    (device.versionCode == null || device.versionCode < requirements.minVersionCode)
  ) {
    return {
      compatible: false,
      missingFeatures: [],
      missingRoutes: [],
      upgradeRequired: true,
      reasonRu: `Android versionCode ${device.versionCode ?? "?"} < ${requirements.minVersionCode}.`,
      versionGap: {
        field: "versionCode",
        required: String(requirements.minVersionCode),
        actual: String(device.versionCode ?? "?"),
      },
    };
  }

  const featureSet = new Set(device.features ?? []);
  const missingFeatures = requirements.requiredFeatures.filter((f) => !featureSet.has(f));
  const routeSet = new Set(device.routes ?? []);
  const missingRoutes = requirements.requiredRoutes.filter((r) => !routeSet.has(r));

  if (missingFeatures.length || missingRoutes.length) {
    return {
      compatible: false,
      missingFeatures,
      missingRoutes,
      upgradeRequired: true,
      reasonRu:
        missingFeatures.length && missingRoutes.length
          ? `В сборке нет функций (${missingFeatures.join(", ")}) и экранов (${missingRoutes.join(", ")}).`
          : missingFeatures.length
            ? `В сборке нет функций: ${missingFeatures.join(", ")}.`
            : `В сборке нет экранов: ${missingRoutes.join(", ")}.`,
    };
  }

  return {
    compatible: true,
    missingFeatures: [],
    missingRoutes: [],
    upgradeRequired: false,
    reasonRu: "Сборка совместима с текущим runtime портала.",
  };
}
