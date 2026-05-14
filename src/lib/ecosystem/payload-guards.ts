import { z } from "zod";
import type { EcosystemStatus, ReleasesPayload } from "@/lib/ecosystem-types";

const subsystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  percent: z.number(),
  status: z.enum(["partial", "done", "planned"]),
  note: z.string(),
});

export const ecosystemStatusPayloadSchema = z
  .object({
    lastUpdated: z.string(),
    maintainedInRepository: z.boolean().optional(),
    methodology: z.string(),
    sprint: z.object({ label: z.string(), focus: z.string() }),
    readiness: z.record(z.string(), z.number()),
    subsystems: z.array(subsystemSchema),
    epics: z.object({ active: z.array(z.string()), completed: z.array(z.string()) }),
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
