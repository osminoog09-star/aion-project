import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const driverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const foreground = readFileSync(path.join(driverRoot, "services/locationService.ts"), "utf8");
const background = readFileSync(
  path.join(driverRoot, "services/androidForegroundLocationShiftAdapter.ts"),
  "utf8",
);

assert.match(foreground, /accuracy:\s*Location\.Accuracy\.High/);
assert.doesNotMatch(foreground, /accuracy:\s*Location\.Accuracy\.Balanced/);
assert.match(background, /accuracy:\s*Location\.Accuracy\.High/);
assert.match(background, /pausesUpdatesAutomatically:\s*false/);
assert.doesNotMatch(background, /accuracy:\s*Location\.Accuracy\.Balanced/);

console.log("location accuracy policy: OK (High + continuous active-shift updates)");
