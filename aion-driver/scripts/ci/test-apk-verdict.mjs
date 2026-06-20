import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { deriveApkVerdict } = compileTsModule("features/updates/deriveApkVerdict.ts", {
  "../../src/core/updates/apkManifest.types": {},
  "../../src/core/updates/apkUpdatePolicy": {},
});

const manifest = {
  latestVersion: "1.1.0",
  minimumSupported: "1.0.0",
  apkUrl: "https://example.com/aion.apk",
};

const paused = deriveApkVerdict({
  manifestConfigured: true,
  loading: false,
  manifest: { ...manifest, rolloutState: "paused" },
  evaluation: { reason: "none", critical: false },
});
assert.equal(paused.headline, "Выпуск APK приостановлен");
assert.equal(paused.rolloutPaused, true);
assert.equal(paused.apkBlock, false);

const current = deriveApkVerdict({
  manifestConfigured: true,
  loading: false,
  manifest,
  evaluation: { reason: "none", critical: false },
});
assert.equal(current.headline, "Полная сборка: актуально");
assert.equal(current.rolloutPaused, false);

const critical = deriveApkVerdict({
  manifestConfigured: true,
  loading: false,
  manifest,
  evaluation: { reason: "newer_available", critical: true },
});
assert.equal(critical.headline, "Нужен новый APK (важно)");
assert.equal(critical.apkBlock, true);

const unavailable = deriveApkVerdict({
  manifestConfigured: true,
  loading: false,
  manifest: null,
  evaluation: null,
});
assert.equal(unavailable.headline, "Манифест APK недоступен");
assert.equal(unavailable.apkBlock, false);

console.log("test-apk-verdict: ok (9 assertions)");
