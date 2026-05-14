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
    releaseQualityBar: cloud.releaseQualityBar?.length ? cloud.releaseQualityBar : local.releaseQualityBar,
    cursorExecutionRules: cloud.cursorExecutionRules?.length ? cloud.cursorExecutionRules : local.cursorExecutionRules,
    vision: cloud.vision ?? local.vision,
    execution: cloud.execution ? { ...local.execution, ...cloud.execution } : local.execution,
    cloudSoT: cloud.cloudSoT ?? local.cloudSoT,
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

export const SNAPSHOT_KIND_ROADMAP_MASTER = "portal_roadmap_master";

function mergeSubsystemsById(local: EcosystemStatus["subsystems"], cloud: EcosystemStatus["subsystems"]) {
  const cmap = new Map(cloud.map((s) => [s.id, s]));
  const mergedLocal = local.map((s) => ({ ...s, ...cmap.get(s.id) }));
  const localIds = new Set(local.map((s) => s.id));
  const extra = cloud.filter((s) => !localIds.has(s.id));
  return [...mergedLocal, ...extra];
}

/** Deep overlay: same shape as EcosystemStatus; subsystem rows merge by id so JSON extensions survive partial cloud. */
function mergeRoadmapMasterOverlay(cloud: EcosystemStatus, base: EcosystemStatus): EcosystemStatus {
  return {
    ...base,
    ...cloud,
    sprint: { ...base.sprint, ...cloud.sprint },
    readiness: { ...base.readiness, ...cloud.readiness },
    subsystems: cloud.subsystems?.length ? mergeSubsystemsById(base.subsystems, cloud.subsystems) : base.subsystems,
    definitionOfDone: cloud.definitionOfDone?.length ? cloud.definitionOfDone : base.definitionOfDone,
    releaseQualityBar: cloud.releaseQualityBar?.length ? cloud.releaseQualityBar : base.releaseQualityBar,
    cursorExecutionRules: cloud.cursorExecutionRules?.length ? cloud.cursorExecutionRules : base.cursorExecutionRules,
    vision: cloud.vision ?? base.vision,
    execution: cloud.execution ? { ...base.execution, ...cloud.execution } : base.execution,
    cloudSoT: cloud.cloudSoT ?? base.cloudSoT,
    operations: cloud.operations?.length ? cloud.operations : base.operations,
    technicalDebt: cloud.technicalDebt?.length ? cloud.technicalDebt : base.technicalDebt,
    releasePhases: cloud.releasePhases?.length ? cloud.releasePhases : base.releasePhases,
    milestones: cloud.milestones?.length ? cloud.milestones : base.milestones,
    epics: {
      active: cloud.epics?.active?.length ? cloud.epics.active : base.epics.active,
      completed: cloud.epics?.completed?.length ? cloud.epics.completed : base.epics.completed,
    },
  };
}

export async function fetchCloudEcosystemStatus(local: EcosystemStatus): Promise<EcosystemStatus> {
  const supabase = createPortalSupabase();
  if (!supabase) return local;
  let current = local;

  const { data: eco, error: ecoErr } = await supabase
    .from("ecosystem_public_snapshots")
    .select("payload, updated_at")
    .eq("kind", SNAPSHOT_KIND_ECOSYSTEM)
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!ecoErr && eco?.payload) {
    const parsed = parseEcosystemStatusPayload(eco.payload);
    if (parsed) current = mergeEcosystem(parsed, current);
  }

  const { data: rm, error: rmErr } = await supabase
    .from("ecosystem_public_snapshots")
    .select("payload, updated_at")
    .eq("kind", SNAPSHOT_KIND_ROADMAP_MASTER)
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!rmErr && rm?.payload) {
    const parsed = parseEcosystemStatusPayload(rm.payload);
    if (parsed) current = mergeRoadmapMasterOverlay(parsed, current);
  }

  return current;
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
