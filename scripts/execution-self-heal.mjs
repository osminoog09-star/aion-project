/**
 * Self-healing: typecheck → build → deploy:validate with retries + recovery confidence.
 *
 *   node scripts/execution-self-heal.mjs
 *   node scripts/execution-self-heal.mjs --skip-build --deploy-retries 5
 */
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendExecutionFeed } from "./execution-feed.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const skipBuild = process.argv.includes("--skip-build");
const deployRetriesArg = process.argv.indexOf("--deploy-retries");
const deployRetries =
  deployRetriesArg >= 0 && process.argv[deployRetriesArg + 1]
    ? Number.parseInt(process.argv[deployRetriesArg + 1], 10)
    : 3;

function run(cmd, label) {
  console.log(`[🛠 AI восстанавливает] ${label}…`);
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: "utf8", stdio: "pipe" });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.slice(-2500) };
}

function phase(args) {
  execSync(`node scripts/execution-runtime.mjs ${args} --no-hint`, { cwd: root, stdio: "inherit" });
}

function recoveryConfidence(attempt, maxAttempts, stepOk) {
  const base = stepOk ? 0.55 : 0.25;
  const attemptBoost = (attempt / maxAttempts) * 0.25;
  return Math.min(0.95, base + attemptBoost);
}

phase(
  '--phase recovering --task "Автоматическое восстановление системы" --subsystem operations-center --reasoning "AI проверяет типы, собирает приложение и проверяет production" --progress "проверка типов" --typecheck running --build pending --deploy idle --recovery-confidence 0.55',
);

let confidence = 0.55;
let blocker = null;

const tc = run("npx tsc --noEmit", "typecheck");
if (!tc.ok) {
  confidence = recoveryConfidence(1, 1, false);
  blocker = `Проверка типов не прошла: ${tc.out.slice(-400)}`;
  appendExecutionFeed({
    title: "AI не смог восстановить: проверка типов",
    summary: blocker,
    eventType: "execution_blocked",
    confidence: confidence < 0.45 ? "blocked" : "medium",
  });
  if (confidence < 0.45) {
    phase(
      `--phase blocked --task "Проверка типов не прошла" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck failed --build failed --failure-kind typecheck --recovery-confidence ${confidence}`,
    );
    process.exit(1);
  }
  phase(
    `--phase recovering --task "Нужна ручная правка типов" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --recovery-confidence ${confidence} --next "исправить типы и запустить execution:heal"`,
  );
  process.exit(1);
}

phase('--phase validating --task "Сборка приложения" --typecheck passed --build running --progress "сборка приложения"');
let build = skipBuild ? "passed" : "pending";

if (!skipBuild) {
  const b = run("npm run build", "build");
  if (!b.ok) {
    confidence = recoveryConfidence(1, 1, false);
    blocker = `Сборка не прошла: ${b.out.slice(-400)}`;
    appendExecutionFeed({
      title: "AI не смог восстановить: сборка",
      summary: blocker,
      eventType: "execution_blocked",
      confidence: "medium",
    });
    phase(
      `--phase blocked --task "Сборка приложения не прошла" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck passed --build failed --failure-kind build --recovery-confidence ${confidence}`,
    );
    process.exit(1);
  }
  build = "passed";
  const vr = run("npm run verify:routes", "verify routes");
  if (!vr.ok) {
    blocker = `verify:routes failed: ${vr.out.slice(-300)}`;
    phase(
      `--phase blocked --task "Маршрут /operations/live отсутствует в сборке" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --build failed --failure-kind routes_manifest`,
    );
    process.exit(1);
  }
}

phase('--phase deploying --task "Проверка production" --typecheck passed --build passed --deploy running --progress "проверка маршрутов на сайте"');
let deploy = "failed";
let routes = "failed";

for (let attempt = 1; attempt <= deployRetries; attempt++) {
  confidence = recoveryConfidence(attempt, deployRetries, true);
  phase(
    `--phase recovering --task "Повторная проверка production (${attempt}/${deployRetries})" --subsystem operations-center --reasoning "Ожидаем обновление Vercel — маршрут мог быть временно недоступен" --progress "проверка сайта #${attempt}" --recovery-confidence ${confidence} --retry ${attempt}`,
  );

  const v = run("npm run deploy:validate", "deploy:validate");
  if (v.ok) {
    deploy = "passed";
    routes = "passed";
    break;
  }

  const live404 = v.out.includes("/operations/live") && v.out.includes("FAIL");
  blocker = live404
    ? `Страница /operations/live ещё недоступна (попытка ${attempt}/${deployRetries})`
    : `Проверка production не прошла: ${v.out.slice(-400)}`;

  appendExecutionFeed({
    title: `AI повторяет проверку деплоя (${attempt})`,
    summary: blocker,
    eventType: "execution_recovering",
    confidence: confidence >= 0.45 ? "high" : "medium",
  });

  if (attempt < deployRetries && live404) {
    console.log(`[🛠 AI восстанавливает] Ожидание 45 сек — Vercel обновляет сайт…`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 45_000);
    continue;
  }

  if (confidence < 0.45) {
    phase(
      `--phase blocked --task "Проверка production исчерпана" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck passed --build passed --deploy failed --routes failed --failure-kind deploy_validation --recovery-confidence ${confidence}`,
    );
    process.exit(live404 ? 2 : 1);
  }

  phase(
    `--phase recovering --task "Проверка production не прошла" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --recovery-confidence ${confidence} --next "проверить Vercel в панели владельца"`,
  );
  process.exit(live404 ? 2 : 1);
}

appendExecutionFeed({
  title: "AI успешно восстановил систему",
  summary: "Проверка типов, сборка и production-маршруты — всё в порядке",
  eventType: "execution_completed",
});

phase(
  '--phase completed --task "Восстановление завершено успешно" --subsystem operations-center --reasoning "Все проверки прошли — сайт и маршруты доступны" --typecheck passed --build passed --deploy passed --routes passed --recovery-confidence 0.95 --last-completed "Проверка production успешна" --next "продолжить roadmap автоматически"',
);
console.log("[✨ AI завершил] Автовосстановление прошло успешно");
