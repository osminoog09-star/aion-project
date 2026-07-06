/**
 * parseOsrmResponse — разбор маршрута OSRM (дороги, этап 2 навигатора). node assert.
 * Run: node scripts/ci/test-osrm-route.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { parseOsrmResponse, formatManeuver } = compileTsModule("features/maps/osrmRoute.ts");
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
  assert.equal(ok.steps.length, 0); // нет legs → пустые шаги, без падения
  cases += 1;

  // Пошаговые манёвры из legs[].steps[] → русские подсказки.
  const withSteps = parseOsrmResponse({
    code: "Ok",
    routes: [
      {
        distance: 1000,
        duration: 120,
        geometry: { coordinates: [[24.49, 58.38], [24.5, 58.39]] },
        legs: [
          {
            steps: [
              { maneuver: { type: "depart" }, name: "Rüütli", distance: 120 },
              { maneuver: { type: "turn", modifier: "right" }, name: "Aida", distance: 300 },
              { maneuver: { type: "arrive" }, name: "", distance: 0 },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(withSteps.steps.length, 3);
  assert.deepEqual(plain(withSteps.steps[0]), { instruction: "Начинаем по Rüütli", distanceMeters: 120 });
  assert.deepEqual(plain(withSteps.steps[1]), { instruction: "Поверните направо на Aida", distanceMeters: 300 });
  assert.equal(withSteps.steps[2].instruction, "Прибытие в точку");
  cases += 1;

  // formatManeuver — ключевые случаи.
  assert.equal(formatManeuver("turn", "left", "Pikk"), "Поверните налево на Pikk");
  assert.equal(formatManeuver("turn", "slight right", ""), "Поверните плавно направо");
  assert.equal(formatManeuver("continue", "straight", "Riia"), "Продолжайте прямо на Riia");
  assert.equal(formatManeuver("roundabout", null, ""), "Двигайтесь по кругу");
  assert.equal(formatManeuver("arrive", null, ""), "Прибытие в точку");
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
