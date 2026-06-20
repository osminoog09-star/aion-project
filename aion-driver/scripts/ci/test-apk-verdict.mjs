import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const explanation = compileTsModule("features/updates/deriveApkUpdateExplanation.ts", {
  "../../src/core/updates/apkManifest.types": {},
  "../../src/core/updates/apkUpdatePolicy": {},
});
const { deriveApkVerdict } = compileTsModule("features/updates/deriveApkVerdict.ts", {
  "../../src/core/updates/apkManifest.types": {},
  "../../src/core/updates/apkUpdatePolicy": {},
  "./deriveApkUpdateExplanation": explanation,
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
assert.equal(critical.headline, "Обязательное обновление APK");
assert.equal(critical.apkBlock, true);

const belowMinimum = explanation.deriveApkUpdateExplanation({
  manifest,
  evaluation: { reason: "below_minimum", critical: true },
});
assert.equal(belowMinimum.title, "Требуется новый APK");
assert.equal(belowMinimum.mandatory, true);
assert.equal(belowMinimum.actionLabel, "Скачать обязательный APK");

const runtimeMismatch = explanation.deriveApkUpdateExplanation({
  manifest,
  evaluation: { reason: "runtime_mismatch", critical: false },
});
assert.equal(runtimeMismatch.title, "Нужен совместимый APK");
assert.equal(runtimeMismatch.mandatory, false);
assert.match(runtimeMismatch.detail, /снова получать совместимые OTA-обновления/);

const optional = explanation.deriveApkUpdateExplanation({
  manifest,
  evaluation: { reason: "newer_available", critical: false },
});
assert.equal(optional.title, "Доступна новая полная сборка");
assert.equal(optional.actionLabel, "Скачать APK");
assert.equal(optional.mandatory, false);

const unavailable = deriveApkVerdict({
  manifestConfigured: true,
  loading: false,
  manifest: null,
  evaluation: null,
});
assert.equal(unavailable.headline, "Манифест APK недоступен");
assert.equal(unavailable.apkBlock, false);

console.log("test-apk-verdict: ok (18 assertions)");
