import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const manifest = {
  latestVersion: "1.0.9",
  minimumSupported: "1.0.6",
  apkUrl: "https://primary.example.com/aion.apk",
  fallbackApkUrl: "https://fallback.example.com/aion.apk",
};

function compileOpener(openURL) {
  return compileTsModule(
    "src/core/updates/openApkDownload.ts",
    { "react-native": { Linking: { openURL } }, "./apkManifest.types": {} },
  ).openApkDownload;
}

const primaryCalls = [];
const primaryResult = await compileOpener(async (url) => primaryCalls.push(url))(manifest);
assert.deepEqual(JSON.parse(JSON.stringify(primaryCalls)), [manifest.apkUrl]);
assert.deepEqual(JSON.parse(JSON.stringify(primaryResult)), {
  ok: true,
  url: manifest.apkUrl,
  usedFallback: false,
});

const fallbackCalls = [];
const fallbackResult = await compileOpener(async (url) => {
  fallbackCalls.push(url);
  if (url === manifest.apkUrl) throw new Error("primary unavailable");
})(manifest);
assert.deepEqual(JSON.parse(JSON.stringify(fallbackCalls)), [manifest.apkUrl, manifest.fallbackApkUrl]);
assert.deepEqual(JSON.parse(JSON.stringify(fallbackResult)), {
  ok: true,
  url: manifest.fallbackApkUrl,
  usedFallback: true,
});

const failureCalls = [];
const failed = await compileOpener(async (url) => {
  failureCalls.push(url);
  throw new Error("unavailable");
})(manifest);
assert.deepEqual(JSON.parse(JSON.stringify(failureCalls)), [manifest.apkUrl, manifest.fallbackApkUrl]);
assert.deepEqual(JSON.parse(JSON.stringify(failed)), { ok: false });

let duplicateCalls = 0;
const duplicateFailed = await compileOpener(async () => {
  duplicateCalls += 1;
  throw new Error("unavailable");
})({ ...manifest, fallbackApkUrl: manifest.apkUrl });
assert.equal(duplicateCalls, 1, "duplicate fallback URL should not be opened twice");
assert.deepEqual(JSON.parse(JSON.stringify(duplicateFailed)), { ok: false });

console.log("test-apk-download-open: ok (8 assertions)");
