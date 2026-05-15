/**
 * Select next dependency-safe task and transition runtime (autonomous loop).
 *   node scripts/execution-autonomous-next.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { narrateAionActiveRu } from "./execution-owner-ru.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const priorities = JSON.parse(
  fs.readFileSync(path.join(root, "src/content/strategic-priorities.json"), "utf8"),
);

const QUEUE = [
  {
    task: "Route intelligence UX + field validation",
    subsystem: "driver-intelligence",
    reasoning: "Проверка backfill и stop-zone на реальном устройстве",
    next: "OTA тест Driver",
  },
  {
    task: "Stop-zone validation на устройстве",
    subsystem: "driver-intelligence",
    reasoning: "Подтвердить GPS cluster insights после 2+ смен",
    next: "runtime stabilization",
  },
  {
    task: "Runtime stabilization",
    subsystem: "background-drive",
    reasoning: "FGS + unified shift path production gate",
    next: "Overlay HUD v2",
  },
];

const target = priorities.nextImplementationTarget || QUEUE[0].task;
const pick = QUEUE.find((q) => target.toLowerCase().includes(q.task.slice(0, 12).toLowerCase())) ?? QUEUE[0];

const args = [
  "--phase",
  "coding",
  "--task",
  `"${pick.task}"`,
  "--subsystem",
  pick.subsystem,
  "--reasoning",
  `"${pick.reasoning}"`,
  "--next",
  `"${pick.next}"`,
  "--confidence",
  "0.88",
  "--progress",
  `"${target}"`,
].join(" ");

execSync(`node scripts/execution-runtime.mjs ${args}`, { cwd: root, stdio: "inherit" });

console.log("\n[AION AUTONOMOUS] Следующая задача выбрана автоматически — продолжаю без запроса владельцу.\n");
narrateAionActiveRu({
  phase: "coding",
  task: pick.task,
  reasoning: pick.reasoning,
  next: pick.next,
  confidence: 0.88,
  progress: target,
});
