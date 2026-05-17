/**
 * CI/EAS diagnostic — AION monorepo (aion-driver module inside aion-project).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";
import { loadDotenvLocal, maskEnv } from "./load-dotenv-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFiles = loadDotenvLocal();
const OUT = path.join(root, "src/content/ci-eas-diagnostic.json");

const OWNER = process.env.AION_GITHUB_OWNER ?? "osminoog09-star";
const PORTAL_REPO = process.env.AION_GITHUB_REPO ?? "aion-project";
const EAS_WORKFLOW = process.env.AION_EAS_WORKFLOW ?? "eas-build-driver-preview.yml";
const DRIVER_MODULE = process.env.AION_DRIVER_MODULE ?? "aion-driver";

const ghToken = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || "";

async function gh(pathname) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;
  try {
    const res = await fetch(`https://api.github.com${pathname}`, { headers });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 500) };
    }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, json: { error: String(e.cause?.message ?? e.message ?? e) } };
  }
}

function listLocalWorkflows(dir) {
  const wf = path.join(dir, ".github/workflows");
  if (!fs.existsSync(wf)) return [];
  return fs.readdirSync(wf).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
}

console.log("\n=== CI/EAS Diagnostic (AION monorepo) ===\n");

const driverPath = resolveAionDriverPath();
const driverInRepo = driverPath && fs.existsSync(path.join(root, "aion-driver", "package.json"));
const driverSibling = driverPath && !driverInRepo;

const portalWf = await gh(`/repos/${OWNER}/${PORTAL_REPO}/actions/workflows`);
const portalNames = portalWf.ok ? (portalWf.json.workflows ?? []).map((w) => w.path) : [];
const hasEasWorkflow = portalNames.some((p) => p.includes("eas-build-driver-preview"));

const localPortalWf = listLocalWorkflows(root);
const driverWfLocal = driverPath ? listLocalWorkflows(driverPath) : [];

const critical = [];

if (!hasEasWorkflow && !localPortalWf.includes(EAS_WORKFLOW)) {
  critical.push(`EAS workflow ${EAS_WORKFLOW} not on GitHub and not in local .github/workflows`);
}

if (!driverInRepo) {
  critical.push(
    `Module ${DRIVER_MODULE}/ not in aion-project repo on GitHub — push driver as subfolder (see docs/AION-MODULES.md)`,
  );
}

if (!driverPath) {
  critical.push("aion-driver module not found locally");
}

if (!ghToken) {
  critical.push("GITHUB_TOKEN not set — cannot dispatch workflow from Cursor");
}

const report = {
  at: new Date().toISOString(),
  architecture: "AION monorepo — one project, modules (portal + aion-driver)",
  github: {
    projectRepo: `${OWNER}/${PORTAL_REPO}`,
    workflowsOnRemote: portalNames,
    easWorkflowOnRemote: hasEasWorkflow,
    easWorkflowFile: EAS_WORKFLOW,
  },
  modules: {
    driverModule: DRIVER_MODULE,
    driverPathLocal: driverPath,
    driverInRepo,
    driverSiblingDevLayout: driverSibling,
    driverWorkflowsLocalOnly: driverWfLocal,
  },
  credentials: {
    githubTokenPresent: Boolean(ghToken),
    expoTokenLocal: Boolean(process.env.EXPO_TOKEN?.trim()),
    expoTokenOnGithub: "Required in aion-project Secrets for EAS job",
    envLocalFiles: envFiles,
    envLocalMasked: maskEnv(["GITHUB_TOKEN", "GH_TOKEN", "EXPO_TOKEN", "OPERATIONS_OWNER_SECRET"]),
  },
  critical,
  remediation: [
    `Add ${DRIVER_MODULE}/ to aion-project repo (copy from local ../aion-driver)`,
    `Push .github/workflows/${EAS_WORKFLOW}`,
    "Add EXPO_TOKEN to aion-project GitHub Secrets",
    "Actions → EAS Build Driver (preview) → Run workflow",
    "npm run apk:complete-loop -- <BUILD_ID>",
  ],
};

fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("Project:", `${OWNER}/${PORTAL_REPO}`);
console.log("Driver module:", driverPath ?? "NOT FOUND");
console.log("Driver in repo (aion-driver/):", driverInRepo ? "YES" : "NO (must push module)");
console.log("EAS workflow on GitHub:", hasEasWorkflow ? "YES" : "NO");
console.log("Local workflow file:", localPortalWf.includes(EAS_WORKFLOW) ? "YES" : "NO");
if (critical.length) {
  console.log("\nCRITICAL:");
  for (const c of critical) critical && console.log("  •", c);
}
console.log(`\nWrote ${OUT}\n`);
process.exit(critical.length ? 1 : 0);
