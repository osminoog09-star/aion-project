import { z } from "zod";
import type { EcosystemStatus, ReleasesPayload } from "@/lib/ecosystem-types";

const roadmapStatus = z.enum([
  "fully_done",
  "partially_done",
  "not_started",
  "needs_refactor",
  "experimental",
  "blocked",
]);

const subsystemProfileSchema = z.object({
  whatWorks: z.array(z.string()).optional(),
  whatDoesNotWork: z.array(z.string()).optional(),
  mocked: z.array(z.string()).optional(),
  localOnly: z.array(z.string()).optional(),
  cloudReady: z.array(z.string()).optional(),
  requiresApk: z.array(z.string()).optional(),
  otaSafe: z.array(z.string()).optional(),
  subsystemDebt: z.array(z.string()).optional(),
  otaImpact: z.enum(["none", "low", "medium", "high"]).optional(),
  realtimeReadiness: z.number().optional(),
  backendReadiness: z.number().optional(),
  productionReadiness: z.number().optional(),
});

const subsystemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    percent: z.number(),
    status: z.union([roadmapStatus, z.enum(["partial", "done", "planned"])]),
    note: z.string(),
    percentBasis: z.string().optional(),
    currentPhase: z.string().optional(),
    nextMilestone: z.string().optional(),
    blockers: z.array(z.string()).optional(),
    releaseReadiness: z.enum(["not_ready", "preview", "production_candidate"]).optional(),
    platforms: z
      .object({
        mobile: z.object({ percent: z.number().optional(), note: z.string().optional() }).optional(),
        web: z.object({ percent: z.number().optional(), note: z.string().optional() }).optional(),
        backend: z.object({ percent: z.number().optional(), note: z.string().optional() }).optional(),
      })
      .optional(),
    priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  })
  .merge(subsystemProfileSchema);

const operationsRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  percent: z.number(),
  status: z.union([roadmapStatus, z.enum(["partial", "done", "planned"])]),
  summary: z.string(),
  lastSignal: z.string().optional(),
});

const technicalDebtSchema = z.object({
  id: z.string(),
  subsystemId: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  title: z.string(),
  evidence: z.string(),
});

const releasePhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["past", "active", "planned"]),
  window: z.string().optional(),
  description: z.string(),
});

const milestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  target: z.string().optional(),
  status: z.enum(["done", "in_progress", "planned", "blocked"]),
  subsystemIds: z.array(z.string()),
  note: z.string().optional(),
});

const visionSchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
});

const executionSchema = z.object({
  currentPriority: z.string(),
  nextPriority: z.string(),
  blockedTasks: z.array(z.string()),
  activeEpics: z.array(z.string()),
  infrastructurePhase: z.string(),
  frontendPhase: z.string(),
  cloudPhase: z.string(),
});

const cloudSoTSchema = z.object({
  primary: z.enum(["repository_json", "supabase_snapshots"]),
  note: z.string(),
  snapshotKinds: z.array(z.string()),
});

export const ecosystemStatusPayloadSchema = z
  .object({
    lastUpdated: z.string(),
    maintainedInRepository: z.boolean().optional(),
    methodology: z.string(),
    definitionOfDone: z.array(z.string()).optional(),
    releaseQualityBar: z.array(z.string()).optional(),
    cursorExecutionRules: z.array(z.string()).optional(),
    vision: visionSchema.optional(),
    execution: executionSchema.optional(),
    cloudSoT: cloudSoTSchema.optional(),
    sprint: z.object({ label: z.string(), focus: z.string() }),
    readiness: z.record(z.string(), z.number()),
    subsystems: z.array(subsystemSchema),
    epics: z.object({ active: z.array(z.string()), completed: z.array(z.string()) }),
    operations: z.array(operationsRowSchema).optional(),
    technicalDebt: z.array(technicalDebtSchema).optional(),
    releasePhases: z.array(releasePhaseSchema).optional(),
    milestones: z.array(milestoneSchema).optional(),
  })
  .passthrough();

export function parseEcosystemStatusPayload(raw: unknown): EcosystemStatus | null {
  const r = ecosystemStatusPayloadSchema.safeParse(raw);
  return r.success ? (r.data as EcosystemStatus) : null;
}

const releaseChannelSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  appVersion: z.string(),
  notes: z.string(),
});

export const releasesPayloadSchema = z
  .object({
    lastUpdated: z.string(),
    maintainedInRepository: z.boolean().optional(),
    channels: z.array(releaseChannelSchema),
    apk: z.object({
      latestKnownVersion: z.string(),
      policy: z.string(),
      publicManifestUrl: z.string().nullable(),
      note: z.string(),
    }),
    history: z.array(
      z.object({
        date: z.string(),
        type: z.string(),
        title: z.string(),
        detail: z.string(),
      }),
    ),
  })
  .passthrough();

export function parseReleasesPayload(raw: unknown): ReleasesPayload | null {
  const r = releasesPayloadSchema.safeParse(raw);
  return r.success ? (r.data as ReleasesPayload) : null;
}
