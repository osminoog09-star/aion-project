import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { deriveUpdateEngineView } = compileTsModule("features/updates/updateSystemStateMachine.ts", {
  "../../hooks/useUpdatesController": {},
  "../../src/core/updates/useApkUpdateController": {},
});

const base = {
  dev: false,
  otaEnabled: true,
  netOnline: true,
  otaPhase: "idle",
  otaError: null,
  embeddedLaunch: false,
  emergencyLaunch: false,
  manifestUrlConfigured: true,
  apkLoading: false,
  apkManifestPresent: true,
  apkEval: { reason: "none", critical: false },
  apkManifestStale: false,
  apkLastErrorAtMs: null,
  apkFromCache: false,
};

const cachedIdle = deriveUpdateEngineView({
  ...base,
  apkFromCache: true,
  apkLastErrorAtMs: 1_750_000_000_000,
});
assert.equal(cachedIdle.state, "stale_manifest");
assert.equal(cachedIdle.headline, "Показаны локальные данные APK");
assert.deepEqual([...cachedIdle.badges], ["apk", "cache"]);

const cachedCritical = deriveUpdateEngineView({
  ...base,
  apkFromCache: true,
  apkLastErrorAtMs: 1_750_000_000_000,
  apkEval: { reason: "below_minimum", critical: true },
});
assert.equal(cachedCritical.state, "apk_required", "cached provenance must not hide a critical APK verdict");
assert.equal(cachedCritical.badges.includes("cache"), true);
assert.match(cachedCritical.detail, /решение основано на локальных данных/);

const cachedOptional = deriveUpdateEngineView({
  ...base,
  apkFromCache: true,
  apkLastErrorAtMs: 1_750_000_000_000,
  apkEval: { reason: "newer_available", critical: false },
});
assert.equal(cachedOptional.state, "apk_recommended");
assert.equal(cachedOptional.badges.includes("cache"), true);
assert.match(cachedOptional.detail, /свежий манифест не получен/);

const missing = deriveUpdateEngineView({
  ...base,
  apkManifestPresent: false,
  apkEval: null,
  apkLastErrorAtMs: 1_750_000_000_000,
});
assert.equal(missing.state, "manifest_failed");
assert.equal(missing.badges.includes("cache"), false);

const fresh = deriveUpdateEngineView({
  ...base,
  apkEval: { reason: "newer_available", critical: true },
});
assert.equal(fresh.state, "apk_required");
assert.equal(fresh.badges.includes("cache"), false);
assert.doesNotMatch(fresh.detail, /локальных данных/);

console.log("test-update-system-state: ok (14 assertions)");
