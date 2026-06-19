const APK_BUILD_PATTERNS = [
  /^aion-driver\/app\.config\.ts$/,
  /^aion-driver\/package\.json$/,
  /^aion-driver\/native-modules\//,
  /^aion-driver\/plugins\//,
];

export function requiresDriverApkBuild(paths) {
  return paths.some((path) => APK_BUILD_PATTERNS.some((pattern) => pattern.test(path.trim())));
}
