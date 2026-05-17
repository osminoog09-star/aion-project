/**
 * Autonomous GitHub Actions + EAS — with preflight, trace, Expo verify, hard fail.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { appendTrace } from "./release-execution-trace.mjs";
import { loadDotenvLocal } from "./load-dotenv-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotenvLocal();
const STATE_FILE = path.join(root, "src/content/autonomous-execution-state.json");
const RUNTIME_FILE = path.join(root, "src/content/execution-runtime.json");

const GITHUB_OWNER = process.env.AION_GITHUB_OWNER ?? "osminoog09-star";
const GITHUB_REPO = process.env.AION_GITHUB_REPO ?? "aion-project";
const WORKFLOW_FILE =
  process.env.AION_EAS_WORKFLOW ?? "eas-build-driver-preview.yml";
const WORKFLOW_REF = process.env.AION_GITHUB_REF ?? "master";
const EXPO_PROJECT_SLUG = process.env.AION_EXPO_PROJECT ?? "aion";
const EXPO_ACCOUNT = process.env.AION_EXPO_ACCOUNT ?? "osminoog";

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { version: "1.0", phase: "idle", buildId: null, workflowRunId: null, history: [] };
  }
}

function writeState(patch) {
  const prev = readState();
  const next = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
    history: [{ at: new Date().toISOString(), ...patch }, ...(prev.history ?? [])].slice(0, 50),
  };
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

function markReleaseFailed(reason) {
  appendTrace({ stage: "release_failed", message: reason, level: "error" });
  writeState({ phase: "release_failed", error: reason, telemetry: "build_absent_or_gha_failed" });
  try {
    const doc = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
    doc.runtime = {
      ...doc.runtime,
      phase: "blocked",
      status: "blocked",
      blocker: reason,
      currentTask: "Release failed — CI/EAS chain",
      validationProgress: `RELEASE_FAILED: ${reason}`,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(RUNTIME_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  } catch {
    /* */
  }
  try {
    execSync(
      `node scripts/execution-runtime.mjs --phase blocked --task "Release failed" --blocker "${reason.replace(/"/g, "'")}" --skip-feed --skip-governance`,
      { cwd: root, stdio: "inherit" },
    );
  } catch {
    /* */
  }
}

function token() {
  return process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || "";
}

function expoToken() {
  return process.env.EXPO_TOKEN?.trim() || "";
}

async function gh(pathname, opts = {}) {
  const t = token();
  if (!t) throw new Error("GITHUB_TOKEN or GH_TOKEN required");
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${t}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.status === 204 ? null : res.json();
}

async function preflightWorkflow() {
  appendTrace({ stage: "preflight", message: `Checking workflow ${WORKFLOW_FILE}`, level: "info" });
  const data = await gh(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows`);
  const found = (data.workflows ?? []).find((w) => w.path === `.github/workflows/${WORKFLOW_FILE}`);
  if (!found) {
    const paths = (data.workflows ?? []).map((w) => w.path).join(", ");
    const msg = `Workflow .github/workflows/${WORKFLOW_FILE} NOT on GitHub. Found: ${paths || "none"}. Push workflow + aion-driver/ module to aion-project.`;
    markReleaseFailed(msg);
    throw new Error(msg);
  }
  appendTrace({
    stage: "preflight",
    message: `Workflow OK id=${found.id}`,
    workflowId: found.id,
    level: "info",
  });
  return found;
}

async function triggerWorkflow(workflow) {
  const before = await latestWorkflowRun();
  const beforeId = before?.id ?? 0;

  await gh(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref: WORKFLOW_REF }),
  });

  appendTrace({
    stage: "gha_trigger",
    message: `Dispatched ${WORKFLOW_FILE} @ ${WORKFLOW_REF}`,
    workflowId: workflow.id,
    level: "info",
  });
  writeState({ phase: "gha_triggered", workflowFile: WORKFLOW_FILE, workflowId: workflow.id });

  for (let i = 0; i < 24; i++) {
    await sleep(5000);
    const run = await latestWorkflowRun();
    if (run && run.id !== beforeId && run.status !== "completed") {
      appendTrace({
        stage: "gha_started",
        message: `Run ${run.id} status=${run.status}`,
        runId: run.id,
        runUrl: run.html_url,
        level: "info",
      });
      writeState({ phase: "gha_running", workflowRunId: run.id, workflowRunUrl: run.html_url });
      return run;
    }
  }
  throw new Error("GHA run did not appear within 120s after dispatch");
}

async function latestWorkflowRun() {
  const data = await gh(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=5`,
  );
  return data.workflow_runs?.[0] ?? null;
}

async function waitWorkflowRun(maxMs = 25 * 60_000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const run = await latestWorkflowRun();
    if (!run) {
      await sleep(10_000);
      continue;
    }
    writeState({
      phase: "gha_running",
      workflowRunId: run.id,
      workflowStatus: run.status,
      workflowConclusion: run.conclusion,
    });
    appendTrace({
      stage: "gha_poll",
      message: `run=${run.id} status=${run.status} conclusion=${run.conclusion ?? "—"}`,
      runId: run.id,
      level: "info",
    });
    if (run.status === "completed") {
      if (run.conclusion !== "success") {
        markReleaseFailed(`GHA run ${run.id} conclusion=${run.conclusion}`);
        throw new Error(`GHA run failed: ${run.conclusion}`);
      }
      writeState({ phase: "gha_completed", workflowRunId: run.id });
      return run;
    }
    await sleep(15_000);
  }
  markReleaseFailed("GHA workflow timeout");
  throw new Error("GHA workflow wait timeout");
}

