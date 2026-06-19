import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const storage = new Map();
const asyncStorage = {
  getItem: async (key) => storage.get(key) ?? null,
  setItem: async (key, value) => storage.set(key, value),
};
const semver = compileTsModule("src/core/updates/semverCompare.ts");
const manifestTypes = compileTsModule("src/core/updates/apkManifest.types.ts", {
  "./semverCompare": semver,
});

const urlA = "https://a.example.com/apk.json";
const urlB = "https://b.example.com/apk.json";
const urlC = "https://c.example.com/apk.json";
const manifestA = { latestVersion: "1.0.9", minimumSupported: "1.0.6", apkUrl: "https://a.example.com/a.apk" };
const manifestB = { latestVersion: "1.1.0", minimumSupported: "1.0.9", apkUrl: "https://b.example.com/b.apk" };
let networkCalls = 0;

function compileFetcher(fetchImpl) {
  return compileTsModule(
    "src/core/updates/fetchApkManifest.ts",
    {
      "@react-native-async-storage/async-storage": asyncStorage,
      "./apkManifest.types": manifestTypes,
    },
    {
      fetch: fetchImpl,
      AbortController,
      setTimeout: (callback) => {
        callback();
        return 1;
      },
      clearTimeout: () => {},
    },
  );
}

const online = compileFetcher(async (url) => {
  networkCalls += 1;
  return { ok: true, json: async () => (url === urlA ? manifestA : manifestB) };
});

const firstA = await online.fetchApkUpdateManifestResilient(urlA);
assert.equal(firstA.manifest?.latestVersion, "1.0.9");
assert.equal(firstA.fromCache, false);

const memoryA = await online.fetchApkUpdateManifestResilient(urlA);
assert.equal(memoryA.manifest?.latestVersion, "1.0.9");
assert.equal(memoryA.fromCache, true);
assert.equal(networkCalls, 1, "same URL should reuse the fresh memory cache");

const firstB = await online.fetchApkUpdateManifestResilient(urlB);
assert.equal(firstB.manifest?.latestVersion, "1.1.0");
assert.equal(firstB.fromCache, false, "different URL must bypass the memory cache");
assert.equal(networkCalls, 2, "different URL should hit the network");

const offline = compileFetcher(async () => ({ ok: false, json: async () => null }));
const cachedB = await offline.fetchApkUpdateManifestResilient(urlB);
assert.equal(cachedB.manifest?.latestVersion, "1.1.0");
assert.equal(cachedB.fromCache, true, "matching persistent cache should remain available offline");

const mismatchedC = await offline.fetchApkUpdateManifestResilient(urlC);
assert.equal(mismatchedC.manifest, null, "cache from another manifest URL must not leak across endpoints");
assert.equal(mismatchedC.fromCache, false);

console.log("test-apk-manifest-cache: ok (5 cases)");
