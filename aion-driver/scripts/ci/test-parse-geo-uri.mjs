/**
 * parseGeoUri — точка назначения из навигационных ссылок (geo:/google.navigation:).
 * Run: node scripts/ci/test-parse-geo-uri.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { parseGeoUri } = compileTsModule("features/maps/parseGeoUri.ts");
const plain = (v) => JSON.parse(JSON.stringify(v));

async function main() {
  let cases = 0;

  // Прямые координаты в пути.
  assert.deepEqual(plain(parseGeoUri("geo:58.3859,24.4971")), {
    lat: 58.3859,
    lng: 24.4971,
    label: null,
  });
  assert.deepEqual(plain(parseGeoUri("geo:58.3859,24.4971?z=16")), {
    lat: 58.3859,
    lng: 24.4971,
    label: null,
  });
  cases += 1;

  // q-форма с меткой (типичная у Bolt/Google): q приоритетнее нулевого пути.
  assert.deepEqual(plain(parseGeoUri("geo:0,0?q=58.39,24.51(Rüütli 12)")), {
    lat: 58.39,
    lng: 24.51,
    label: "Rüütli 12",
  });
  assert.deepEqual(plain(parseGeoUri("geo:0,0?q=58.39,24.51")), {
    lat: 58.39,
    lng: 24.51,
    label: null,
  });
  cases += 1;

  // google.navigation.
  assert.deepEqual(plain(parseGeoUri("google.navigation:q=58.4,24.5")), {
    lat: 58.4,
    lng: 24.5,
    label: null,
  });
  cases += 1;

  // Отбраковка: адрес без координат, 0,0, вне диапазона, чужая схема, мусор.
  assert.equal(parseGeoUri("geo:0,0?q=Rüütli 12, Pärnu"), null);
  assert.equal(parseGeoUri("geo:0,0"), null);
  assert.equal(parseGeoUri("geo:91,10"), null);
  assert.equal(parseGeoUri("geo:10,181"), null);
  assert.equal(parseGeoUri("https://example.com"), null);
  assert.equal(parseGeoUri(""), null);
  assert.equal(parseGeoUri("google.navigation:q=центр города"), null);
  cases += 1;

  console.log(`test-parse-geo-uri: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
