import { existsSync } from "node:fs";
import path from "node:path";

/** Canonical AION project root (portal package). */
export const AION_PROJECT_ROOT = process.cwd();

/** Module path: always prefer aion-driver/ inside AION project. */
export function resolveAionDriverPath(): string {
  const env = process.env.AION_DRIVER_MODULE_PATH?.trim();
  if (env) {
    const p = path.isAbsolute(env) ? env : path.join(AION_PROJECT_ROOT, env);
    if (existsSync(path.join(p, "package.json"))) return p;
  }
  const inProject = path.join(AION_PROJECT_ROOT, "aion-driver");
  if (existsSync(path.join(inProject, "package.json"))) return inProject;
  const legacySibling = path.join(AION_PROJECT_ROOT, "../aion-driver");
  if (existsSync(path.join(legacySibling, "package.json"))) return legacySibling;
  throw new Error(
    "aion-driver module not found. Expected aion-com/aion-driver/ inside AION project.",
  );
}
