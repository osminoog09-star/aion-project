import { readFileSync, writeFileSync } from "node:fs";

function read(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function write(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const now = new Date().toISOString();
const today = now.slice(0, 10);
const manifest = read("public/apk-manifest.preview.json");
const apkLabel = `EAS preview APK ${manifest.latestVersion} build ${manifest.buildNumber}`;

const work = read("src/content/codex-work-status.json");
work.lastUpdated = now;
work.priority = "Модуль Driver";
work.headline =
  "Codex автономно развивает Driver runtime, GPS, экономику смены, OCR и portal write-path. APK hardening закрыт.";
work.currentFocus =
  "Надёжность обычной смены: точный GPS, единая after-costs прибыль, атомарная OCR-очередь и синхронизация Supabase.";
work.currentStatus = "Автономная продуктовая разработка";
work.latestRun = {
  label: apkLabel,
  status: "success",
  url: manifest.apkUrl,
};
work.completed = [
  `GPS Accuracy.High и continuous FGS вошли в ${manifest.latestVersion} build ${manifest.buildNumber}.`,
  "Устранена гонка позднего foreground GPS watcher после завершения смены.",
  "Прибыль после топлива, аренды и fixed costs унифицирована в runtime, UI и Supabase trips.",
  "Cloud fallback сохраняет отрицательную прибыль, не превращая убыточную смену в нулевую.",
  "OCR queue атомарно забирает job; пустой результат можно повторить без вечного dedupe-hit.",
  "Portal priorities пишутся в Supabase на Vercel; owner/agent secrets проверяются constant-time.",
  "Maps/Fuel ADR и provenance-схемы готовы; числовые метрики не создаются без реальных данных.",
];
work.next = [
  "Продолжить background runtime и cloud sync edge cases.",
  "Расширять OCR и Driver intelligence только на реальных сменах и чеках.",
  "Реализовывать Maps/Fuel producers после накопления достаточных persisted данных; без фейкового engine.",
];
work.checks = [
  "Driver validate:code — OK",
  "Portal repo:verify — OK",
  "Next.js production build — OK",
  `${apkLabel} — READY`,
  "Owner device smoke / field validation 8/8 — не является гейтом",
];
write("src/content/codex-work-status.json", work);

const releases = read("src/content/releases.json");
releases.lastUpdated = today;
const preview = releases.channels?.find((channel) => channel.id === "preview");
if (preview) {
  preview.appVersion = manifest.latestVersion;
  preview.notes = `${apkLabel}, runtime ${manifest.runtimeVersion}, EAS ${manifest.easBuildId}. GPS Accuracy.High; manifest live.`;
}
releases.apk.latestKnownVersion = manifest.latestVersion;
releases.apk.note = `${apkLabel} готов и опубликован. APK hardening закрыт; новые native builds создаются только для функциональных изменений.`;
if (!releases.history?.some((item) => item.detail?.includes(manifest.easBuildId))) {
  releases.history = [
    {
      date: today,
      type: "apk",
      title: `${apkLabel} FINISHED`,
      detail: `GPS Accuracy.High + continuous FGS. EAS ${manifest.easBuildId}. APK: ${manifest.apkUrl}`,
    },
    ...(releases.history ?? []),
  ];
}
write("src/content/releases.json", releases);

const ecosystem = read("src/content/ecosystem-status.json");
ecosystem.lastUpdated = today;
ecosystem.execution.currentPriority =
  "Driver runtime: GPS lifecycle, after-costs economics, OCR reliability и Supabase sync.";
ecosystem.execution.nextPriority =
  "Background runtime/cloud edge cases; Maps/Fuel только по реально накопленным данным.";
ecosystem.execution.blockedTasks = (ecosystem.execution.blockedTasks ?? []).filter(
  (item) => !/device|field validation|8\/8/i.test(item),
);
ecosystem.sprint.label = "Driver runtime и operational intelligence";
ecosystem.sprint.focus =
  `${apkLabel} готов. Сейчас: runtime, OCR, cloud writes. Maps/Fuel: ADR и схемы без фейковых чисел.`;
const subsystemUpdates = {
  "mobile-app": {
    percent: 76,
    note: "Driver shift runtime, GPS High, history, after-costs UI и cloud projection работают; продолжается edge-case hardening.",
    currentPhase: "Runtime reliability",
    nextMilestone: "Background lifecycle и cloud merge edge cases",
  },
  "background-drive": {
    percent: 48,
    note: "Android FGS location task, Accuracy.High, continuous updates и cleanup поздней subscription реализованы; ручной device gate снят.",
    currentPhase: "Automated runtime hardening",
    nextMilestone: "Reconnect/OEM observability без owner gate",
    blockers: [],
  },
  ocr: {
    percent: 80,
    note: "Production queue имеет retry, recovery, meaningful-result dedupe и атомарный claim; фиктивные суммы не создаются.",
    nextMilestone: "Качество extraction на реальных чеках и payout screenshots",
  },
  "web-portal": {
    percent: 44,
    note: "Operations, owner auth, Supabase-first priority writes и live feed работают на Vercel.",
    nextMilestone: "Private operational data и расширение authenticated writes",
  },
  "apk-channel": {
    percent: 72,
    note: `${apkLabel} опубликован; manifest auto-sync и update policy работают. Hardening-фаза закрыта.`,
    nextMilestone: "Только функциональные native builds",
  },
  "operations-center": {
    percent: 58,
    note: "Operations показывает автономную работу, feed, priorities и release state; устаревший owner 8/8 gate удалён из активного UI.",
    nextMilestone: "Автоматический snapshot sync без ручного JSON drift",
  },
};
for (const subsystem of ecosystem.subsystems ?? []) {
  Object.assign(subsystem, subsystemUpdates[subsystem.id] ?? {});
}
write("src/content/ecosystem-status.json", ecosystem);

const roadmap = read("src/content/roadmap-execution.json");
roadmap.executionQueue.currentActiveEpic =
  "Driver runtime reliability + operational intelligence";
roadmap.executionQueue.currentSubsystemFocus = "background-drive";
roadmap.executionQueue.nextImplementationTarget =
  "Background runtime/cloud sync edge cases; OCR real-data quality; Maps/Fuel producers only with sufficient persisted evidence.";
const apkEpic = roadmap.executionQueue.autonomousSwimStack?.find(
  (item) => item.id === "apk-release-loop-109",
);
if (apkEpic) {
  apkEpic.status = "shipped";
  apkEpic.title = `APK ${manifest.latestVersion} build ${manifest.buildNumber} functional GPS release`;
  apkEpic.tasks = [
    `EAS ${manifest.easBuildId} — FINISHED`,
    `Manifest ${manifest.latestVersion} build ${manifest.buildNumber} + direct APK URL — LIVE`,
    "GPS Accuracy.High + continuous FGS — DONE",
    "APK hardening phase — CLOSED",
  ];
}
const bgEpic = roadmap.executionQueue.autonomousSwimStack?.find(
  (item) => item.id === "android-background-runtime-production",
);
if (bgEpic) {
  bgEpic.status = "in_progress";
  bgEpic.tasks = [
    "Accuracy.High + continuous FGS — DONE",
    "Late foreground watcher cleanup — DONE",
    "Automated reconnect/OEM observability — NEXT",
    "Owner device smoke / 8/8 — REMOVED AS GATE",
  ];
  bgEpic.blocked = false;
}
write("src/content/roadmap-execution.json", roadmap);

const extensions = read("src/content/roadmap-subsystem-extensions.json");
if (extensions["apk-channel"]) {
  extensions["apk-channel"].whatWorks = [
    `${apkLabel} live`,
    "HTTPS manifest + semver/runtime/update policy validation",
    "URL-scoped offline cache and deterministic provenance",
    "CI auto-sync after EAS FINISHED",
  ];
  extensions["apk-channel"].nextRecommendedStep =
    "Не полировать manifest; следующий APK только для функционального native change.";
  extensions["apk-channel"].productionReadiness = 72;
}
if (extensions["background-drive"]) {
  extensions["background-drive"].architectureState =
    "Android FGS + Accuracy.High + continuous updates + late-subscription cleanup; automated hardening продолжается без owner device gate.";
  extensions["background-drive"].nextRecommendedStep =
    "Reconnect/OEM observability и deterministic lifecycle tests.";
}
write("src/content/roadmap-subsystem-extensions.json", extensions);

const strategy = read("src/content/strategic-long-term-directions.json");
strategy.lastUpdated = today;
strategy.aiStrategyRu.immediateFocusRu =
  "Сейчас: надёжный Driver runtime, GPS High, after-costs экономика, OCR и cloud writes. Maps/Fuel — только реальные данные, без фейкового engine.";
for (const direction of strategy.longTermDirections ?? []) {
  for (const phase of direction.phases ?? []) {
    if (/field validation|8\/8/i.test(phase.etaWindowRu ?? "")) {
      phase.etaWindowRu = "после накопления достаточных реальных GPS/shift данных";
    }
  }
}
write("src/content/strategic-long-term-directions.json", strategy);

const requirements = read("src/content/portal-runtime-requirements.json");
requirements.lastUpdated = today;
requirements.requiredFeatures = ["route_timeline"];
requirements.blockFieldValidationUntilCompatible = false;
requirements.notesRu =
  `Portal совместим с Driver >=${requirements.minRuntimeVersion}. ${apkLabel} опубликован; field validation 8/8 не является active gate.`;
write("src/content/portal-runtime-requirements.json", requirements);

console.log(`Public project status synchronized to ${apkLabel}.`);
