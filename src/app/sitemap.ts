import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  const paths = ["", "/driver", "/status", "/roadmap", "/releases", "/control"] as const;
  const now = new Date();
  return paths.map((p) => ({
    url: p === "" ? `${base}/` : `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.8,
  }));
}
