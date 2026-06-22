import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import vm from "node:vm";

const source = readFileSync("src/lib/operations/priority-audit.ts", "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, require: () => ({}) });
const { diffStrategicPriorities } = compiledModule.exports;

const priority = (id, overrides = {}) => ({
  id,
  title: id,
  level: "high",
  subsystemIds: ["driver"],
  status: "not_started",
  rationale: "rationale",
  nextAction: "next",
  setAt: "2026-06-23",
  setBy: "owner",
  ...overrides,
});
const payload = (priorities, overrides = {}) => ({
  lastUpdated: "2026-06-23",
  constitutionVersion: "1",
  ownerDirective: "ship",
  editPolicy: "owner",
  priorities,
  dependencyGraph: [],
  ...overrides,
});

const before = payload([priority("kept"), priority("removed")]);
const after = payload(
  [priority("kept", { status: "in_progress", nextAction: "build" }), priority("added")],
  { ownerDirective: "ship safely" },
);
const paths = diffStrategicPriorities(before, after).map((change) => change.path);

assert(paths.includes("ownerDirective"));
assert(paths.includes("priorities.kept.status"));
assert(paths.includes("priorities.kept.nextAction"));
assert(paths.includes("priorities.added"));
assert(paths.includes("priorities.removed"));
assert.equal(diffStrategicPriorities(before, before).length, 0);

const route = readFileSync("src/app/api/strategic-priorities/route.ts", "utf8");
assert.match(route, /changedBy: "product-owner"/);
assert.match(route, /changes: diffStrategicPriorities\(previous, body\.payload\)/);
assert.doesNotMatch(route, /changedBy: body\.audit\.changedBy/);

console.log("priority audit: OK (server identity + authoritative diff)");
