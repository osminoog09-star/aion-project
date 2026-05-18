#!/usr/bin/env node
/**
 * Печатает шаги для Sign in with Google (Supabase + Google Cloud).
 * Запуск: node scripts/print-google-oauth-setup.mjs
 */
const PROJECT_REF = "eclrkusmwcrtnxqhzpky";
const SUPABASE_CALLBACK = `https://${PROJECT_REF}.supabase.co/auth/v1/callback`;
const APP_REDIRECTS = [
  "aion-driver://auth/callback",
  "exp://**",
];

console.log(`
=== Google OAuth для AION Driver ===

1) Google Cloud Console → APIs & Services → Credentials
   → Create OAuth client ID → Web application
   Authorized redirect URIs (обязательно):
     ${SUPABASE_CALLBACK}

2) Supabase Dashboard → Authentication → Providers → Google
   https://supabase.com/dashboard/project/${PROJECT_REF}/auth/providers?provider=Google
   • Enable Sign in with Google
   • Client ID (Web) — из Google Cloud
   • Client Secret — из Google Cloud
   • Save

3) Supabase → Authentication → URL Configuration
   Redirect URLs (уже должны быть):
${APP_REDIRECTS.map((u) => `     • ${u}`).join("\n")}

4) Driver: кнопка «Google» на экране входа.
   После OTA: перезапуск приложения.
   intentFilters для Android — в следующем native build (не только OTA).

5) Проверка: войти через Google → Настройки → email аккаунта, очередь синка = 0.
`);
