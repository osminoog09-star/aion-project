# Stabilization Sign-Off Runbook

**Goal:** close the real-world operational loop (APK → device → governance green).  
**Not in scope:** new AI features, command center v2, Hetzner workers.

Current blocker: **published APK manifest is 1.0.4**, portal requires **≥ 1.0.6**. SAFE MODE is **correct**.

---

## Phase A — Real APK completion

### A1. Driver manifest

```bash
cd aion-driver
npm run build:manifest
npm run validate:code
npm run native:check
```

Expected: `build-manifest.json` → `1.0.6`, `versionCode` 10.

### A2. EAS preview build — **GitHub Actions ONLY**

**Do not run local `eas:preview`** if you see:

```txt
eas whoami → unable to verify the first certificate
```

**Primary path** (full doc: `docs/EAS_PREVIEW_BUILD_GHA.md`):

```bash
cd aion-com && npm run eas:build:gha
```

1. GitHub Actions → **EAS Build Android (preview)** → Run workflow
2. Job **Summary** → copy **BUILD_ID** (or artifact `build-id.txt`)
3. [Expo builds](https://expo.dev/accounts/osminoog/projects/aion/builds) → wait **FINISHED**

### A3. Wait FINISHED

```bash
cd ../aion-com
node scripts/wait-eas-build.mjs <EAS_BUILD_ID>
```

Or one-shot after build started:

```bash
npm run apk:complete-loop -- <EAS_BUILD_ID>
```

### A4. Sync manifest

```bash
npm run release:apk-manifest:sync <EAS_BUILD_ID>
git add public/apk-manifest.preview.json
git commit -m "chore: sync preview APK manifest 1.0.6"
git push
```

Verify:

- `runtimeVersion` ≥ `1.0.6`
- `buildNumber` ≥ `10`
- `apkUrl` is real HTTPS (not `example.com`)
- `compatibilityStatus` → `compatible_with_portal_runtime`

### A5. Portal deploy

Push triggers Vercel. Confirm env on production:

- `OPERATIONS_SUPABASE_SERVICE_ROLE_KEY`
- `OPERATIONS_OWNER_SECRET`

---

## Phase B — Real device validation

1. **Install** preview APK from `apkUrl` (full install, **not OTA-only**).
2. **Open** Driver app (cold start).
3. App POSTs heartbeat + features/routes to portal.

Verify locally or on prod:

```bash
cd aion-com
npm run stabilization:signoff
```

Or strict (fails until device seen):

```bash
npm run stabilization:signoff -- --require-device --strict
```

Targets:

| Check | Target |
|-------|--------|
| Heartbeat age | < 60 s |
| `device.runtimeVersion` | ≥ 1.0.6 |
| Features | all `requiredFeatures` present |
| Routes | all `requiredRoutes` present |

---

## Phase C — Runtime activation

**Only after** Phase A + B green:

```bash
npm run release:orchestrate -- --activate-runtime
npm run execution:push-live
```

Governance gate blocks `deploying` / `completed` / `waiting_approval` if APK or heartbeat fail.

---

## Phase D — Sign-off validation

```bash
npm run stabilization:signoff -- --strict
```

Report: `src/content/stabilization-signoff-status.json`

### Criteria checklist

| # | Area | Requirement |
|---|------|-------------|
| 1 | Runtime truth | No fake live; stale detected; Supabase live when env set |
| 2 | Compatibility | APK + device compatible; SAFE MODE off |
| 3 | Runtime health | Heartbeat < 60 s on active work |
| 4 | Release safety | `release:safety` green |
| 5 | Recovery | `runtime:recover`, stale-recover, release recovery scripts tested |

Manual UI checks:

- https://aion-com.vercel.app/operations/governance — all green
- https://aion-com.vercel.app/operations/live — no SAFE MODE banner
- `/operations/validation` — 8/8 flows enabled

---

## Phase E — Post-stabilization (after sign-off only)

Do **not** start until `stabilization:signoff --strict` exits 0.

1. Rollback drills: `node scripts/runtime-recovery.mjs --mode release|deploy`
2. Canary rollout design (staged %, health gates) — future PR
3. Runtime confidence score — combine heartbeat + release + CI + deploy in governance API

---

## Quick reference

```bash
# Driver
cd aion-driver && npm run build:manifest && npm run eas:preview

# Portal (after FINISHED)
cd aion-com
npm run apk:wait -- <BUILD_ID>
npm run release:apk-manifest:sync <BUILD_ID>
npm run apk:complete-loop -- <BUILD_ID>    # wait + sync + safety

# Device → sign-off
npm run stabilization:signoff -- --strict
npm run release:orchestrate -- --activate-runtime
```

---

*Update `docs/system-audit-report.md` §14 checkboxes when sign-off passes.*
