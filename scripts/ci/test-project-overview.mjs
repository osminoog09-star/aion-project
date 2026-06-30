import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ecosystem = JSON.parse(readFileSync("src/content/ecosystem-status.json", "utf8"));
const priorities = JSON.parse(readFileSync("src/content/strategic-priorities.json", "utf8"));
const page = readFileSync("src/app/page.tsx", "utf8");
const shell = readFileSync("src/components/SiteShell.tsx", "utf8");

const values = Object.values(ecosystem.readiness);
const progress = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
assert.equal(progress, 57);
assert.match(page, /Платформа AION/);
assert.match(page, /Модули платформы/);
assert.match(page, /Что умеет Driver/);
assert.match(page, /Готовность по направлениям/);
assert.match(page, /готовность платформы/);
assert.match(page, /Четыре понятных этапа/);
assert.match(page, /Путь до результата/);
assert.doesNotMatch(priorities.nextImplementationTarget, /device smoke|8\/8/i);

for (const label of ["Обзор", "Driver", "Прогресс", "Операции", "Релизы"]) {
  assert.match(shell, new RegExp(`label: "${label}"`));
}

console.log("project overview: OK (57% progress, live status, priority labels, compact navigation)");
