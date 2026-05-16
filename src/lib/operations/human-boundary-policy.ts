/** Explicit human vs autonomous boundary — governance limits unsafe, not approved automation. */

export const AUTONOMOUS_ACTIONS = [
  "github_workflow_dispatch",
  "github_workflow_monitor",
  "ci_artifact_retrieval",
  "eas_build_monitor",
  "manifest_sync",
  "release_validation",
  "release_safety_pipeline",
  "portal_deploy_hook",
  "git_commit_manifest",
  "governance_checks",
  "runtime_activation_when_gates_green",
  "stale_recovery",
  "deploy_rollback_mark",
  "compatibility_verification",
] as const;

export const HUMAN_REQUIRED_ACTIONS = [
  "physical_apk_install",
  "open_driver_app_first_launch",
  "biometric_approval",
  "production_payment",
  "hardware_interaction",
  "legal_business_approval",
  "credentials_bootstrap_no_token",
  "field_validation_on_device",
] as const;

export type AutonomousAction = (typeof AUTONOMOUS_ACTIONS)[number];
export type HumanRequiredAction = (typeof HUMAN_REQUIRED_ACTIONS)[number];
