import deploymentJson from "@/content/deployment-status.json";

export type RouteCheckStatus = "pass" | "fail" | "unknown";

export type DeploymentStatusPayload = {
  lastUpdated: string;
  productionUrl: string;
  expectedGitRemote: string;
  vercelProjectId: string;
  vercelOrgId: string;
  pipelineVersion: string;
  lastProductionDeploy: {
    status: "ok" | "stale" | "failed" | "in_progress";
    deployedAt: string | null;
    commit: string | null;
    deploymentUrl: string | null;
    trigger: string;
    notes?: string;
  };
  routeValidation: {
    checkedAt: string | null;
    baseUrl: string;
    routes: Record<string, { status: RouteCheckStatus; httpStatus: number | null }>;
    allPassed: boolean;
  };
  pipelineBlockers: string[];
  autonomousRecovery: string[];
};

export function getDeploymentStatus(): DeploymentStatusPayload {
  return deploymentJson as DeploymentStatusPayload;
}
