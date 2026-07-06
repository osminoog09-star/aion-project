/**
 * Маршрут по реальным дорогам через OSRM (roadmap aion-maps-navigation, этап 2-3).
 *
 * Быстрый старт — публичный demo-сервер OSRM (router.project-osrm.org):
 * без ключей, но с лимитами и без SLA — только для превью-этапа; прод-путь =
 * self-host OSRM + OSM-экстракт Эстонии (см. docs/ADR-road-matching.md, тот же
 * сервер закроет и road matching). Если сервер недоступен — возвращаем null,
 * UI честно показывает прямую линию, ничего не выдумываем.
 *
 * Чистый разбор ответа — parseOsrmResponse (+ formatManeuver для пошаговых
 * подсказок, основа голосовой навигации). Тест: scripts/ci/test-osrm-route.mjs
 */
export type RouteStep = { instruction: string; distanceMeters: number };

export type RoadRoute = {
  coords: { latitude: number; longitude: number }[];
  distanceMeters: number;
  durationSec: number;
  /** Пошаговые манёвры по-русски (для списка поворотов / голоса). */
  steps: RouteStep[];
};

const OSRM_BASE = "https://router.project-osrm.org";

const MODIFIER_RU: Record<string, string> = {
  left: "налево",
  right: "направо",
  "slight left": "плавно налево",
  "slight right": "плавно направо",
  "sharp left": "резко налево",
  "sharp right": "резко направо",
  straight: "прямо",
  uturn: "развернитесь",
};

/** Манёвр OSRM → человеческая подсказка по-русски. */
export function formatManeuver(type: string, modifier: string | null, name: string): string {
  const n = (name ?? "").trim();
  const onName = n ? ` на ${n}` : "";
  const dir = modifier ? MODIFIER_RU[modifier] ?? modifier : "прямо";
  switch (type) {
    case "depart":
      return n ? `Начинаем по ${n}` : "Начинаем маршрут";
    case "arrive":
      return "Прибытие в точку";
    case "roundabout":
    case "rotary":
      return "Двигайтесь по кругу";
    case "merge":
      return `Перестройтесь${onName}`;
    case "continue":
    case "new name":
      return `Продолжайте ${dir}${onName}`;
    case "on ramp":
      return `Съезд${onName}`;
    case "off ramp":
      return `Уходите${modifier ? ` ${dir}` : ""}${onName}`;
    default:
      return `Поверните ${dir}${onName}`;
  }
}

/** Разбор ответа OSRM /route/v1 (geometries=geojson, steps=true). Мусор → null. */
export function parseOsrmResponse(json: unknown): RoadRoute | null {
  if (!json || typeof json !== "object") return null;
  const o = json as {
    code?: unknown;
    routes?: {
      distance?: unknown;
      duration?: unknown;
      geometry?: { coordinates?: unknown };
      legs?: unknown;
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

  const steps: RouteStep[] = [];
  if (Array.isArray(r.legs)) {
    for (const leg of r.legs) {
      const ls = (leg as { steps?: unknown }).steps;
      if (!Array.isArray(ls)) continue;
      for (const s of ls) {
        const st = s as {
          maneuver?: { type?: unknown; modifier?: unknown };
          name?: unknown;
          distance?: unknown;
        };
        const type = typeof st.maneuver?.type === "string" ? st.maneuver.type : "";
        if (!type) continue;
        const modifier = typeof st.maneuver?.modifier === "string" ? st.maneuver.modifier : null;
        const name = typeof st.name === "string" ? st.name : "";
        const dist = Number(st.distance);
        steps.push({
          instruction: formatManeuver(type, modifier, name),
          distanceMeters: Number.isFinite(dist) && dist >= 0 ? dist : 0,
        });
      }
    }
  }

  return { coords, distanceMeters, durationSec, steps };
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
      `?overview=full&geometries=geojson&alternatives=false&steps=true`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return parseOsrmResponse(await res.json());
  } catch {
    return null;
  }
}
