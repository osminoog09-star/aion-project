#!/usr/bin/env node
/**
 * Проверка Google OAuth + Supabase Auth для AION Driver.
 *   npm run auth:verify
 */
import { loadDotenvLocal, maskEnv } from "./load-dotenv-local.mjs";

const PROJECT_REF = "eclrkusmwcrtnxqhzpky";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const GOOGLE_CALLBACK = `${SUPABASE_URL}/auth/v1/callback`;
const APP_REDIRECT = "aion-driver://auth/callback";
const REQUIRED_REDIRECTS = [APP_REDIRECT, "exp://**"];

loadDotenvLocal();

const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const pat = process.env.SUPABASE_ACCESS_TOKEN?.trim();

const checks = [];

function pass(name, detail) {
  checks.push({ ok: true, name, detail });
}
function fail(name, detail) {
  checks.push({ ok: false, name, detail });
}

if (!anon) {
  fail("anon key", "NEXT_PUBLIC_SUPABASE_ANON_KEY не задан");
} else {
  pass("anon key", maskEnv(["NEXT_PUBLIC_SUPABASE_ANON_KEY"]).NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

if (pat) {
  pass("SUPABASE_ACCESS_TOKEN", maskEnv(["SUPABASE_ACCESS_TOKEN"]).SUPABASE_ACCESS_TOKEN);
} else {
  fail("SUPABASE_ACCESS_TOKEN", "нет в .env.local — только ручная настройка Dashboard");
}

const googleId = (
  process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? ""
).trim();
if (googleId.includes("googleusercontent.com") && !googleId.includes("YOUR_")) {
  pass("GOOGLE_OAUTH_CLIENT_ID", `${googleId.slice(0, 20)}…`);
} else {
  fail("GOOGLE_OAUTH_CLIENT_ID", "не задан в .env.local");
}

if (pat) {
  try {
    const cfgRes = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      { headers: { Authorization: `Bearer ${pat}` } },
    );
    const cfg = await cfgRes.json();
    if (!cfgRes.ok) {
      fail("Supabase auth config", `${cfgRes.status}`);
    } else {
      if (cfg.external_google_enabled) {
        pass("Supabase Google", "enabled");
      } else {
        fail("Supabase Google", "выключен — npm run supabase:google-auth");
      }
      const allow = (cfg.uri_allow_list ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const u of REQUIRED_REDIRECTS) {
        if (allow.includes(u)) pass(`redirect allow: ${u}`, "ok");
        else fail(`redirect allow: ${u}`, "добавьте: npm run supabase:auth-redirects");
      }
      const remoteId = cfg.external_google_client_id ?? "";
      if (remoteId && googleId && remoteId !== googleId) {
        fail(
          "Client ID sync",
          ".env.local не совпадает с Supabase — обновите npm run supabase:google-auth",
        );
      } else if (remoteId) {
        pass("Client ID sync", "Supabase ↔ .env.local");
      }
    }
  } catch (e) {
    fail("Supabase Management API", e.message ?? String(e));
  }
}

if (anon) {
  try {
    const authRes = await fetch(
      `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(APP_REDIRECT)}`,
      {
        redirect: "manual",
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      },
    );
    const loc = authRes.headers.get("location") ?? "";
    if (authRes.status === 302 && loc.includes("accounts.google.com")) {
      const u = new URL(loc);
      const uri = u.searchParams.get("redirect_uri");
      const cid = u.searchParams.get("client_id") ?? "";
      if (uri === GOOGLE_CALLBACK) {
        pass("OAuth authorize", `redirect_uri ok, client …${cid.slice(-20)}`);
      } else {
        fail("OAuth redirect_uri", `ожидали ${GOOGLE_CALLBACK}, получили ${uri}`);
      }
    } else {
      fail("OAuth authorize", `status ${authRes.status}`);
    }
  } catch (e) {
    fail("OAuth authorize", e.message ?? String(e));
  }
}

console.log(`\n=== AION Driver · auth:verify (${PROJECT_REF}) ===\n`);
console.log(`Google Cloud redirect URI (Web client):\n  ${GOOGLE_CALLBACK}\n`);
let failed = 0;
for (const c of checks) {
  const mark = c.ok ? "✓" : "✗";
  console.log(`${mark} ${c.name}: ${c.detail}`);
  if (!c.ok) failed++;
}
console.log(failed ? `\n${failed} проверок не прошло.\n` : "\nВсе проверки пройдены.\n");
process.exit(failed ? 1 : 0);
