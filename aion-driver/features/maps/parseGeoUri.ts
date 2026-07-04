/**
 * Разбор навигационных ссылок, которыми приложения (Bolt и др.) передают точку
 * назначения выбранному навигатору: `geo:` и `google.navigation:`.
 * Только реальные координаты из ссылки; адрес без координат не геокодим
 * (это отдельный честный шаг с реальным геокодером).
 *
 * Тест: scripts/ci/test-parse-geo-uri.mjs
 */
export type GeoTarget = { lat: number; lng: number; label: string | null };

const COORD = /(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/;

function valid(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function parseGeoUri(url: string): GeoTarget | null {
  const u = url.trim();
  if (!u) return null;

  // google.navigation:q=58.38,24.49
  if (/^google\.navigation:/i.test(u)) {
    const m = u.match(new RegExp(`[?&]?q=${COORD.source}`, "i"));
    if (!m) return null;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    return valid(lat, lng) ? { lat, lng, label: null } : null;
  }

  if (!/^geo:/i.test(u)) return null;

  // geo:0,0?q=58.38,24.49(Метка) — q-координаты приоритетнее пути.
  const q = u.match(new RegExp(`[?&]q=${COORD.source}(?:\\s*\\(([^)]+)\\))?`, "i"));
  if (q) {
    const lat = Number(q[1]);
    const lng = Number(q[2]);
    if (!valid(lat, lng)) return null;
    let label: string | null = null;
    if (q[3]) {
      try {
        label = decodeURIComponent(q[3]);
      } catch {
        label = q[3];
      }
    }
    return { lat, lng, label };
  }

  // geo:58.38,24.49?z=15
  const p = u.match(new RegExp(`^geo:${COORD.source}`, "i"));
  if (p) {
    const lat = Number(p[1]);
    const lng = Number(p[2]);
    return valid(lat, lng) ? { lat, lng, label: null } : null;
  }

  return null;
}
