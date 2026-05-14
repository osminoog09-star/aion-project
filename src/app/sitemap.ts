import type { MetadataRoute } from "next";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  const paths = [
    "",
    ecosystemRoutes.aionProject,
    ecosystemRoutes.ecosystem,
    ecosystemRoutes.operations,
    ecosystemRoutes.status,
    ecosystemRoutes.roadmap,
    ecosystemRoutes.releases,
    ecosystemRoutes.control,
    ecosystemRoutes.downloads,
    ecosystemRoutes.ai,
    ecosystemRoutes.core,
    ecosystemRoutes.studio,
    ecosystemRoutes.link,
    ecosystemRoutes.aiContext,
    ecosystemRoutes.operationsContext,
    ecosystemRoutes.roadmapExecution,
  ] as const;
  const now = new Date();
  return paths.map((p) => ({
    url: p === "" ? `${base}/` : `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : p === ecosystemRoutes.aionProject ? 0.95 : 0.8,
  }));
}
