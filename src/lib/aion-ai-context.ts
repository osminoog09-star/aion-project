import type { EcosystemSubsystem, SubsystemStatus, TechnicalDebtItem } from "@/lib/ecosystem-types";
import { getEcosystemStatus, getReleasesPayload } from "@/lib/ecosystem-data";
import { getOperationsHubView } from "@/lib/operations-hub-data";
import { averageReadiness, averageSubsystemPercent } from "@/lib/readiness";

export const AION_AI_SCHEMA_VERSION = "1.1.0";

function mobileWebParityNote(s: EcosystemSubsystem): string {
  const m = s.platforms?.mobile?.percent;
  const w = s.platforms?.web?.percent;
  const b = s.platforms?.backend?.percent;
  const parts: string[] = [];
  if (m != null) parts.push(`mobile ${m}%`);
  if (w != null) parts.push(`web ${w}%`);
  if (b != null) parts.push(`backend ${b}%`);
  if (!parts.length) return "platform slices not set in roadmap data";
  return parts.join("; ");
}

function subsystemToAiRow(s: EcosystemSubsystem) {
  return {
    id: s.id,
    name: s.name,
    readinessPercent: s.percent,
    status: s.status,
    blockers: s.blockers ?? [],
    dependencies: s.blockers ?? [],
    currentPhase: s.currentPhase ?? null,
    nextMilestone: s.nextMilestone ?? null,
    releaseReadiness: s.releaseReadiness ?? null,
    realtimeReadiness: s.realtimeReadiness ?? null,
    backendReadiness: s.backendReadiness ?? null,
    productionReadiness: s.productionReadiness ?? null,
    mobileWebParityNote: mobileWebParityNote(s),
    technicalDebt: s.subsystemDebt ?? [],
    otaImpact: s.otaImpact ?? null,
    otaSafe: s.otaSafe ?? [],
    requiresApk: s.requiresApk ?? [],
    priority: s.priority ?? null,
    percentBasis: s.percentBasis ?? null,
    whatWorks: s.whatWorks ?? [],
    whatDoesNotWork: s.whatDoesNotWork ?? [],
    mocked: s.mocked ?? [],
    localOnly: s.localOnly ?? [],
    cloudReady: s.cloudReady ?? [],
    note: s.note,
    platforms: s.platforms ?? null,
  };
}

function biggestBlockers(eco: Awaited<ReturnType<typeof getEcosystemStatus>>) {
  return eco.subsystems
    .filter((s) => (s.blockers?.length ?? 0) > 0)
    .slice(0, 12)
    .map((s) => ({
      id: s.id,
      name: s.name,
      blockers: s.blockers as string[],
      status: s.status,
    }));
}

function unfinishedSystems(eco: Awaited<ReturnType<typeof getEcosystemStatus>>) {
  const done: SubsystemStatus[] = ["fully_done", "done"];
  return eco.subsystems
    .filter((s) => !done.includes(s.status))
    .map((s) => ({ id: s.id, name: s.name, status: s.status, percent: s.percent }));
}

/** Central JSON for humans, agents, and tools; keep fields stable across releases. */
export async function buildAionAiContextDocument() {
  const [eco, rel] = await Promise.all([getEcosystemStatus(), getReleasesPayload()]);
  const hub = await getOperationsHubView({ eco, rel });

  const technicalDebt: TechnicalDebtItem[] = eco.technicalDebt ?? [];
  const subsystems = eco.subsystems.map(subsystemToAiRow);

  const activeEpic =
    eco.execution?.activeEpics?.[0] ?? eco.epics.active[0] ?? null;

  const summary = {
    ecosystemReadinessPercent: averageReadiness(eco.readiness),
    subsystemReadinessAvgPercent: averageSubsystemPercent(eco.subsystems),
    releaseReadinessHint: rel.apk.policy,
    realtimeReadinessPercent: hub.healthRows.realtime?.percent ?? null,
    cloudReadinessPercent: hub.healthRows.cloud?.percent ?? null,
    currentActiveEpic: activeEpic,
    biggestBlockers: biggestBlockers(eco),
    currentRuntime: hub.apk.manifest?.runtimeVersion ?? null,
    latestApkVersion: hub.apk.manifest?.latestVersion ?? rel.apk.latestKnownVersion,
    latestOtaChannels: hub.ota.channels.map((c) => ({ id: c.id, appVersion: c.appVersion })),
    supabaseSnapshotsReachable: hub.cloud.snapshotsReachable,
    unfinishedSystems: unfinishedSystems(eco),
  };

  return {
    meta: {
      schemaVersion: AION_AI_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      ecosystemLastUpdated: eco.lastUpdated,
      methodology: eco.methodology,
      source: "aion.com — composed from ecosystem-status.json, roadmap extensions, releases.json, optional Supabase snapshots, optional APK manifest URL",
    },
    summary,
    ecosystem: {
      lastUpdated: eco.lastUpdated,
      readiness: eco.readiness,
      subsystems,
      technicalDebt,
      definitionOfDone: eco.definitionOfDone ?? [],
      releaseQualityBar: eco.releaseQualityBar ?? [],
      cursorExecutionRules: eco.cursorExecutionRules ?? [],
      cloudSoT: eco.cloudSoT ?? null,
    },
    roadmap: {
      vision: eco.vision ?? null,
      execution: eco.execution ?? null,
      sprint: eco.sprint,
      epics: eco.epics,
      milestones: eco.milestones ?? [],
      releasePhases: eco.releasePhases ?? [],
      operationsRows: eco.operations ?? [],
    },
    releases: {
      lastUpdated: rel.lastUpdated,
      channels: rel.channels,
      apk: rel.apk,
      history: rel.history,
    },
    runtime: {
      manifest: hub.apk.manifest,
      manifestUrlConfigured: Boolean(hub.apk.manifestUrl),
      apkAgeDays: hub.apk.ageDays,
      otaChannels: hub.ota.channels,
      rollouts: hub.ota.rollouts,
    },
    cloud: {
      portal: hub.cloud,
      health: hub.healthRows,
      incidents: [] as string[],
      reconnectIssues: [] as string[],
      ocrRelayHealth: hub.healthRows.ocr
        ? { percent: hub.healthRows.ocr.percent, status: hub.healthRows.ocr.status, summary: hub.healthRows.ocr.summary }
        : null,
      queueHealth: hub.healthRows.sync
        ? { percent: hub.healthRows.sync.percent, status: hub.healthRows.sync.status, summary: hub.healthRows.sync.summary }
        : null,
    },
    deviceRegistry: {
      visibility: "auth_required" as const,
      headline: hub.deviceCenter.headline,
      detail: hub.deviceCenter.detail,
      publicAggregates: null as null,
    },
    operationsHub: hub,
    technicalDebtIndex: {
      items: technicalDebt,
      openCount: technicalDebt.length,
      bySeverity: {
        critical: technicalDebt.filter((t) => t.severity === "critical").length,
        high: technicalDebt.filter((t) => t.severity === "high").length,
        medium: technicalDebt.filter((t) => t.severity === "medium").length,
        low: technicalDebt.filter((t) => t.severity === "low").length,
      },
    },
  };
}

export type AionAiContextDocument = Awaited<ReturnType<typeof buildAionAiContextDocument>>;
