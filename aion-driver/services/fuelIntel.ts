import type { AppCurrencyCode } from "../features/geo/generatedAlpha2ToCurrency";

export type FuelKindKey =
  | "petrol"
  | "diesel"
  | "lpg"
  | "cng"
  | "hybrid"
  | "ev";

export interface FuelPriceBand {
  petrol: number;
  diesel: number;
  lpg: number;
  cng: number;
  currency: AppCurrencyCode;
  country: string;
  updatedAt: string;
}

type BandNums = { petrol: number; diesel: number; lpg: number; cng: number };

/** Типичные цены (оценка) по валюте — если нет точной строки по стране. */
const BAND_BY_CURRENCY: Partial<Record<AppCurrencyCode, BandNums>> = {
  EUR: { petrol: 1.75, diesel: 1.65, lpg: 0.95, cng: 1.1 },
  USD: { petrol: 3.2, diesel: 3.8, lpg: 2.1, cng: 2.4 },
  GBP: { petrol: 1.48, diesel: 1.52, lpg: 0.82, cng: 0.95 },
  RUB: { petrol: 62, diesel: 68, lpg: 35, cng: 28 },
  PLN: { petrol: 6.8, diesel: 7.1, lpg: 3.2, cng: 3.5 },
  SEK: { petrol: 17.5, diesel: 18.2, lpg: 11, cng: 12 },
  NOK: { petrol: 19.2, diesel: 19.8, lpg: 12, cng: 13 },
  UAH: { petrol: 55, diesel: 60, lpg: 28, cng: 30 },
  TRY: { petrol: 42, diesel: 45, lpg: 18, cng: 20 },
  CZK: { petrol: 38.5, diesel: 39.2, lpg: 20, cng: 22 },
  HUF: { petrol: 640, diesel: 670, lpg: 320, cng: 340 },
  RON: { petrol: 7.2, diesel: 7.5, lpg: 3.4, cng: 3.6 },
  CHF: { petrol: 1.85, diesel: 1.92, lpg: 1.05, cng: 1.15 },
  DKK: { petrol: 13.2, diesel: 13.8, lpg: 7.5, cng: 8.1 },
  ISK: { petrol: 268, diesel: 278, lpg: 145, cng: 155 },
  CAD: { petrol: 1.55, diesel: 1.62, lpg: 0.88, cng: 0.95 },
  AUD: { petrol: 1.82, diesel: 1.88, lpg: 1.05, cng: 1.12 },
  NZD: { petrol: 2.15, diesel: 2.22, lpg: 1.2, cng: 1.28 },
  MXN: { petrol: 22.5, diesel: 23.8, lpg: 12, cng: 13 },
  BRL: { petrol: 5.65, diesel: 5.85, lpg: 3.1, cng: 3.4 },
  JPY: { petrol: 168, diesel: 175, lpg: 95, cng: 102 },
  CNY: { petrol: 8.2, diesel: 8.5, lpg: 4.5, cng: 4.9 },
  INR: { petrol: 102, diesel: 108, lpg: 55, cng: 60 },
  KRW: { petrol: 1680, diesel: 1720, lpg: 920, cng: 980 },
  SGD: { petrol: 2.55, diesel: 2.62, lpg: 1.35, cng: 1.45 },
  HKD: { petrol: 16.2, diesel: 16.8, lpg: 8.8, cng: 9.4 },
  THB: { petrol: 37.5, diesel: 39.2, lpg: 20, cng: 21 },
  AED: { petrol: 3.05, diesel: 3.15, lpg: 1.65, cng: 1.75 },
  SAR: { petrol: 2.35, diesel: 2.42, lpg: 1.25, cng: 1.32 },
  ZAR: { petrol: 22.8, diesel: 23.5, lpg: 12.5, cng: 13.2 },
  ILS: { petrol: 7.15, diesel: 7.35, lpg: 3.8, cng: 4.1 },
  EGP: { petrol: 12.5, diesel: 13.1, lpg: 6.8, cng: 7.2 },
  KZT: { petrol: 295, diesel: 305, lpg: 155, cng: 165 },
  BYN: { petrol: 2.25, diesel: 2.35, lpg: 1.2, cng: 1.28 },
};

const COUNTRY_OVERRIDES: Record<string, BandNums> = {
  RU: { petrol: 62, diesel: 68, lpg: 35, cng: 28 },
  DE: { petrol: 1.75, diesel: 1.65, lpg: 0.95, cng: 1.1 },
  US: { petrol: 3.2, diesel: 3.8, lpg: 2.1, cng: 2.4 },
  PL: { petrol: 6.8, diesel: 7.1, lpg: 3.2, cng: 3.5 },
  SE: { petrol: 17.5, diesel: 18.2, lpg: 11, cng: 12 },
  NO: { petrol: 19.2, diesel: 19.8, lpg: 12, cng: 13 },
  GB: { petrol: 1.48, diesel: 1.52, lpg: 0.82, cng: 0.95 },
};

const EUR_FALLBACK: BandNums = { petrol: 1.75, diesel: 1.65, lpg: 0.95, cng: 1.1 };

/** Оценочные цены по стране / валюте (до live API). */
export function getFuelPriceBandForCountry(
  country: string,
  currency: AppCurrencyCode,
): FuelPriceBand {
  const ov = COUNTRY_OVERRIDES[country.toUpperCase()];
  const cur = BAND_BY_CURRENCY[currency] ?? EUR_FALLBACK;
  const base = ov ?? cur;
  return {
    petrol: base.petrol,
    diesel: base.diesel,
    lpg: base.lpg,
    cng: base.cng,
    currency,
    country: country.toUpperCase(),
    updatedAt: new Date().toISOString(),
  };
}

/** Заготовка под гео-АЗС: избранное, дешёвые рядом, алерты. */
export type FuelStationStub = {
  id: string;
  name: string;
  brand: string;
  lat: number;
  lng: number;
  pricePetrol?: number;
  isFavorite?: boolean;
};

export function listNearbyStationsStub(
  _country: string,
): FuelStationStub[] {
  return [
    {
      id: "stub-1",
      name: "Circle K · центр",
      brand: "Circle K",
      lat: 55.75,
      lng: 37.62,
      pricePetrol: 62.4,
    },
    {
      id: "stub-2",
      name: "Neste · въезд",
      brand: "Neste",
      lat: 55.752,
      lng: 37.615,
      pricePetrol: 61.9,
    },
  ];
}
