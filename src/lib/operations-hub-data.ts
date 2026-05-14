import type { EcosystemStatus, ReleasesPayload } from "@/lib/ecosystem-types";
import type { OperationsHubView, RolloutPublicRow } from "@/lib/operations-hub-types";
import { fetchPublishedApkManifest } from "@/lib/fetchApkManifest";
import { getEcosystemStatus, getReleasesPayload } from "@/lib/ecosystem-data";
import { fetchPublishedRollouts } from "@/lib/ecosystem/cloud-queries";
import { createPortalSupabase } from "@/lib/supabase/portal-client";
import { isPortalSupabaseConfigured } from "@/lib/env/portal-env";
import { averageReadiness, averageSubsystemPercent } from "@/lib/readiness";

function apkAgeDays(releaseDate?: string): number | null {
  if (!releaseDate?.trim()) return null;
  const t = Date.parse(releaseDate);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / (86400 * 1000)));
}

async function probeSnapshotKinds(): Promise<{ ok: boolean; kinds: string[]; error?: string }> {
  if (!isPortalSupabaseConfigured()) return { ok: false, kinds: [] };
  const supabase = createPortalSupabase();
  if (!supabase) return { ok: false, kinds: [] };
  const { data, error } = await supabase
    .from("ecosystem_public_snapshots")
    .select("kind")
    .eq("is_public", true)
    .limit(80);
  if (error) return { ok: false, kinds: [], error: error.message };
  const kinds = [...new Set((data ?? []).map((r) => r.kind).filter(Boolean))] as string[];
  return { ok: true, kinds };
}

export type OperationsHubPreload = {
  eco?: EcosystemStatus;
  rel?: ReleasesPayload;
};

/** Single composed view for Operations Hub (web); pass `eco`/`rel` to avoid duplicate fetches when composing AI context. */
export async function getOperationsHubView(preload?: OperationsHubPreload): Promise<OperationsHubView> {
  const [eco, rel] = await Promise.all([
    preload?.eco ?? getEcosystemStatus(),
    preload?.rel ?? getReleasesPayload(),
  ]);
  const [manifest, rolloutsRaw, probe] = await Promise.all([
    fetchPublishedApkManifest(),
    fetchPublishedRollouts(),
    probeSnapshotKinds(),
  ]);

  const rollouts = rolloutsRaw as RolloutPublicRow[];
  const ops = eco.operations ?? [];
  const otaOps = ops.find((o) => o.id === "ota");
  const sync = ops.find((o) => o.id === "sync");
  const realtime = ops.find((o) => o.id === "realtime");
  const cloud = ops.find((o) => o.id === "cloud");
  const ocr = ops.find((o) => o.id === "ocr");

  const blockedSubsystems = eco.subsystems
    .filter((s) => (s.blockers?.length ?? 0) > 0 || s.status === "blocked")
    .slice(0, 8)
    .map((s) => ({ id: s.id, name: s.name }));

  const manifestUrl = process.env.NEXT_PUBLIC_APK_MANIFEST_URL?.trim() ?? "";

  return {
    assembledAt: new Date().toISOString(),
    apk: {
      manifest,
      manifestUrl,
      policyNote: rel.apk.note,
      latestKnownFromReleases: rel.apk.latestKnownVersion,
      ageDays: apkAgeDays(manifest?.releaseDate),
    },
    ota: {
      channels: rel.channels,
      otaOps: otaOps,
      rollouts,
    },
    roadmap: {
      sprintLabel: eco.sprint.label,
      sprintFocus: eco.sprint.focus,
      readinessPillarAvg: averageReadiness(eco.readiness),
      subsystemAvg: averageSubsystemPercent(eco.subsystems),
      blockedSubsystems,
      activeEpics: eco.execution?.activeEpics?.length ? eco.execution.activeEpics : eco.epics.active,
      technicalDebtOpen: eco.technicalDebt?.length ?? 0,
    },
    releases: {
      lastUpdated: rel.lastUpdated,
      history: rel.history.slice(0, 12),
    },
    cloud: {
      portalConfigured: isPortalSupabaseConfigured(),
      snapshotsReachable: probe.ok,
      snapshotKinds: probe.kinds,
      probeError: probe.error,
    },
    deviceCenter: {
      mode: "public_only",
      headline: "Устройства и adoption",
      detail:
        "Публичный портал не показывает список устройств без входа. Счётчики online/outdated и пары — после auth и политики RLS (таблицы devices / paired_devices). Ссылка на хаб ниже — единая точка правды по релизам и OTA.",
    },
    healthRows: { sync, realtime, cloud, ocr },
  };
}
