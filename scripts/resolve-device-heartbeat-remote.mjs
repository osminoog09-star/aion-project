/**
 * Resolve device heartbeat: local JSON → Supabase → production portal API.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotenvLocal } from "./load-dotenv-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL = path.join(root, "src/content/device-build-heartbeat.json");
const SUPABASE_KIND = "portal_device_build_heartbeat";

function readLocal() {
  try {
    const raw = JSON.parse(fs.readFileSync(LOCAL, "utf8"));
    if (!raw?.device?.runtimeVersion) return null;
    return raw;
  } catch {
    return null;
  }
}

async function readSupabase() {
  const key = process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!key || !url) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("ecosystem_public_snapshots")
      .select("payload, updated_at")
      .eq("kind", SUPABASE_KIND)
      .limit(1)
      .maybeSingle();
    if (error || !data?.payload) return null;
    const payload = data.payload;
    if (!payload?.device?.runtimeVersion) return null;
    return {
      at: payload.at ?? data.updated_at ?? new Date().toISOString(),
      device: payload.device,
      source: "supabase",
    };
  } catch {
    return null;
  }
}

async function readProduction() {
  const base =
    process.env.AION_PORTAL_URL?.trim() ||
    JSON.parse(fs.readFileSync(path.join(root, "src/content/deployment-status.json"), "utf8"))
      .productionUrl;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/operations/device-heartbeat`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const hb = json.lastDeviceHeartbeat ?? json.safety?.lastDeviceHeartbeat;
    if (!hb?.device?.runtimeVersion) return null;
    return { ...hb, source: "production_api" };
  } catch {
    return null;
  }
}

function pickNewest(...records) {
  const valid = records.filter(Boolean);
  if (!valid.length) return null;
  return valid.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
}

/** @returns {Promise<{ at: string, device: object, source: string } | null>} */
export async function resolveDeviceHeartbeatRemote() {
  loadDotenvLocal();
  const local = readLocal();
  const remote = await readSupabase();
  const prod = await readProduction();
  return pickNewest(
    local ? { ...local, source: "local" } : null,
    remote,
    prod,
  );
}
