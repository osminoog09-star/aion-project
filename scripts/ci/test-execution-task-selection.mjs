import assert from "node:assert/strict";
import { pickNextTask, taskKey } from "../execution-orchestrator-core.mjs";

const priorities = {
  nextImplementationTarget: "Unified shift runtime + operational costs",
  priorities: [],
};

const first = pickNextTask(priorities, {
  lastTaskKey: null,
  sameTaskCount: 0,
  totalAutonomousTicks: 0,
});
assert.equal(first.subsystem, "shift-economics");
assert.doesNotMatch(first.key, /apk|field|device/);

const switched = pickNextTask(priorities, {
  lastTaskKey: taskKey(first.task),
  sameTaskCount: 3,
  totalAutonomousTicks: 3,
});
assert.notEqual(switched.subsystem, first.subsystem);
assert.doesNotMatch(switched.key, /apk|field|device/);

console.log("execution task selection: OK (owner gate excluded, anti-loop at 3)");
