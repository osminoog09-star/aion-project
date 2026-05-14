import type { EcosystemStatus, EcosystemSubsystem, ReleasesPayload } from "@/lib/ecosystem-types";
import ecosystemStatus from "@/content/ecosystem-status.json";
import roadmapSubsystemExtensions from "@/content/roadmap-subsystem-extensions.json";
import roadmapExecution from "@/content/roadmap-execution.json";
import releases from "@/content/releases.json";
import { fetchCloudEcosystemStatus, fetchCloudReleasesPayload } from "@/lib/ecosystem/cloud-queries";

function applySubsystemExtensions(subsystems: EcosystemSubsystem[]): EcosystemSubsystem[] {
  const ext = roadmapSubsystemExtensions as Record<string, Partial<EcosystemSubsystem>>;
  return subsystems.map((s) => ({ ...s, ...(ext[s.id] ?? {}) }));
}

export function getLocalEcosystemStatus(): EcosystemStatus {
  const base = ecosystemStatus as EcosystemStatus;
  const exec = roadmapExecution as Pick<EcosystemStatus, "aiExecutionNotes" | "executionQueue">;
  const subsystems = applySubsystemExtensions(base.subsystems);
  return { ...base, subsystems, ...exec };
}

export async function getEcosystemStatus(): Promise<EcosystemStatus> {
  return fetchCloudEcosystemStatus(getLocalEcosystemStatus());
}

export function getLocalReleasesPayload(): ReleasesPayload {
  return releases as ReleasesPayload;
}

export async function getReleasesPayload(): Promise<ReleasesPayload> {
  return fetchCloudReleasesPayload(getLocalReleasesPayload());
}
