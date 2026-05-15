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

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import **`osminoog09-star/aion-project`** (Next.js app at repo root).
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

- Canonical GitHub repo: **`osminoog09-star/aion-project`**. Portal Next.js lives at repo root; Driver is a separate local repo / EAS deploy, linked from **`/aionproject`**.

## Updates

- Push to default branch → Production deploy (Vercel Git integration).
- PRs → Preview deployments (env: copy from Production or set Preview-specific values).

### If new routes return 404 on production (e.g. `/operations/reviews`)

1. **Root cause is almost always a stale production deployment**, not missing code. Verify locally:
   ```bash
   npm run build && npm run verify:routes
   ```
2. **Redeploy** latest `master`/`main`:
   - Vercel Dashboard → project **`aion-com`** (hostname) → Git **`aion-project`** → Deployments → **Redeploy**, or
   - `npx vercel login && npm run deploy:vercel` from this directory (`.vercel/project.json` must match), or
   - GitHub Actions workflow `vercel-production.yml` (set secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
3. Confirm production includes `/operations` (not only subpaths): if `/operations` is 404, the whole Operations section was never deployed.

Project IDs (from linked `.vercel/project.json`): `VERCEL_ORG_ID=team_4I1qT09taD3cqaGmhpCpoCxC`, `VERCEL_PROJECT_ID=prj_ep8i1CoHfHdZKwto8gkF5XStzonK`.

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
