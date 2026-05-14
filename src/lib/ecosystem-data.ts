import type { EcosystemStatus, ReleasesPayload } from "@/lib/ecosystem-types";
import ecosystemStatus from "@/content/ecosystem-status.json";
import releases from "@/content/releases.json";
import { fetchCloudEcosystemStatus, fetchCloudReleasesPayload } from "@/lib/ecosystem/cloud-queries";

export function getLocalEcosystemStatus(): EcosystemStatus {
  return ecosystemStatus as EcosystemStatus;
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
