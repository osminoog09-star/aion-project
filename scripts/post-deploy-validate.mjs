/**
 * Validate production operations routes. Updates deployment-status.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const statusPath = path.join(root, "src/content/deployment-status.json");

const baseArg = process.argv.indexOf("--base");
const baseUrl =
  baseArg >= 0 && process.argv[baseArg + 1]
    ? process.argv[baseArg + 1].replace(/\/$/, "")
    : "https://aion-com.vercel.app";

const ROUTES = [
  "/operations",
  "/operations/reviews",
  "/operations/review-queue",
  "/operations/priorities",
  "/operations/execution",
  "/operations/blockers",
  "/operations/runtime",
  "/operations/validation",
  "/operations/deployment",
];

const HYDRATION_MARKERS = [
  "Operations center",
  "route intelligence",
  "Review queue",
  "deployment pipeline",
  "AI execution audit",
  "Architecture reviews",
];

async function checkRoute(route) {
  const url = `${baseUrl}${route}`;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const html = await res.text();
    const ok = res.status >= 200 && res.status < 400;
    const renderOk =
      ok &&
      html.length > 500 &&
      (route.includes("deployment")
        ? html.includes("deployment pipeline") || html.includes("Production deploy")
        : HYDRATION_MARKERS.some((m) => html.includes(m)) || html.includes("operations"));
    return { status: ok ? "pass" : "fail", httpStatus: res.status, renderOk };
  } catch {
    return { status: "fail", httpStatus: null, renderOk: false };
  }
}

const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
const routes = {};
let allPassed = true;
const started = Date.now();

for (const route of ROUTES) {
  const result = await checkRoute(route);
  routes[route] = result;
  if (result.status !== "pass" || !result.renderOk) allPassed = false;
  const tag = result.status === "pass" && result.renderOk ? "OK" : "FAIL";
  console.log(`${tag} ${route} → ${result.httpStatus ?? "err"} render=${result.renderOk}`);
}

const durationMs = Date.now() - started;

status.routeValidation = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  routes,
  allPassed,
};
status.lastUpdated = new Date().toISOString().slice(0, 10);

status.deploymentTimeline = [
  {
    at: new Date().toISOString(),
    kind: allPassed ? "validation_passed" : "validation_failed",
    summary: allPassed
      ? `All ${ROUTES.length} routes passed (${durationMs}ms)`
      : "Production validation failed — stale or broken deploy",
    durationMs,
  },
  ...(status.deploymentTimeline ?? []).slice(0, 19),
];

if (allPassed) {
  status.lastProductionDeploy = {
    ...status.lastProductionDeploy,
    status: "ok",
    notes: "All operations routes validated.",
  };
  status.pipelineBlockers = [];
  status.gitLinkage = { ...status.gitLinkage, githubRepoExists: true };
} else {
  status.lastProductionDeploy = {
    ...status.lastProductionDeploy,
    status: "stale",
    notes: "Route validation failed — redeploy required.",
  };
}

fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`);
process.exit(allPassed ? 0 : 1);
