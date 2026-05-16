export type FuelStationMarker = {
  id: string;
  lat: number;
  lng: number;
  name: string;
};

/**
 * Overpass API (OpenStreetMap) — бесплатно, с уважением к лимитам: только по запросу пользователя / смене региона.
 * @see https://wiki.openstreetmap.org/wiki/Overpass_API
 */
export async function fetchNearbyFuelStations(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<FuelStationMarker[]> {
  const q = `[out:json][timeout:22];
(
  node["amenity"="fuel"](around:4500,${lat},${lng});
  way["amenity"="fuel"](around:4500,${lat},${lng});
);
out center tags;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(q)}`,
    signal,
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = (await res.json()) as {
    elements?: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };
  const elements = json.elements ?? [];
  const out: FuelStationMarker[] = [];
  for (const el of elements) {
    const plat = el.lat ?? el.center?.lat;
    const plng = el.lon ?? el.center?.lon;
    if (plat == null || plng == null) continue;
    const name = el.tags?.name ?? el.tags?.brand ?? "Заправка";
    out.push({
      id: `${el.type}_${el.id}`,
      lat: plat,
      lng: plng,
      name: String(name).slice(0, 48),
    });
  }
  return out.slice(0, 40);
}
