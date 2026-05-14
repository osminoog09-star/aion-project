export type SubsystemStatus = "partial" | "done" | "planned";

export type EcosystemSubsystem = {
  id: string;
  name: string;
  percent: number;
  status: SubsystemStatus;
  note: string;
};

export type EcosystemStatus = {
  lastUpdated: string;
  maintainedInRepository: boolean;
  methodology: string;
  sprint: { label: string; focus: string };
  readiness: Record<string, number>;
  subsystems: EcosystemSubsystem[];
  epics: { active: string[]; completed: string[] };
};

export type ReleaseChannel = {
  id: string;
  label: string;
  description: string;
  appVersion: string;
  notes: string;
};

export type ReleasesPayload = {
  lastUpdated: string;
  maintainedInRepository: boolean;
  channels: ReleaseChannel[];
  apk: {
    latestKnownVersion: string;
    policy: string;
    publicManifestUrl: string | null;
    note: string;
  };
  history: { date: string; type: string; title: string; detail: string }[];
};
