/**
 * parseOsrmResponse — разбор маршрута OSRM (дороги, этап 2 навигатора). node assert.
 * Run: node scripts/ci/test-osrm-route.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { parseOsrmResponse } = compileTsModule("features/maps/osrmRoute.ts");
const plain = (v) => JSON.parse(JSON.stringify(v));

async function main() {
  let cases = 0;

  // Валидный ответ OSRM (geojson: [lng, lat]!) → координаты перевёрнуты в {latitude, longitude}.
  const ok = parseOsrmResponse({
    code: "Ok",
    routes: [
      {
        distance: 3421.7,
        duration: 384.2,
        geometry: {
          coordinates: [
            [24.4971, 58.3859],
            [24.5, 58.39],
            [24.51, 58.392],
          ],
        },
      },
    ],
  });
  assert.ok(ok);
  assert.equal(ok.distanceMeters, 3421.7);
  assert.equal(ok.durationSec, 384.2);
  assert.equal(ok.coords.length, 3);
  assert.deepEqual(plain(ok.coords[0]), { latitude: 58.3859, longitude: 24.4971 });
  cases += 1;

  // Мусор → null, без исключений.
  assert.equal(parseOsrmResponse(null), null);
  assert.equal(parseOsrmResponse("нет"), null);
  assert.equal(parseOsrmResponse({ code: "NoRoute", routes: [] }), null);
  assert.equal(parseOsrmResponse({ code: "Ok", routes: [] }), null);
  assert.equal(
    parseOsrmResponse({ code: "Ok", routes: [{ distance: 10, duration: 5, geometry: { coordinates: [[24.5, 58.4]] } }] }),
    null, // одна точка — не маршрут
  );
  assert.equal(
    parseOsrmResponse({
      code: "Ok",
      routes: [{ distance: 0, duration: 5, geometry: { coordinates: [[24.5, 58.4], [24.6, 58.5]] } }],
    }),
    null, // нулевая дистанция
  );
  assert.equal(
    parseOsrmResponse({
      code: "Ok",
      routes: [{ distance: 10, duration: 5, geometry: { coordinates: [[24.5, 58.4], ["x", 58.5]] } }],
    }),
    null, // не-числа в координатах
  );
  cases += 1;

  console.log(`test-osrm-route: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
