# AION.COM — production (Vercel)

## Prerequisites

- Node 20+ (matches Vercel default)
- Git repo pushed to GitHub/GitLab/Bitbucket (Vercel imports from git)

## Local verify

```bash
npm ci
npm run build
npm run start
```

Copy `.env.example` → `.env.local` for local optional vars.

## Vercel — new project

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import the **`aion-com`** repository (root directory must be repo root if mono-repo, or set **Root Directory** to `aion-com`).
2. **Framework Preset:** Next.js (auto).
3. **Build:** `npm run build` · **Output:** Next default.
4. **Environment Variables** (Production + Preview):

| Name | Required | Notes |
|------|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | Recommended for prod | **`https://www.aion.com`** (канонический хост платформы; см. DOMAIN.md). |
| `NEXT_PUBLIC_APK_MANIFEST_URL` | Optional | Public HTTPS JSON; same contract as Driver `EXPO_PUBLIC_APK_MANIFEST_URL`. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Recommended** | Same project URL as Driver (`EXPO_PUBLIC_SUPABASE_URL`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Recommended** | Publishable or anon key from Supabase (never commit service role). |

## Supabase / shared cloud

- Schema migrations live in **`aion-driver/supabase/migrations/`** (single project for Driver + portal).
- Portal reads **public** rows: `ecosystem_public_snapshots` (`is_public`), published releases, `ecosystem_rollout_state` (`visible_public`). Devices/pairs/activity are **auth-only** (RLS).
- Snapshot kinds: `portal_ecosystem` (roadmap JSON payload), `portal_releases` (optional releases JSON overlay).
- Custom domain steps: **[DOMAIN.md](./DOMAIN.md)** (канон: **www.aion.com**, продукт: **`/aionproject`**).

5. Deploy → note **`.vercel.app`** URL (initial public URL).

## Custom domain (aion.com / www)

1. Project → **Settings** → **Domains** → add `aion.com` and `www.aion.com`.
2. Follow DNS records Vercel shows (usually A/CNAME).
3. Set **`NEXT_PUBLIC_SITE_URL`** to **`https://www.aion.com`** (canonical platform origin) and redeploy.

## Monorepo / root directory

- If the Git repo root is **not** `aion-com`, set Vercel **Root Directory** to `aion-com` so this Next app owns **www.aion.com**; Driver stays a separate EAS deploy, linked from **`/aionproject`**.

## Updates

- Push to default branch → Production deploy.
- PRs → Preview deployments (env: copy from Production or set Preview-specific values).

## Releases / manifest

- Static copy: `src/content/releases.json`.
- Live APK block on `/releases`: set `NEXT_PUBLIC_APK_MANIFEST_URL` to a **public** JSON URL; ISR revalidates every 120s (`fetchPublishedApkManifest`).
- Publish new manifest JSON on your CDN/storage; no code change if shape unchanged.

## Production checklist

- [ ] `npm run build` green on CI or locally before merge
- [ ] `NEXT_PUBLIC_SITE_URL` matches **https://www.aion.com** (or your chosen canonical)
- [ ] `NEXT_PUBLIC_APK_MANIFEST_URL` set if live manifest desired
- [ ] Spot-check `/`, **`/aionproject`**, `/roadmap`, `/releases`, `/control`, `/status`
- [ ] Legacy `/driver` redirects to `/aionproject` (308/301)
- [ ] Share preview URL before pointing DNS