async function expoListBuilds() {
  const t = expoToken();
  if (!t) return null;
  const query = `
    query {
      app {
        byAppId(appId: "placeholder") { id }
      }
    }
  `;
  try {
    const res = await fetch("https://api.expo.dev/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query { viewer { accounts { name } } }`,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function verifyExpoBuild(buildId, maxMs = 90 * 60_000) {
  if (!buildId) return false;
  const t = expoToken();
  if (!t) {
    appendTrace({ stage: "expo_verify", message: "Skip — no EXPO_TOKEN for build:view", level: "warn" });
    return true;
  }
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const raw = execSync(`npx eas-cli@latest build:view ${buildId} --json`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
        timeout: 60_000,
      });
      const build = JSON.parse(raw.trim());
      const status = build.status;
      appendTrace({
        stage: "expo_poll",
        message: `build=${buildId} status=${status} runtime=${build.runtimeVersion ?? "?"}`,
        buildId,
        buildUrl: `https://expo.dev/accounts/${EXPO_ACCOUNT}/projects/${EXPO_PROJECT_SLUG}/builds/${buildId}`,
        level: "info",
      });
      writeState({
        phase: status === "FINISHED" ? "expo_finished" : "expo_building",
        buildId,
        easStatus: status,
        easRuntimeVersion: build.runtimeVersion,
      });
      if (status === "FINISHED") {
        if (build.runtimeVersion && build.runtimeVersion < "1.0.6") {
          markReleaseFailed(`EAS build runtime ${build.runtimeVersion} < 1.0.6`);
          return false;
        }
        return true;
      }
      if (status === "ERRORED" || status === "CANCELED") {
        markReleaseFailed(`EAS build ${buildId} ${status}`);
        return false;
      }
    } catch (e) {
      appendTrace({ stage: "expo_poll", message: String(e.message ?? e).slice(0, 200), level: "warn" });
    }
    await sleep(30_000);
  }
  markReleaseFailed(`Expo build ${buildId} not FINISHED within timeout`);
  return false;
}

async function downloadBuildIdArtifact(runId) {
  const arts = await gh(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/artifacts`);
  const meta = (arts.artifacts ?? []).find((a) => a.name === "eas-preview-build-metadata");
  if (!meta) {
    appendTrace({ stage: "artifact", message: "No eas-preview-build-metadata artifact", level: "warn" });
    return null;
  }
  const zipRes = await fetch(meta.archive_download_url, {
    headers: { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json" },
  });
  if (!zipRes.ok) throw new Error(`Artifact download ${zipRes.status}`);
  const buf = Buffer.from(await zipRes.arrayBuffer());
  const zipPath = path.join(root, ".tmp-eas-artifact.zip");
  const extractDir = path.join(root, ".tmp-eas-artifact");
  fs.mkdirSync(extractDir, { recursive: true });
  fs.writeFileSync(zipPath, buf);
  try {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`,
      { stdio: "ignore" },
    );
  } catch {
    appendTrace({ stage: "artifact", message: "Could not extract zip", level: "warn" });
    return null;
  }
  const idFile = path.join(extractDir, "build-id.txt");
  if (fs.existsSync(idFile)) {
    const buildId = fs.readFileSync(idFile, "utf8").trim();
    appendTrace({ stage: "build_id", message: `Resolved BUILD_ID=${buildId}`, buildId, level: "info" });
    writeState({ phase: "build_id_resolved", buildId });
    return buildId;
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const args = process.argv.slice(2);

async function main() {
  if (!token()) {
    markReleaseFailed("GITHUB_TOKEN missing — cannot dispatch workflow");
    process.exit(1);
  }

  if (args.includes("--diagnostic")) {
    execSync("node scripts/ci-eas-diagnostic.mjs", { cwd: root, stdio: "inherit" });
    return;
  }

  if (args.includes("--trigger")) {
    const wf = await preflightWorkflow();
    await triggerWorkflow(wf);
    return;
  }

  if (args.includes("--wait-run")) {
    const run = await waitWorkflowRun();
    let buildId = await downloadBuildIdArtifact(run.id);
    if (!buildId) {
      appendTrace({ stage: "build_id", message: "Parse GHA logs for EAS build id", level: "warn" });
    }
    if (buildId) {
      const ok = await verifyExpoBuild(buildId);
      if (!ok) process.exit(1);
      console.log(`[AUTONOMOUS] BUILD_ID=${buildId}`);
    }
    return;
  }

  if (args.includes("--full")) {
    const wf = await preflightWorkflow();
    await triggerWorkflow(wf);
    const run = await waitWorkflowRun();
    const buildId = await downloadBuildIdArtifact(run.id);
    if (!buildId) {
      markReleaseFailed("No BUILD_ID from GHA — EAS step may not have run (check EXPO_TOKEN on GitHub)");
      process.exit(1);
    }
    const ok = await verifyExpoBuild(buildId);
    if (!ok) process.exit(1);
    execSync(`node scripts/complete-apk-loop.mjs ${buildId}`, { cwd: root, stdio: "inherit", env: process.env });
    return;
  }

  console.log(
    "Usage: autonomous-github-eas.mjs --diagnostic | --trigger | --wait-run | --full | --wait-artifact [BUILD_ID]",
  );
  process.exit(2);
}

main().catch((e) => {
  if (!String(e.message).includes("NOT on GitHub")) {
    markReleaseFailed(String(e.message ?? e));
  }
  console.error("[AUTONOMOUS] FAILED:", e.message ?? e);
  process.exit(1);
});
