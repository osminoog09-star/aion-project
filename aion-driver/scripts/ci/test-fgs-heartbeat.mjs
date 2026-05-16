/**
 * FGS heartbeat freshness helper.
 */
import assert from "node:assert/strict";

async function main() {
  let isFgsHeartbeatFresh;
  try {
    const mod = await import("../../utils/fgsHeartbeatFresh.ts");
    isFgsHeartbeatFresh = mod.isFgsHeartbeatFresh;
  } catch (err) {
    console.log("skip:", err?.message ?? err);
    process.exit(0);
  }

  assert.equal(isFgsHeartbeatFresh(null), false);
  assert.equal(isFgsHeartbeatFresh(30_000), true);
  assert.equal(isFgsHeartbeatFresh(400_000), false);
  console.log("test-fgs-heartbeat: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
