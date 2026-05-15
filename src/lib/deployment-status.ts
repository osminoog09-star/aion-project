import deploymentJson from "@/content/deployment-status.json";
import type { DeploymentStatusPayload } from "@/contracts/deployment-status";

export type {
  RouteCheckStatus,
  RouteCheck,
  DeploymentTimelineEntry,
  DeploymentStatusPayload,
} from "@/contracts/deployment-status";

export function getDeploymentStatus(): DeploymentStatusPayload {
  return deploymentJson as DeploymentStatusPayload;
}
