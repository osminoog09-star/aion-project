#!/usr/bin/env node
/**
 * Publish EAS OTA to channel preview (aion-driver). Needs EXPO_TOKEN in .env.local.
 * Usage: node scripts/publish-driver-ota-preview.mjs [--message "..."]
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotenvLocal } from "./load-dotenv-local.mjs";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

const portalRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const driverRoot = resolveAionDriverPath() ?? path.join(portalRoot, "aion-driver");

loadDotenvLocal();
const token = process.env.EXPO_TOKEN?.trim();
if (!token) {
  console.error("EXPO_TOKEN missing in .env.local — add from expo.dev/settings/access-tokens");
  process.exit(1);
}

const msgArg = process.argv.find((a) => a.startsWith("--message="));
const message =
  msgArg?.slice("--message=".length) ??
  "OTA preview: заправка вручную (сумма+литры), field validation UX";

const bin = process.platform === "win32" ? "npx.cmd" : "npx";
execFileSync(
  bin,
  ["eas-cli@latest", "update", "--channel", "preview", "--message", message, "--non-interactive"],
  {
    cwd: driverRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      EXPO_TOKEN: token,
      EXPO_PUBLIC_GIT_COMMIT: process.env.EXPO_PUBLIC_GIT_COMMIT ?? "local",
      EXPO_PUBLIC_AION_PORTAL_URL:
        process.env.EXPO_PUBLIC_AION_PORTAL_URL ?? "https://aion-com.vercel.app",
      NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" "),
    },
  },
);

console.log("\n[OTA] Published to channel preview. On device: Settings → Центр обновлений → проверить OTA.\n");
