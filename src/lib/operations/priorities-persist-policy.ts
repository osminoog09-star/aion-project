export function shouldAllowPrioritiesFilesystemWrite(env: NodeJS.ProcessEnv): boolean {
  return env.OPERATIONS_ALLOW_FS_WRITE !== "0" &&
    (!env.VERCEL || env.OPERATIONS_ALLOW_FS_WRITE === "1");
}
