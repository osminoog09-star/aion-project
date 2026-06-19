import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const updatesStub = {
  isEnabled: true,
  channel: "preview",
  runtimeVersion: "1.0.9",
  updateId: "running-update",
};

const { extractUpdateManifestSummary } = compileTsModule("services/updateService.ts", {
  "expo-haptics": {
    NotificationFeedbackType: { Success: "success" },
    notificationAsync: async () => {},
  },
  "expo-system-ui": { setBackgroundColorAsync: async () => {} },
  "expo-updates": updatesStub,
  "react-native": { Platform: { OS: "android" } },
  "../storage/core/otaTestFlags": {
    consumeOtaSimulateFetchFailOnce: async () => false,
    getOtaSimulateOffline: async () => false,
  },
  "../storage/core/aionTimelineStorage": { appendAionTimelineEvent: () => {} },
  "../features/updates/postUpdateCelebration": { markPostUpdateCelebrationPending: async () => {} },
});

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const easManifest = {
  id: "ota-2026-06-19",
  createdAt: "2026-06-19T11:00:00.000Z",
  runtimeVersion: "1.0.9",
  launchAsset: { key: "bundle" },
  assets: [{ key: "asset-1" }, { key: "asset-2" }],
  metadata: {
    message: "Новое:\n- OTA smoke из field validation\nФиксы:\n- retry transient build:view",
  },
  extra: {
    ota: {
      commitHash: "16908a6",
    },
  },
};

const summary = extractUpdateManifestSummary(easManifest);
assert.ok(summary, "EAS manifest should produce a summary");
assert.equal(summary.updateId, "ota-2026-06-19");
assert.equal(summary.createdAt, "2026-06-19T11:00:00.000Z");
assert.equal(summary.runtimeVersion, "1.0.9");
assert.equal(summary.bundleParts, 3);
assert.equal(summary.commitHash, "16908a6");
assert.deepEqual(plain(summary.newFeatures), ["OTA smoke из field validation"]);
assert.deepEqual(plain(summary.bugFixes), ["retry transient build:view"]);

const nestedManifest = {
  id: "ota-nested",
  createdAt: "2026-06-19T12:00:00.000Z",
  runtimeVersion: "1.0.9",
  launchAsset: {},
  extra: {
    expoClient: {
      extra: {
        ota: {
          message: "Features:\n* nested release notes",
          gitCommit: "nested-commit",
        },
      },
    },
  },
};

const nested = extractUpdateManifestSummary(nestedManifest);
assert.equal(nested?.releaseMessage, "Features:\n* nested release notes");
assert.equal(nested?.commitHash, "nested-commit");
assert.deepEqual(plain(nested?.newFeatures), ["nested release notes"]);

const embedded = extractUpdateManifestSummary({
  id: "embedded-id",
  commitTime: Date.UTC(2026, 5, 19, 13, 0, 0),
});
assert.equal(embedded?.updateId, "embedded-id");
assert.equal(embedded?.createdAt, "2026-06-19T13:00:00.000Z");
assert.equal(embedded?.bundleParts, 1);

console.log("test-ota-manifest-summary: ok");
