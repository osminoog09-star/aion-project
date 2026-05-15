/**
 * Production deploy via Vercel API (git source). Requires VERCEL_TOKEN.
 * Uses project IDs from src/content/deployment-status.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const status = JSON.parse(
  fs.readFileSync(path.join(root, "src/content/deployment-status.json"), "utf8"),
);

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error("VERCEL_TOKEN required");
  process.exit(1);
}

const teamId = process.env.VERCEL_ORG_ID ?? status.vercelOrgId;
const projectId = process.env.VERCEL_PROJECT_ID ?? status.vercelProjectId;
const ref = process.env.VERCEL_GIT_REF ?? "master";

const body = {
  name: "aion-com",
  project: projectId,
  target: "production",
  gitSource: {
    type: "github",
    org: "osminoog09-star",
    repo: "aion-project",
    ref,
  },
};

const url = teamId
  ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
  : "https://api.vercel.com/v13/deployments";

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error("Deploy API failed:", res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("Deployment created:", data.id ?? data.uid);
console.log("URL:", data.url ?? data.alias?.[0] ?? "(pending)");
console.log("Ready:", data.readyState ?? data.status);
