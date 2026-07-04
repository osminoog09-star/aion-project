/**
 * Маршрут по реальным дорогам через OSRM (roadmap aion-maps-navigation, этап 2).
 *
 * Быстрый старт — публичный demo-сервер OSRM (router.project-osrm.org):
 * без ключей, но с лимитами и без SLA — только для превью-этапа; прод-путь =
 * self-host OSRM + OSM-экстракт Эстонии (см. docs/ADR-road-matching.md, тот же
 * сервер закроет и road matching). Если сервер недоступен — возвращаем null,
 * UI честно показывает прямую линию, ничего не выдумываем.
 *
 * Чистый разбор ответа — parseOsrmResponse (тест scripts/ci/test-osrm-route.mjs).
 */
export type RoadRoute = {
  coords: { latitude: number; longitude: number }[];
  distanceMeters: number;
  durationSec: number;
};

const OSRM_BASE = "https://router.project-osrm.org";

/** Разбор ответа OSRM /route/v1 (geometries=geojson). Мусор → null. */
export function parseOsrmResponse(json: unknown): RoadRoute | null {
  if (!json || typeof json !== "object") return null;
  const o = json as {
    code?: unknown;
    routes?: {
      distance?: unknown;
      duration?: unknown;
      geometry?: { coordinates?: unknown };
    }[];
  };
  if (o.code !== "Ok" || !Array.isArray(o.routes) || !o.routes[0]) return null;
  const r = o.routes[0];
  const raw = r.geometry?.coordinates;
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const coords: RoadRoute["coords"] = [];
  for (const p of raw) {
    if (!Array.isArray(p) || p.length < 2) return null;
    const lng = Number(p[0]);
    const lat = Number(p[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    coords.push({ latitude: lat, longitude: lng });
  }
  const distanceMeters = Number(r.distance);
  const durationSec = Number(r.duration);
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;
  if (!Number.isFinite(durationSec) || durationSec < 0) return null;
  return { coords, distanceMeters, durationSec };
}

export async function fetchRoadRoute(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<RoadRoute | null> {
  try {
    const url =
      `${OSRM_BASE}/route/v1/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?overview=full&geometries=geojson&alternatives=false&steps=false`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return parseOsrmResponse(await res.json());
  } catch {
    return null;
  }
}
