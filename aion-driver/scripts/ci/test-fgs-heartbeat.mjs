/**
 * FGS heartbeat freshness helper.
 */
import assert from "node:assert/strict";
import { importTsOrFail } from "./lib/importTsOrFail.mjs";

async function main() {
  const { isFgsHeartbeatFresh } = await importTsOrFail(
    () => import("../../utils/fgsHeartbeatFresh.ts"),
    "fgsHeartbeatFresh",
  );

  assert.equal(isFgsHeartbeatFresh(null), false);
  assert.equal(isFgsHeartbeatFresh(30_000), true);
  assert.equal(isFgsHeartbeatFresh(400_000), false);
  console.log("test-fgs-heartbeat: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
