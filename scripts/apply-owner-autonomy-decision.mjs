import { readFileSync, writeFileSync } from "node:fs";

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const now = new Date().toISOString();
const prioritiesFile = "src/content/strategic-priorities.json";
const stateFile = "src/content/autonomous-execution-state.json";
const loopFile = "src/content/execution-loop-state.json";

const priorities = readJson(prioritiesFile);
priorities.lastUpdated = now.slice(0, 10);
priorities.ownerDirective =
  "Непрерывный автономный режим. Field validation 8/8 навсегда снят как блокер. APK hardening закрыт. Приоритет: GPS High, unified runtime/costs, profit UI, OCR, portal writes, Maps/Fuel ADR.";
priorities.nextImplementationTarget = "Unified shift runtime + operational costs";
priorities.executionNotes =
  "Не ждать owner device smoke. validate:code и repo:verify обязательны. Maps/Fuel показывают числа только из реально накопленных данных; без данных UI ничего не выдумывает.";

const priorityUpdates = {
  "aion-maps-driver-runtime-os": {
    status: "actionable",
    nextAction: "ADR и схемы реальных GPS-данных; production map/routing engine пока не запускать",
  },
  "operational-fuel-cost-intelligence": {
    status: "actionable",
    nextAction: "Схема operational costs и fuel allocation только по реальным сменам и OCR-чекам",
  },
  "driver-intelligence-core": {
    status: "in_progress",
    nextAction: "GPS High и непрерывный foreground service; затем unified runtime и operational costs",
  },
  "apk-release-loop": {
    status: "done",
    nextAction: "APK hardening закрыт; новые preview builds только для функциональных изменений Driver",
  },
  "background-runtime-production": {
    status: "in_progress",
    nextAction: "Автоматические проверки FGS, reconnect и GPS policy без owner device gate",
  },
};

for (const item of priorities.priorities ?? []) {
  Object.assign(item, priorityUpdates[item.id] ?? {});
}

const dependencyUpdates = {
  "time-intelligence": {
    status: "in_progress",
    reason: "Route timeline and rollups use accumulated real shift data; no owner device gate",
  },
  "aion-maps-driver-runtime-os": {
    status: "actionable",
    reason: "ADR and data schemas are actionable; production engine remains dependency-gated",
  },
  "maps-gps-intelligence": {
    status: "actionable",
    reason: "Define real-data kilometer classes and storage contracts; do not synthesize metrics",
  },
  "operational-fuel-cost-intelligence": {
    status: "actionable",
    reason: "Runtime cost contract and real OCR data path are actionable without field validation",
  },
};

for (const item of priorities.dependencyGraph ?? []) {
  Object.assign(item, dependencyUpdates[item.id] ?? {});
}

priorities.cursorAdaptationRules = [
  "Never select APK manifest hardening; that phase is closed",
  "After 3 repeats, switch to a different subsystem",
  "Execute critical and high priorities before medium and low unless dependency-blocked",
  "Maps/Fuel numbers must come from persisted real usage; absent data stays absent",
  "Automated validation is mandatory; owner device smoke is not a gate",
];
writeJson(prioritiesFile, priorities);

const state = readJson(stateFile);
state.phase = "autonomous_active";
state.updatedAt = now;
state.humanBoundary = null;
state.note = "Owner removed field validation 8/8 permanently. Autonomous queue is active; APK hardening is closed.";
state.error = null;
state.telemetry = "autonomous_owner_mandate";
state.history = [
  {
    at: now,
    phase: "autonomous_active",
    ownerDecision: "field_validation_8_8_removed_permanently",
    queue: "gps_runtime_costs_profit_ocr_portal_maps_fuel_adr",
  },
  ...(state.history ?? []),
].slice(0, 50);
writeJson(stateFile, state);

const loop = readJson(loopFile);
loop.lastTaskKey = null;
loop.sameTaskCount = 0;
loop.lastAutonomousAt = now;
writeJson(loopFile, loop);

console.log("Owner autonomy decision applied: device gate removed, queue reset.");
