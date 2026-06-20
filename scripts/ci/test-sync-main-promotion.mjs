import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(".github/workflows/sync-main-from-master.yml", "utf8");
const mergeIndex = source.indexOf("git merge --ff-only origin/master");
const promotionIndex = source.indexOf('git commit --allow-empty -m "chore(deploy): promote synced main"');
const pushIndex = source.indexOf("git push origin main");

assert.ok(mergeIndex >= 0, "workflow must merge master into main");
assert.ok(promotionIndex > mergeIndex, "single-parent promotion commit must follow the merge");
assert.ok(pushIndex > promotionIndex, "promotion commit must be pushed to main");
assert.doesNotMatch(source, /promote synced main.*\[skip ci\]/, "promotion must trigger Vercel Git integration");

console.log("test-sync-main-promotion: ok (4 assertions)");
