#!/usr/bin/env node
/**
 * Мастер: открывает Google Cloud + Supabase, принимает Client ID/Secret/PAT, пишет .env.local и включает Google в Supabase.
 *   npm run auth:google-wizard
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const PROJECT_REF = "eclrkusmwcrtnxqhzpky";
const SUPABASE_CALLBACK = `https://${PROJECT_REF}.supabase.co/auth/v1/callback`;

const urls = [
  `https://console.cloud.google.com/apis/credentials?project=_`,
  `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/providers?provider=Google`,
];

function openBrowser(url) {
  try {
    if (process.platform === "win32") {
      execSync(`start "" "${url}"`, { stdio: "ignore" });
    } else if (process.platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: "ignore" });
    }
  } catch {
    console.log("Откройте вручную:", url);
  }
}

function upsertEnvLocal(entries) {
  const lines = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    : [];
  const map = new Map();
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  for (const [k, v] of Object.entries(entries)) {
    if (v) map.set(k, v);
  }
  const out = [...map.entries()].map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  fs.writeFileSync(envPath, out, "utf8");
}

async function patchSupabaseGoogle(token, clientId, clientSecret) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_google_enabled: true,
        external_google_client_id: clientId,
        external_google_secret: clientSecret,
      }),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 300)}`);
}

console.log(`
=== AION Driver · Google Sign-In setup ===

1) В Google Cloud создайте OAuth client ID → Web application
   Authorized redirect URI (скопируйте):
   ${SUPABASE_CALLBACK}

2) В Supabase → Google вставьте Client ID и Secret → Save

Открываю браузер…
`);

for (const u of urls) openBrowser(u);

const rl = readline.createInterface({ input, output });

const clientId = await rl.question("\nGoogle Client ID (…apps.googleusercontent.com): ");
const clientSecret = await rl.question("Google Client Secret: ");
let token = await rl.question(
  "Supabase PAT (sbp_…, Enter — пропустить если уже в .env.local): ",
);

rl.close();

const trimmedId = clientId.trim();
const trimmedSec = clientSecret.trim();
if (!trimmedId || !trimmedSec) {
  console.error("Client ID и Secret обязательны.");
  process.exit(1);
}

if (!token.trim() && fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  token = env.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/m)?.[1]?.trim() ?? "";
}

upsertEnvLocal({
  GOOGLE_OAUTH_CLIENT_ID: trimmedId,
  GOOGLE_OAUTH_CLIENT_SECRET: trimmedSec,
  ...(token.trim() ? { SUPABASE_ACCESS_TOKEN: token.trim() } : {}),
});

if (token.trim()) {
  await patchSupabaseGoogle(token.trim(), trimmedId, trimmedSec);
  console.log("\nГотово: Google включён в Supabase. В Driver: OTA → Вход → Google.");
} else {
  console.log(
    "\nСохранено в .env.local. Запустите: npm run supabase:google-auth (нужен SUPABASE_ACCESS_TOKEN).",
  );
}
