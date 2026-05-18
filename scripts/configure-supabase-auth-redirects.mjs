#!/usr/bin/env node
/**
 * Добавляет redirect URL для Driver auth (email confirm, OAuth, reset password).
 * Требует Personal Access Token: https://supabase.com/dashboard/account/tokens
 *
 *   set SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/configure-supabase-auth-redirects.mjs
 */
const PROJECT_REF = "eclrkusmwcrtnxqhzpky";

const REQUIRED_REDIRECTS = [
  "aion-driver://auth/callback",
  "exp://**",
  "exp://127.0.0.1:8081/--/auth/callback",
  "exp://localhost:8081/--/auth/callback",
];

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error(
    "SUPABASE_ACCESS_TOKEN не задан. Создайте PAT: https://supabase.com/dashboard/account/tokens",
  );
  process.exit(1);
}

function parseAllowList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const current = await api("/config/auth");
  const existing = parseAllowList(current.uri_allow_list);
  const merged = [...new Set([...existing, ...REQUIRED_REDIRECTS])];
  const uri_allow_list = merged.join(",");

  if (merged.length === existing.length && REQUIRED_REDIRECTS.every((u) => existing.includes(u))) {
    console.log("Redirect URLs уже содержат все нужные записи:");
    merged.forEach((u) => console.log(`  · ${u}`));
    return;
  }

  await api("/config/auth", {
    method: "PATCH",
    body: JSON.stringify({ uri_allow_list }),
  });

  console.log("Обновлено uri_allow_list для", PROJECT_REF);
  merged.forEach((u) => console.log(`  · ${u}`));
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
