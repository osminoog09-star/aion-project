/**
 * haversineMeters — корневой примитив всех дистанций (км, profit/km). node assert.
 * Run: node scripts/ci/test-geo-haversine.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { haversineMeters } = compileTsModule("utils/geo.ts");

function near(actual, expected, tolM, msg) {
  assert.ok(
    Math.abs(actual - expected) <= tolM,
    `${msg}: ${actual} != ${expected} (±${tolM})`,
  );
}

async function main() {
  let cases = 0;

  // Идентичные точки → ровно 0.
  assert.equal(haversineMeters({ lat: 58.38, lng: 24.5 }, { lat: 58.38, lng: 24.5 }), 0);
  cases += 1;

  // 1° широты на экваторе ≈ R·π/180 = 111194.93 м (фиксирует радиус и формулу).
  near(haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }), 111194.93, 1, "1° широты");
  cases += 1;

  // 1° долготы на экваторе ≈ столько же.
  near(haversineMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }), 111194.93, 1, "1° долготы экв.");
  cases += 1;

  // 1° долготы на 60° широты ≈ 55596.93 м (фиксирует множитель cos(lat)).
  near(haversineMeters({ lat: 60, lng: 0 }, { lat: 60, lng: 1 }), 55596.93, 1, "1° долготы 60°");
  cases += 1;

  // Симметрия: hav(a,b) === hav(b,a).
  const a = { lat: 58.385, lng: 24.497 };
  const b = { lat: 58.39, lng: 24.51 };
  assert.equal(haversineMeters(a, b), haversineMeters(b, a));
  cases += 1;

  // Маленький реальный шаг (Пярну) положителен и в разумных пределах.
  const step = haversineMeters({ lat: 58.385, lng: 24.497 }, { lat: 58.3851, lng: 24.4972 });
  near(step, 16.11, 0.5, "шаг Пярну");
  assert.ok(step > 0 && step < 50);
  cases += 1;

  console.log(`test-geo-haversine: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
