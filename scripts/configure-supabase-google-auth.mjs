#!/usr/bin/env node
/**
 * Включает Google provider в Supabase Auth (Management API).
 *
 * Env (любой из файлов через load-dotenv-local):
 *   SUPABASE_ACCESS_TOKEN — PAT https://supabase.com/dashboard/account/tokens
 *   GOOGLE_OAUTH_CLIENT_ID или GOOGLE_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET или GOOGLE_CLIENT_SECRET
 *
 *   npm run supabase:google-auth
 */
import { loadDotenvLocal } from "./load-dotenv-local.mjs";

const PROJECT_REF = "eclrkusmwcrtnxqhzpky";

loadDotenvLocal();

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const clientId = (
  process.env.GOOGLE_OAUTH_CLIENT_ID ??
  process.env.GOOGLE_CLIENT_ID ??
  ""
).trim();
const clientSecret = (
  process.env.GOOGLE_OAUTH_CLIENT_SECRET ??
  process.env.GOOGLE_CLIENT_SECRET ??
  ""
).trim();

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN не задан.");
  process.exit(1);
}
if (!clientId || !clientSecret || clientId.includes("YOUR_")) {
  console.error(
    "GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET не заданы (создайте OAuth Web client в Google Cloud).",
  );
  process.exit(1);
}

const body = {
  external_google_enabled: true,
  external_google_client_id: clientId,
  external_google_secret: clientSecret,
};

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  },
);

const text = await res.text();
let parsed;
try {
  parsed = text ? JSON.parse(text) : null;
} catch {
  parsed = text;
}

if (!res.ok) {
  console.error("PATCH failed", res.status, parsed);
  process.exit(1);
}

console.log("Google auth enabled for", PROJECT_REF);
console.log("external_google_enabled:", parsed?.external_google_enabled ?? true);
