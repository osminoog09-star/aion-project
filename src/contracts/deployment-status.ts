/** Canonical deployment status contracts. */

export type RouteCheckStatus = "pass" | "fail" | "unknown";

export type RouteCheck = {
  status: RouteCheckStatus;
  httpStatus: number | null;
  renderOk?: boolean;
};

export type DeploymentTimelineEntry = {
  at: string;
  kind: string;
  summary: string;
  commit?: string;
  durationMs?: number;
};

export type DeploymentStatusPayload = {
  lastUpdated: string;
  productionUrl: string;
  expectedGitRemote: string;
  vercelProjectId: string;
  vercelOrgId: string;
  pipelineVersion: string;
  gitLinkage: {
    remoteConfigured: boolean;
    remoteUrl: string;
    defaultBranch: string;
    githubRepoExists: boolean;
    lastPushAttempt: string | null;
    lastPushError: string | null;
  };
  vercelLinkage: {
    projectLinkedLocally: boolean;
    productionBranch: string;
    autoDeployOnPush: boolean;
    notes: string;
  };
  lastProductionDeploy: {
    status: "ok" | "stale" | "failed" | "in_progress";
    deployedAt: string | null;
    commit: string | null;
    commitFull: string | null;
    deploymentUrl: string | null;
    deploymentId: string | null;
    trigger: string;
    durationMs: number | null;
    rollbackTarget: string | null;
    notes?: string;
  };
  routeValidation?: {
    checkedAt: string;
    baseUrl: string;
    routes: Record<string, RouteCheck>;
    allPassed?: boolean;
  };
  deploymentTimeline?: DeploymentTimelineEntry[];
  pipelineBlockers?: string[];
  ownerUnblock?: Record<string, string>;
  autonomousRecovery?: string[];
};
