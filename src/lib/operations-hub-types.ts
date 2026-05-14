import type { ApkUpdateManifest } from "@/lib/apkManifestTypes";
import type { EcosystemStatus, OperationsHealthRow, ReleaseChannel, ReleasesPayload } from "@/lib/ecosystem-types";

export type RolloutPublicRow = {
  id: string;
  channel: string;
  rollout_status: string;
  cohort_percentage: number | null;
  updated_at: string;
};

export type OperationsHubView = {
  assembledAt: string;
  apk: {
    manifest: ApkUpdateManifest | null;
    manifestUrl: string;
    policyNote: string;
    latestKnownFromReleases: string;
    ageDays: number | null;
  };
  ota: {
    channels: ReleaseChannel[];
    otaOps?: OperationsHealthRow;
    rollouts: RolloutPublicRow[];
  };
  roadmap: {
    sprintLabel: string;
    sprintFocus: string;
    readinessPillarAvg: number;
    subsystemAvg: number;
    blockedSubsystems: { id: string; name: string }[];
    activeEpics: string[];
    technicalDebtOpen: number;
  };
  releases: {
    lastUpdated: string;
    history: ReleasesPayload["history"];
  };
  cloud: {
    portalConfigured: boolean;
    snapshotsReachable: boolean;
    snapshotKinds: string[];
    probeError?: string;
  };
  deviceCenter: {
    mode: "public_only";
    headline: string;
    detail: string;
  };
  healthRows: {
    sync?: OperationsHealthRow;
    realtime?: OperationsHealthRow;
    cloud?: OperationsHealthRow;
    ocr?: OperationsHealthRow;
  };
};
