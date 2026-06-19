export function buildSyncedApkReleaseNotes({
  appVersion,
  buildNumber,
  runtimeVersion,
  buildId,
  gitCommitHash,
}) {
  const commit = gitCommitHash || "unknown";
  return `Preview APK ${appVersion} build ${buildNumber}. Runtime ${runtimeVersion}. Direct artifact URL verified from FINISHED EAS build ${buildId} (${commit}).`;
}
