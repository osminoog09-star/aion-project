import { createPortalSupabase } from "@/lib/supabase/portal-client";
import type { EcosystemStatus, ReleasesPayload } from "@/lib/ecosystem-types";
import { parseEcosystemStatusPayload, parseReleasesPayload } from "@/lib/ecosystem/payload-guards";

export const SNAPSHOT_KIND_ECOSYSTEM = "portal_ecosystem";
export const SNAPSHOT_KIND_RELEASES = "portal_releases";

function mergeEcosystem(cloud: EcosystemStatus, local: EcosystemStatus): EcosystemStatus {
  return {
    ...local,
    ...cloud,
    sprint: { ...local.sprint, ...cloud.sprint },
    readiness: { ...local.readiness, ...cloud.readiness },
    subsystems: cloud.subsystems?.length ? cloud.subsystems : local.subsystems,
    definitionOfDone: cloud.definitionOfDone?.length ? cloud.definitionOfDone : local.definitionOfDone,
    operations: cloud.operations?.length ? cloud.operations : local.operations,
    technicalDebt: cloud.technicalDebt?.length ? cloud.technicalDebt : local.technicalDebt,
    releasePhases: cloud.releasePhases?.length ? cloud.releasePhases : local.releasePhases,
    milestones: cloud.milestones?.length ? cloud.milestones : local.milestones,
    epics: {
      active: cloud.epics?.active?.length ? cloud.epics.active : local.epics.active,
      completed: cloud.epics?.completed?.length ? cloud.epics.completed : local.epics.completed,
    },
  };
}

export async function fetchCloudEcosystemStatus(local: EcosystemStatus): Promise<EcosystemStatus> {
  const supabase = createPortalSupabase();
  if (!supabase) return local;
  const { data, error } = await supabase
    .from("ecosystem_public_snapshots")
    .select("payload, updated_at")
    .eq("kind", SNAPSHOT_KIND_ECOSYSTEM)
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.payload) return local;
  const parsed = parseEcosystemStatusPayload(data.payload);
  if (!parsed) return local;
  return mergeEcosystem(parsed, local);
}

function mergeReleases(cloud: ReleasesPayload, local: ReleasesPayload): ReleasesPayload {
  return {
    ...local,
    ...cloud,
    channels: cloud.channels?.length ? cloud.channels : local.channels,
    apk: { ...local.apk, ...cloud.apk },
    history: cloud.history?.length ? cloud.history : local.history,
  };
}

export async function fetchCloudReleasesPayload(local: ReleasesPayload): Promise<ReleasesPayload> {
  const supabase = createPortalSupabase();
  if (!supabase) return local;
  const { data: snap, error: snapErr } = await supabase
    .from("ecosystem_public_snapshots")
    .select("payload")
    .eq("kind", SNAPSHOT_KIND_RELEASES)
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!snapErr && snap?.payload) {
    const parsed = parseReleasesPayload(snap.payload);
    if (parsed) return mergeReleases(parsed, local);
  }

  const { data: otaRows, error: otaErr } = await supabase
    .from("ecosystem_release_ota")
    .select("channel, version, runtime_version, notes, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(12);
  if (otaErr || !otaRows?.length) return local;

  const cloudChannels = otaRows.map((r) => ({
    id: r.channel,
    label: r.channel,
    description: "Опубликовано в Supabase (ecosystem_release_ota)",
    appVersion: r.version,
    notes: [r.notes, r.runtime_version ? `runtime: ${r.runtime_version}` : ""].filter(Boolean).join(" · "),
  }));
  return {
    ...local,
    lastUpdated: otaRows[0]?.published_at?.slice(0, 10) ?? local.lastUpdated,
    channels: cloudChannels.length ? cloudChannels : local.channels,
  };
}

export async function fetchPublishedRollouts() {
  const supabase = createPortalSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecosystem_rollout_state")
    .select("id, channel, rollout_status, cohort_percentage, updated_at, payload")
    .eq("visible_public", true)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) return [];
  return data ?? [];
}
