#!/usr/bin/env node
/**
 * AION ship pipeline: validate → git add → smart commit → push → optional local EAS OTA.
 * См. docs/PIPELINE.md
 *
 * Usage:
 *   node scripts/dev/ship.mjs preview [--local-ota] [--message="..."]
 *   node scripts/dev/ship.mjs main [--message="..."]
 *
 * Flags:
 *   --dry-run          только план и dry-сообщение коммита
 *   --no-add           не git add
 *   --no-commit        не коммитить (после add)
 *   --no-push          не пушить
 *   --local-ota        после push: eas update на preview (только для target preview)
 *   --skip-validate    опасно: пропустить npm run validate
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { banner, err, info, ok, warn, ansi, line } from "./lib/ansi.mjs";
import { git, npmScript, run } from "./lib/exec.mjs";
import { buildOtaMessage, buildReleaseSummary } from "./lib/ota-message.mjs";
import { buildCommitMessage } from "./lib/smart-commit.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const REMOTE = "origin";

/** main не публикует preview OTA локально по умолчанию */
const TARGETS = {
  preview: { pushRef: "preview", localOtaChannel: "preview", allowLocalOta: true },
  main: { pushRef: "main", localOtaChannel: null, allowLocalOta: false },
};

function parseArgs(argv) {
  const out = { target: "", flags: new Set(), message: "" };
  for (const a of argv) {
    if (a === "--dry-run") out.flags.add("dry-run");
    else if (a === "--no-add") out.flags.add("no-add");
    else if (a === "--no-commit") out.flags.add("no-commit");
    else if (a === "--no-push") out.flags.add("no-push");
    else if (a === "--local-ota") out.flags.add("local-ota");
    else if (a === "--skip-validate") out.flags.add("skip-validate");
    else if (a.startsWith("--message=")) out.message = a.slice("--message=".length).replace(/^["']|["']$/g, "");
    else if (!a.startsWith("-") && !out.target) out.target = a;
  }
  return out;
}

function die(code, ...lines) {
  for (const l of lines) console.error(l);
  process.exit(code);
}

function ensureRepoRoot() {
  process.chdir(ROOT);
  const st = git(["rev-parse", "--git-dir"]);
  if (st.status !== 0) die(1, err("Не git-репозиторий (ожидался корень проекта)."));
}

function currentBranch() {
  const r = git(["branch", "--show-current"]);
  return (r.stdout || "unknown").trim();
}

/** Локальные коммиты впереди origin/<pushRef> (если ref ещё нет — 0). */
function commitsAheadOfRemote(pushRef) {
  const tip = git(["rev-parse", "--verify", `${REMOTE}/${pushRef}`]);
  if (tip.status !== 0) return 0;
  const c = git(["rev-list", "--count", `${REMOTE}/${pushRef}..HEAD`]);
  return Math.max(0, parseInt((c.stdout || "0").trim(), 10) || 0);
}

/** Пути из `git status --porcelain` (включая untracked). */
function listChangedPathsFromStatus() {
  const st = git(["status", "--porcelain", "-u"]);
  if (st.status !== 0) return [];
  const out = [];
  for (const line of (st.stdout || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const rest = line.slice(3).trim();
    if (!rest) continue;
    if (rest.includes(" -> ")) {
      const parts = rest.split(" -> ");
      out.push(parts[parts.length - 1].trim());
    } else {
      out.push(rest);
    }
  }
  return [...new Set(out)];
}

function writeArtifacts({ files, commitMessage, validateOk, target, channel }) {
  const dir = join(ROOT, "dist", "ship");
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    return;
  }
  const ts = new Date().toISOString();
  const br = currentBranch();
  const h = git(["rev-parse", "HEAD"]).stdout.trim();
  const meta = {
    timestamp: ts,
    branch: br,
    pushRef: target.pushRef,
    headSha: h,
    commitMessage,
    validateOk,
    channel: channel ?? null,
    files,
  };
  writeFileSync(join(dir, "last-metadata.json"), JSON.stringify(meta, null, 2), "utf8");
  writeFileSync(
    join(dir, "last-summary.txt"),
    buildReleaseSummary({ commitMessage, files, validateOk }),
    "utf8",
  );
  writeFileSync(join(dir, "last-ota-message.txt"), buildOtaMessage({ branch: br, channel: channel ?? "preview" }), "utf8");
}

function runValidate(flags) {
  if (flags.has("skip-validate")) {
    console.log(warn("ПРОПУСК validate (--skip-validate). Не используйте в нормальном потоке."));
    return true;
  }
  console.log("");
  console.log(banner("VALIDATE"));
  console.log(info("npm run validate (typecheck + expo-doctor)"));
  const r = npmScript("validate", true);
  if (r.status !== 0) {
    console.log("");
    console.log(err("Validate failed — push и OTA отменены."));
    console.log(`${ansi.dim}${line()}${ansi.reset}`);
    console.log(`${ansi.dim}Исправьте ошибки TypeScript / expo-doctor и повторите.${ansi.reset}`);
    return false;
  }
  console.log(ok("Validate passed"));
  return true;
}

function runLocalOta(channel, flags) {
  if (!flags.has("local-ota")) return 0;
  console.log("");
  console.log(banner(`LOCAL EAS OTA → ${channel}`));
  const br = currentBranch();
  const msg = buildOtaMessage({ branch: br, channel }).split(/\r?\n/).join(" · ");
  const exe = "npx";
  const args = ["eas-cli@latest", "update", "--channel", channel, "--message", msg, "--non-interactive"];
  console.log(info(`${exe} ${args.join(" ")}`));
  const r = run(exe, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.log(err("EAS update failed (локально). Push уже выполнен — проверьте логи выше."));
    return r.status ?? 1;
  }
  console.log(ok(`OTA published locally → channel ${ansi.bold}${channel}${ansi.reset}`));
  return 0;
}

function main() {
  const { target: targetName, flags, message: userMessage } = parseArgs(process.argv.slice(2));
  ensureRepoRoot();

  if (!targetName || !TARGETS[targetName]) {
    console.log(`${banner("AION SHIP")}`);
    die(
      2,
      info("Укажите цель: preview | main"),
      `  node scripts/dev/ship.mjs preview [--local-ota] [--message="feat: ..."]`,
      `  node scripts/dev/ship.mjs main [--message="fix: ..."]`,
      "",
      info("Флаги: --dry-run --no-add --no-commit --no-push --local-ota --skip-validate"),
    );
  }

  const target = TARGETS[targetName];
  const branchName = currentBranch();

  console.log(banner("AION SHIP"));
  console.log(info(`cwd: ${ROOT}`));
  console.log(info(`branch: ${ansi.bold}${branchName}${ansi.reset}`));
  console.log(info(`push: ${ansi.bold}${REMOTE} HEAD:${target.pushRef}${ansi.reset}`));

  if (!runValidate(flags)) die(1, "");

  const porcelain = git(["status", "--porcelain"]);
  if (porcelain.status !== 0) die(1, err("git status failed"), porcelain.stderr);

  const cleanStart = !(porcelain.stdout || "").trim();
  const ahead = commitsAheadOfRemote(target.pushRef);

  if (cleanStart && flags.has("local-ota") && target.allowLocalOta) {
    console.log(warn("Рабочее дерево чистое — коммита нет; выполняю только local OTA."));
    const otaCode = runLocalOta(target.localOtaChannel, flags);
    process.exit(otaCode);
  }

  if (cleanStart && ahead > 0 && !flags.has("no-push")) {
    console.log("");
    console.log(
      info(`Чистое дерево, но ${ahead} коммит(ов) впереди ${REMOTE}/${target.pushRef} — push без нового коммита.`),
    );
    const lastFiles = git(["show", "--pretty=format:", "--name-only", "HEAD"]);
    const files = (lastFiles.stdout || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const msg = git(["log", "-1", "--pretty=%s"]).stdout.trim() || "chore: ship";
    writeArtifacts({ files, commitMessage: msg, validateOk: true, target, channel: target.localOtaChannel });
    if (flags.has("dry-run")) {
      console.log(ok("[dry-run] только push"));
      process.exit(0);
    }
    const p = git(["push", "-u", REMOTE, `HEAD:${target.pushRef}`], true);
    if (p.status !== 0) die(1, err("git push failed"), p.stderr || "");
    console.log(ok(`Pushed → ${target.pushRef}`));
    if (targetName === "preview") {
      console.log(
        info("GitHub Actions: OTA Preview (channel preview) после приёма push — см. Actions."),
      );
    }
    if (flags.has("local-ota") && target.allowLocalOta) {
      const otaCode = runLocalOta(target.localOtaChannel, flags);
      process.exit(otaCode);
    }
    process.exit(0);
  }

  if (cleanStart) {
    console.log(ok("Рабочее дерево чистое — нечего коммитить и нечего пушить относительно remote."));
    console.log(
      info("Повторный OTA: npm run release:preview, или вручную: git push origin HEAD:preview / eas update."),
    );
    process.exit(0);
  }

  if (flags.has("dry-run")) {
    const previewFiles = listChangedPathsFromStatus();
    const previewMsg = buildCommitMessage({ files: previewFiles, userMessage });
    console.log("");
    console.log(info(`Файлов в коммите (план): ${previewFiles.length}`));
    if (previewFiles.length) {
      console.log(`${ansi.dim}${previewFiles.slice(0, 48).join("\n")}${ansi.reset}`);
      if (previewFiles.length > 48) console.log(`${ansi.dim}… +${previewFiles.length - 48}${ansi.reset}`);
    }
    console.log(info(`Commit message: ${ansi.bold}${previewMsg}${ansi.reset}`));
    console.log(ok("Dry-run: git add / commit / push / OTA не выполнялись."));
    process.exit(0);
  }

  if (!flags.has("no-add")) {
    if (flags.has("dry-run")) console.log(info("[dry-run] git add -A"));
    else {
      const a = git(["add", "-A"], true);
      if (a.status !== 0) die(1, err("git add -A failed"), a.stderr);
      console.log(ok("git add -A"));
    }
  }

  const names = git(["diff", "--cached", "--name-only"]);
  const files = (names.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (files.length === 0) {
    console.log(warn("Индекс пуст после add — пропускаю commit."));
  }

  const commitMessage = buildCommitMessage({ files, userMessage });

  console.log("");
  console.log(info(`Commit message: ${ansi.bold}${commitMessage}${ansi.reset}`));

  let committed = false;
  if (files.length && !flags.has("no-commit")) {
    const c = git(["commit", "-m", commitMessage], true);
    if (c.status !== 0) die(1, err("git commit failed"), c.stderr);
    committed = true;
    console.log(ok("git commit"));
  } else if (flags.has("no-commit")) {
    console.log(warn("Пропуск commit (--no-commit)"));
  }

  const finalMessage = committed ? commitMessage : git(["log", "-1", "--pretty=%s"]).stdout.trim() || commitMessage;

  writeArtifacts({
    files,
    commitMessage: finalMessage,
    validateOk: true,
    target,
    channel: target.localOtaChannel,
  });

  if (!flags.has("no-push")) {
    const ref = `${REMOTE} HEAD:${target.pushRef}`;
    console.log("");
    console.log(info(`git push -u ${ref}`));
    const p = git(["push", "-u", REMOTE, `HEAD:${target.pushRef}`], true);
    if (p.status !== 0) {
      console.log(err("git push failed — OTA на стороне GitHub не запущен (или локальный EAS не стартует)."));
      die(1, p.stderr || "");
    }
    console.log(ok(`Pushed → ${target.pushRef}`));
    if (targetName === "preview") {
      console.log(
        info("GitHub Actions: OTA Preview (channel preview) запустится после приёма push — см. Actions."),
      );
    } else {
      console.log(info("GitHub Actions: CI validate на main — OTA production только вручную (Actions)."));
    }
  } else {
    console.log(warn("Пропуск push (--no-push)"));
  }

  if (flags.has("local-ota")) {
    if (!target.allowLocalOta) {
      console.log(warn("local OTA для main отключён (стабильный production только через GitHub «OTA Production»)."));
      process.exit(0);
    }
    const code = runLocalOta(target.localOtaChannel, flags);
    process.exit(code);
  }

  process.exit(0);
}

main();
