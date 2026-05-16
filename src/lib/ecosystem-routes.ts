/**
 * URL map for www.aion.com — ecosystem at root, products under dedicated paths.
 * Use these constants so future multi-product routing stays consistent.
 */
export const AION_PROJECT_PATH = "/aionproject" as const;

export const ecosystemRoutes = {
  home: "/",
  /** First active product module (Driver cockpit); site copy + links; app is separate deploy. */
  aionProject: AION_PROJECT_PATH,
  status: "/status",
  roadmap: "/roadmap",
  releases: "/releases",
  control: "/control",
  ecosystem: "/ecosystem",
  operations: "/operations",
  operationsCommand: "/operations/command",
  downloads: "/downloads",
  ai: "/ai",
  aiContext: "/ai-context",
  operationsContext: "/operations/context",
  operationsTimeline: "/operations/timeline",
  operationsExecution: "/operations/execution",
  operationsLive: "/operations/live",
  operationsBlockers: "/operations/blockers",
  operationsRuntime: "/operations/runtime",
  operationsValidation: "/operations/validation",
  operationsPriorities: "/operations/priorities",
  operationsReviews: "/operations/reviews",
  operationsReviewQueue: "/operations/review-queue",
  operationsDeployment: "/operations/deployment",
  operationsGovernance: "/operations/governance",
  roadmapExecution: "/roadmap/execution",
  core: "/core",
  studio: "/studio",
  link: "/link",
} as const;

export type EcosystemRouteKey = keyof typeof ecosystemRoutes;
