/**
 * Canonical site origin for metadata, sitemap, and robots.
 * Production: set NEXT_PUBLIC_SITE_URL to https://www.aion.com (platform + nested /aionproject).
 * Vercel sets VERCEL_URL (no scheme); used only when NEXT_PUBLIC_SITE_URL is unset.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}
