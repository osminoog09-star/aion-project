import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const driverRoot = path.resolve(import.meta.dirname, "../..");
const shiftContext = readFileSync(path.join(driverRoot, "contexts/ShiftContext.tsx"), "utf8");

assert.match(
  shiftContext,
  /const handle = await getBackgroundTrackingAdapter\(\)\.enableForShift\(shift\);\s*if \(cancelled\) \{\s*handle\.dispose\(\);\s*return;\s*\}\s*bgTrackingRef\.current = handle;[\s\S]*?catch \(error\) \{[\s\S]*?background tracking start failed/s,
  "a late FGS start must be disposed after AppState returns to foreground",
);

assert.match(
  shiftContext,
  /return \(\) => \{\s*cancelled = true;\s*bgTrackingRef\.current\?\.dispose\(\);\s*bgTrackingRef\.current = null;/s,
  "effect cleanup must cancel pending starts and dispose the current FGS handle",
);

console.log("background transition cleanup: OK (pending and active FGS handles)");
