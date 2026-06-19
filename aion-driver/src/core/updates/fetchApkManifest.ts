import AsyncStorage from "@react-native-async-storage/async-storage";
import { isApkManifest, type ApkUpdateManifest } from "./apkManifest.types";

const DEFAULT_TIMEOUT_MS = 12_000;
const CACHE_KEY = "@aion_driver/apk_manifest_cache_v2";
const STALE_MS = 36 * 60 * 60 * 1000;
const MAX_RELEASE_AGE_MS = 90 * 24 * 60 * 60 * 1000;

type CacheRow = { url: string; at: number; json: unknown };

let memory: { url: string; manifest: ApkUpdateManifest; at: number } | null = null;

function parseIsoMs(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

export function isManifestSemanticallyStale(m: ApkUpdateManifest, fetchedAtMs: number): boolean {
  const age = Date.now() - fetchedAtMs;
  if (age > STALE_MS) return true;
  const rd = parseIsoMs(m.releaseDate);
  if (rd != null && Date.now() - rd > MAX_RELEASE_AGE_MS) return true;
  return false;
}

async function readCache(expectedUrl: string): Promise<CacheRow | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    if (typeof o.url !== "string" || o.url !== expectedUrl || typeof o.at !== "number") return null;
    return { url: o.url, at: o.at, json: o.json };
  } catch {
    return null;
  }
}

async function writeCache(url: string, at: number, json: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ url, at, json }));
  } catch {
    /* ignore */
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchApkUpdateManifest(
  url: string,
  signal?: AbortSignal,
): Promise<ApkUpdateManifest | null> {
  const normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(normalizedUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: signal ?? ctrl.signal,
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return isApkManifest(json) ? json : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Ретраи + кэш последнего валидного JSON (офлайн / сетевые сбои).
 */
export async function fetchApkUpdateManifestResilient(url: string): Promise<{
  manifest: ApkUpdateManifest | null;
  fromCache: boolean;
  attempts: number;
}> {
  const normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) return { manifest: null, fromCache: false, attempts: 0 };

  if (memory && memory.url === normalizedUrl && Date.now() - memory.at < 60_000) {
    return { manifest: memory.manifest, fromCache: true, attempts: 0 };
  }

  let last: ApkUpdateManifest | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const m = await fetchApkUpdateManifest(normalizedUrl);
    if (m) {
      last = m;
      const fetchedAt = Date.now();
      memory = { url: normalizedUrl, manifest: m, at: fetchedAt };
      await writeCache(normalizedUrl, fetchedAt, m);
      return { manifest: m, fromCache: false, attempts: attempt + 1 };
    }
    if (attempt < 2) await sleep(600 * 2 ** attempt);
  }

  const row = await readCache(normalizedUrl);
  if (row?.json && isApkManifest(row.json)) {
    memory = { url: normalizedUrl, manifest: row.json, at: row.at };
    return { manifest: row.json, fromCache: true, attempts: 3 };
  }

  return { manifest: null, fromCache: false, attempts: 3 };
}
