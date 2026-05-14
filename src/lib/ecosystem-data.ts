import type { EcosystemStatus, ReleasesPayload } from "@/lib/ecosystem-types";
import ecosystemStatus from "@/content/ecosystem-status.json";
import releases from "@/content/releases.json";

export function getEcosystemStatus(): EcosystemStatus {
  return ecosystemStatus as EcosystemStatus;
}

export function getReleasesPayload(): ReleasesPayload {
  return releases as ReleasesPayload;
}
