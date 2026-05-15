/** Architecture review queue — canonical status + template ids. */

export const ARCHITECTURE_REVIEW_STATUSES = [
  "pending",
  "reviewing",
  "approved",
  "blocked",
  "risky",
  "resolved",
] as const;

export type ArchitectureReviewStatus = (typeof ARCHITECTURE_REVIEW_STATUSES)[number];

export const ARCHITECTURE_REVIEW_TEMPLATE_IDS = [
  "android-runtime",
  "ocr-architecture",
  "gps-storage",
  "overlay-lifecycle",
  "scaling",
  "dependency",
  "production-readiness",
  "general",
] as const;

export type ArchitectureReviewTemplateId = (typeof ARCHITECTURE_REVIEW_TEMPLATE_IDS)[number];
