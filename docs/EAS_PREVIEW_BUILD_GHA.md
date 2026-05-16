# EAS Preview Build — GitHub Actions (Primary Path)

**Do not use local `eas` on machines with SSL errors** (`unable to verify the first certificate`).

Governance is working correctly while manifest shows **1.0.4** and portal requires **≥ 1.0.6**.

---

## Step 1 — Trigger (GitHub Actions)

1. Open **Driver** repository Actions (where `aion-driver/.github/workflows` lives).
   - If monorepo: https://github.com/osminoog09-star/aion-project/actions
   - Workflow file: **`EAS Build Android (preview)`**
2. **Run workflow** → branch `main` or `preview`.
3. Requires secret **`EXPO_TOKEN`** on the repository.

After the job completes, open the run **Summary** tab — copy **`BUILD_ID`** (UUID).

Also: download artifact `eas-preview-build-metadata` → `build-id.txt`.

---

## Step 2 — Wait FINISHED (Expo)

https://expo.dev/accounts/osminoog/projects/aion/builds

Status must be **FINISHED** (not IN_PROGRESS / ERRORED).

---

## Step 3 — Complete portal loop

```bash
cd aion-com
npm run apk:complete-loop -- <BUILD_ID>
```

This runs: wait (if still building) → sync manifest → compatibility tests → `release:safety`.

Validate manifest only:

```bash
npm run apk:manifest:validate
```

---

## Step 4 — Deploy manifest

```bash
git add public/apk-manifest.preview.json
git commit -m "chore: sync preview APK manifest 1.0.6"
git push
```

Vercel redeploys portal. Confirm on `/releases` and `/operations/governance`.

Expected manifest fields:

| Field | Expected |
|-------|----------|
| `runtimeVersion` | ≥ `1.0.6` |
| `buildNumber` | ≥ `10` |
| `apkUrl` | real `https://` (not example.com) |
| `compatibilityStatus` | `compatible_with_portal_runtime` |

---

## Step 5 — Device (full APK install)

1. Download APK from `apkUrl` on the phone.
2. Install (**not** OTA-only update).
3. Open **Driver** once (cold start) → heartbeat POST.

---

## Step 6 — Sign-off

```bash
npm run stabilization:signoff -- --require-device --strict
```

**Exit code 0** required.

---

## Step 7 — Runtime activation (only after sign-off)

```bash
npm run release:orchestrate -- --activate-runtime
npm run execution:push-live
```

---

## Quick commands

```bash
npm run eas:build:gha          # print this flow in terminal
npm run stabilization:signoff  # current blocker report
```

---

## Post-sign-off (Phase 5 — no new AI features)

1. Rollback drills (`runtime-recovery.mjs`)
2. Canary rollout design
3. Confidence scoring in governance API

Do **not** start autonomous agents / Hetzner / command center v2 until sign-off is green.
