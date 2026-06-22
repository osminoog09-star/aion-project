import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const adapter = readFileSync(
  path.join(root, "services/androidForegroundLocationShiftAdapter.ts"),
  "utf8",
);
const context = readFileSync(path.join(root, "contexts/ShiftContext.tsx"), "utf8");
const contract = readFileSync(path.join(root, "services/backgroundTracking.ts"), "utf8");

assert.match(adapter, /private generation = 0/);
assert.match(adapter, /private operationChain: Promise<unknown> = Promise\.resolve\(\)/);
assert.match(adapter, /const generation = \+\+this\.generation/);
assert.match(adapter, /if \(generation !== this\.generation\) return/);
assert.match(adapter, /ensureHealthy:[\s\S]*?hasStartedLocationUpdatesAsync[\s\S]*?this\.startTask\(\)/);
assert.match(contract, /BACKGROUND_RUNTIME_HEALTH_CHECK_MS = 60_000/);
assert.match(context, /setInterval\([\s\S]*?\.ensureHealthy\(\)[\s\S]*?BACKGROUND_RUNTIME_HEALTH_CHECK_MS/);
assert.match(context, /status === "restarted"[\s\S]*?Background location task restarted/);
assert.match(context, /clearInterval\(healthTimer\)/);

console.log("background runtime recovery: OK (serialized ownership + watchdog restart)");
