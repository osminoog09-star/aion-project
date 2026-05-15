/** Lightweight feed event kinds for runtime transitions. */

export const RUNTIME_FEED_EVENT_TYPES = [
  "execution_started",
  "execution_validating",
  "execution_recovering",
  "execution_blocked",
  "execution_deploy_passed",
  "execution_resumed",
  "execution_completed",
] as const;

export type RuntimeFeedEventType = (typeof RUNTIME_FEED_EVENT_TYPES)[number];
