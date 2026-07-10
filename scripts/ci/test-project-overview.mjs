import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ecosystem = JSON.parse(readFileSync("src/content/ecosystem-status.json", "utf8"));
const priorities = JSON.parse(readFileSync("src/content/strategic-priorities.json", "utf8"));
const page = readFileSync("src/app/page.tsx", "utf8");
const shell = readFileSync("src/components/SiteShell.tsx", "utf8");

// Экосистемные данные остаются источником lastUpdated; проценты больше не выводим на сайте.
assert.ok(Object.values(ecosystem.readiness).length > 0);

// Главная — про приложение водителя, а не про «платформу модулей».
assert.match(page, /AION Driver · для водителя Bolt/);
assert.match(page, /Что умеет Driver/);
assert.match(page, /Одно до конца — потом следующее/);
assert.match(page, /Куда движемся/);
// Балласт «платформы модулей» не должен вернуться на главную.
assert.doesNotMatch(page, /Модули платформы/);
assert.doesNotMatch(page, /готовность платформы/);
assert.doesNotMatch(priorities.nextImplementationTarget, /device smoke|8\/8/i);

// Навигация урезана до сути: только Обзор / Driver / План / Скачать.
for (const label of ["Обзор", "Driver", "План", "Скачать"]) {
  assert.match(shell, new RegExp(`label: "${label}"`));
}
for (const gone of ["Операции", "Прогресс"]) {
  assert.doesNotMatch(shell, new RegExp(`label: "${gone}"`));
}

console.log("project overview: OK (driver-first home, phased plan, slim navigation)");
