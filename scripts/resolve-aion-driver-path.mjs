/**
 * Resolve aion-driver module — always prefer aion-com/aion-driver/ (AION project).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const portalRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function resolveAionDriverPath() {
  const env = process.env.AION_DRIVER_MODULE_PATH?.trim();
  if (env) {
    const p = path.isAbsolute(env) ? env : path.join(portalRoot, env);
    if (fs.existsSync(path.join(p, "package.json"))) return p;
  }
  const inRepo = path.join(portalRoot, "aion-driver");
  if (fs.existsSync(path.join(inRepo, "package.json"))) return inRepo;
  const sibling = path.join(portalRoot, "../aion-driver");
  if (fs.existsSync(path.join(sibling, "package.json"))) return sibling;
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const p = resolveAionDriverPath();
  if (!p) {
    console.error("aion-driver module not found (tried aion-driver/ and ../aion-driver)");
    process.exit(1);
  }
  console.log(p);
}
