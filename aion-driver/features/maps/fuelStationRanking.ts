import type { AppCurrencyCode } from "../../types/device";
import { getFuelPriceBandForCountry } from "../../services/fuelIntel";
import type { FuelStationMarker } from "./overpassFuel";

export type EnrichedFuelStation = FuelStationMarker & {
  priceEstimate: number;
  currency: AppCurrencyCode;
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Оценочные цены (OSM редко даёт теги цен) — для UX «дешевле рядом» без платных API. */
export function enrichFuelStationsWithRegionalPrices(
  markers: FuelStationMarker[],
  countryCode: string,
  currency: AppCurrencyCode,
): EnrichedFuelStation[] {
  const band = getFuelPriceBandForCountry(countryCode, currency);
  return markers.map((m, idx) => {
    const jitter = ((hashId(m.id) % 19) - 9) * 0.006 * band.petrol;
    const priceEstimate = Math.max(band.petrol * 0.75, band.petrol + jitter + idx * 0.008);
    return { ...m, priceEstimate, currency };
  });
}

export function pickCheapestStationId(stations: EnrichedFuelStation[]): string | null {
  if (stations.length === 0) return null;
  let best = stations[0]!;
  for (const s of stations) {
    if (s.priceEstimate < best.priceEstimate) best = s;
  }
  return best.id;
}
