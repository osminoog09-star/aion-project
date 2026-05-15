/**
 * Validate production operations routes. Updates src/content/deployment-status.json
 * Usage: node scripts/post-deploy-validate.mjs [--base https://aion-com.vercel.app]
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
];

async function checkRoute(route) {
  const url = `${baseUrl}${route}`;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const ok = res.status >= 200 && res.status < 400;
    return { status: ok ? "pass" : "fail", httpStatus: res.status };
  } catch {
    return { status: "fail", httpStatus: null };
  }
}

const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
const routes = {};
let allPassed = true;

for (const route of ROUTES) {
  const result = await checkRoute(route);
  routes[route] = result;
  if (result.status !== "pass") allPassed = false;
  console.log(`${result.status === "pass" ? "OK" : "FAIL"} ${route} → ${result.httpStatus ?? "err"}`);
}

status.routeValidation = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  routes,
  allPassed,
};
status.lastUpdated = new Date().toISOString().slice(0, 10);
if (allPassed) {
  status.lastProductionDeploy = {
    ...status.lastProductionDeploy,
    status: "ok",
    notes: "All operations routes validated on production.",
  };
  status.pipelineBlockers = [];
} else {
  status.lastProductionDeploy = {
    ...status.lastProductionDeploy,
    status: "stale",
    notes: "One or more operations routes failed validation — redeploy required.",
  };
}

fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`);
process.exit(allPassed ? 0 : 1);
