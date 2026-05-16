/**
 * Primary EAS path: GitHub Actions (local eas blocked by SSL on this machine).
 * Does NOT call eas CLI locally.
 */
const REPO = "osminoog09-star/aion-project";
const WORKFLOW = "eas-build-driver-preview.yml";
const EXPO_BUILDS = "https://expo.dev/accounts/osminoog/projects/aion/builds";

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  AION Preview APK — GitHub Actions (PRIMARY PATH)                ║
╚══════════════════════════════════════════════════════════════════╝

Local \`eas whoami\` is BLOCKED (SSL certificate). Do NOT retry local EAS.

── Step 1: Trigger build ──────────────────────────────────────────

  GitHub → https://github.com/${REPO}/actions
  Workflow: "EAS Build Driver (preview)" (eas-build-driver-preview.yml)
  Module: aion-driver/ INSIDE aion-project (not a separate repo)
  → Run workflow on branch master

  Requires: EXPO_TOKEN + aion-driver/ folder pushed to aion-project

  Optional (curl, if you have a PAT with actions:write):
    curl -X POST \\
      -H "Authorization: Bearer $GITHUB_TOKEN" \\
      -H "Accept: application/vnd.github+json" \\
      https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches \\
      -d '{"ref":"main"}'

── Step 2: Wait FINISHED ──────────────────────────────────────────

  Expo dashboard: ${EXPO_BUILDS}
  Copy BUILD_ID (UUID) from finished build.

  Portal (after FINISHED):
    cd aion-com
    npm run apk:complete-loop -- <BUILD_ID>

── Step 3: Deploy manifest ────────────────────────────────────────

    git add public/apk-manifest.preview.json
    git commit -m "chore: sync preview APK manifest 1.0.6"
    git push

── Step 4: Device (NOT OTA) ───────────────────────────────────────

  Install APK from apkUrl → open Driver → heartbeat < 60s

── Step 5: Sign-off ───────────────────────────────────────────────

    npm run stabilization:signoff -- --require-device --strict

  Exit 0 → then only:

    npm run release:orchestrate -- --activate-runtime
    npm run execution:push-live

Runbook: docs/stabilization-signoff-runbook.md
`);
