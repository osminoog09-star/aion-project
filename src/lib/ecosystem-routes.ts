/**
 * URL map for www.aion.com — ecosystem at root, products under dedicated paths.
 * Use these constants so future multi-product routing stays consistent.
 */
export const AION_PROJECT_PATH = "/aionproject" as const;

export const ecosystemRoutes = {
  home: "/",
  /** Flagship Driver product hub (site copy + links; app is separate deploy). */
  aionProject: AION_PROJECT_PATH,
  status: "/status",
  roadmap: "/roadmap",
  releases: "/releases",
  control: "/control",
  ecosystem: "/ecosystem",
  operations: "/operations",
  downloads: "/downloads",
  ai: "/ai",
  core: "/core",
  studio: "/studio",
  link: "/link",
} as const;

export type EcosystemRouteKey = keyof typeof ecosystemRoutes;
