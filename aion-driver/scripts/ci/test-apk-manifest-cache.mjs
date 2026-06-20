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

function compileFetcher(
  fetchImpl,
  {
    setTimeoutImpl = (callback) => {
      callback();
      return 1;
    },
    clearTimeoutImpl = () => {},
  } = {},
) {
  return compileTsModule(
    "src/core/updates/fetchApkManifest.ts",
    {
      "@react-native-async-storage/async-storage": asyncStorage,
      "./apkManifest.types": manifestTypes,
    },
    {
      fetch: fetchImpl,
      AbortController,
      setTimeout: setTimeoutImpl,
      clearTimeout: clearTimeoutImpl,
    },
  );
}

const online = compileFetcher(async (url) => {
  networkCalls += 1;
  return { ok: true, json: async () => (url === urlA ? manifestA : manifestB) };
});

const insecure = await online.fetchApkUpdateManifestResilient("http://a.example.com/apk.json");
assert.equal(insecure.manifest, null, "cleartext manifest endpoint must be rejected before fetch");
assert.equal(insecure.attempts, 0);
assert.equal(networkCalls, 0, "cleartext endpoint must not hit the network");

const firstA = await online.fetchApkUpdateManifestResilient(urlA);
assert.equal(firstA.manifest?.latestVersion, "1.0.9");
assert.equal(firstA.fromCache, false);
assert.equal(typeof firstA.fetchedAtMs, "number");

const memoryA = await online.fetchApkUpdateManifestResilient(urlA);
assert.equal(memoryA.manifest?.latestVersion, "1.0.9");
assert.equal(memoryA.fromCache, false, "fresh memory reuse must not be reported as an offline fallback");
assert.equal(memoryA.fetchedAtMs, firstA.fetchedAtMs, "memory reuse must preserve the original fetch time");
assert.equal(networkCalls, 1, "same URL should reuse the fresh memory cache");

const firstB = await online.fetchApkUpdateManifestResilient(urlB);
assert.equal(firstB.manifest?.latestVersion, "1.1.0");
assert.equal(firstB.fromCache, false, "different URL must bypass the memory cache");
assert.equal(networkCalls, 2, "different URL should hit the network");

const offline = compileFetcher(async () => ({ ok: false, json: async () => null }));
const cachedB = await offline.fetchApkUpdateManifestResilient(urlB);
assert.equal(cachedB.manifest?.latestVersion, "1.1.0");
assert.equal(cachedB.fromCache, true, "matching persistent cache should remain available offline");
assert.equal(cachedB.fetchedAtMs, firstB.fetchedAtMs, "offline fallback must preserve cache age");

const mismatchedC = await offline.fetchApkUpdateManifestResilient(urlC);
assert.equal(mismatchedC.manifest, null, "cache from another manifest URL must not leak across endpoints");
assert.equal(mismatchedC.fromCache, false);
assert.equal(mismatchedC.fetchedAtMs, null);

const timeoutCaller = new AbortController();
let timeoutSignal;
const timesOut = compileFetcher(async (_url, options) => {
  timeoutSignal = options.signal;
  return { ok: false, json: async () => null };
});
assert.equal(await timesOut.fetchApkUpdateManifest(urlA, timeoutCaller.signal), null);
assert.notEqual(timeoutSignal, timeoutCaller.signal, "caller signal must not replace the mandatory timeout signal");
assert.equal(timeoutSignal?.aborted, true, "mandatory timeout must abort the fetch signal");

const caller = new AbortController();
let callerSignal;
let timeoutCleared = false;
const callerCancelled = compileFetcher(
  async (_url, options) => {
    callerSignal = options.signal;
    return new Promise((resolve) => {
      options.signal.addEventListener(
        "abort",
        () => resolve({ ok: false, json: async () => null }),
        { once: true },
      );
    });
  },
  {
    setTimeoutImpl: () => 7,
    clearTimeoutImpl: (id) => {
      if (id === 7) timeoutCleared = true;
    },
  },
);
const cancelledRequest = callerCancelled.fetchApkUpdateManifest(urlA, caller.signal);
caller.abort();
assert.equal(await cancelledRequest, null);
assert.notEqual(callerSignal, caller.signal, "caller cancellation should propagate through the internal controller");
assert.equal(callerSignal?.aborted, true, "caller cancellation must abort the fetch signal");
assert.equal(timeoutCleared, true, "timeout must be cleared after caller cancellation");

console.log("test-apk-manifest-cache: ok (20 assertions)");
