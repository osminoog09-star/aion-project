import type { VehicleCatalogEntry } from "../core/types/vehicle";
import garageExpanded from "./vehicles/garage-expanded.json";

/** Курируемые пресеты + сгенерированный каталог (см. scripts/build-garage-catalog.mjs). */
const MANUAL_VEHICLE_CATALOG: VehicleCatalogEntry[] = [
  {
    id: "vw-golf7-mk7-16tdi-2018",
    brand: "Volkswagen",
    model: "Golf",
    generation: "Mk7",
    year: 2018,
    engine: "1.6 TDI",
    transmission: "manual",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 4.9,
    consumptionUrbanLPer100Km: 5.8,
    consumptionExtraUrbanLPer100Km: 4.2,
    tankLiters: 50,
  },
  {
    id: "vw-golf7-mk7-14tsi-2017",
    brand: "Volkswagen",
    model: "Golf",
    generation: "Mk7",
    year: 2017,
    engine: "1.4 TSI",
    transmission: "dct",
    fuelPrimary: "petrol",
    consumptionMixedLPer100Km: 5.4,
    consumptionUrbanLPer100Km: 6.6,
    consumptionExtraUrbanLPer100Km: 4.6,
    tankLiters: 50,
  },
  {
    id: "vw-golf-gti-mk8-2022",
    brand: "Volkswagen",
    model: "Golf GTI",
    generation: "Mk8",
    year: 2022,
    engine: "2.0 TSI",
    transmission: "dct",
    fuelPrimary: "petrol",
    consumptionMixedLPer100Km: 7.4,
    consumptionUrbanLPer100Km: 9.1,
    consumptionExtraUrbanLPer100Km: 6.2,
    tankLiters: 50,
  },
  {
    id: "vw-golf8-15tsi-2021",
    brand: "Volkswagen",
    model: "Golf",
    generation: "Mk8",
    year: 2021,
    engine: "1.5 TSI eTSI",
    transmission: "dct",
    fuelPrimary: "petrol",
    fuelSecondary: "ev",
    consumptionMixedLPer100Km: 5.2,
    consumptionUrbanLPer100Km: 6.3,
    consumptionExtraUrbanLPer100Km: 4.5,
    tankLiters: 45,
    batteryKWh: 0.8,
  },
  {
    id: "vw-golf8-20tdi-2020",
    brand: "Volkswagen",
    model: "Golf",
    generation: "Mk8",
    year: 2020,
    engine: "2.0 TDI",
    transmission: "manual",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 4.7,
    consumptionUrbanLPer100Km: 5.5,
    consumptionExtraUrbanLPer100Km: 4.0,
    tankLiters: 45,
  },
  {
    id: "skoda-octavia-20tdi-2019",
    brand: "Škoda",
    model: "Octavia",
    generation: "III FL",
    year: 2019,
    engine: "2.0 TDI",
    transmission: "dct",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 4.6,
    consumptionUrbanLPer100Km: 5.4,
    consumptionExtraUrbanLPer100Km: 4.0,
    tankLiters: 50,
  },
  {
    id: "skoda-superb-20tdi-2020",
    brand: "Škoda",
    model: "Superb",
    generation: "III",
    year: 2020,
    engine: "2.0 TDI",
    transmission: "dct",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 5.1,
    consumptionUrbanLPer100Km: 6.0,
    consumptionExtraUrbanLPer100Km: 4.4,
    tankLiters: 66,
  },
  {
    id: "bmw-f30-320d-2018",
    brand: "BMW",
    model: "3 Series",
    generation: "F30",
    year: 2018,
    engine: "320d",
    transmission: "automatic",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 5.0,
    consumptionUrbanLPer100Km: 6.2,
    consumptionExtraUrbanLPer100Km: 4.3,
    tankLiters: 60,
  },
  {
    id: "mercedes-w213-e220d-2019",
    brand: "Mercedes-Benz",
    model: "E-Class",
    generation: "W213",
    year: 2019,
    engine: "E 220 d",
    transmission: "automatic",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 5.3,
    consumptionUrbanLPer100Km: 6.4,
    consumptionExtraUrbanLPer100Km: 4.5,
    tankLiters: 66,
  },
  {
    id: "toyota-prius-2019",
    brand: "Toyota",
    model: "Prius",
    generation: "XW50",
    year: 2019,
    engine: "1.8 Hybrid",
    transmission: "cvt",
    fuelPrimary: "petrol",
    fuelSecondary: "ev",
    consumptionMixedLPer100Km: 3.8,
    consumptionUrbanLPer100Km: 4.1,
    consumptionExtraUrbanLPer100Km: 3.5,
    tankLiters: 40,
    batteryKWh: 1.6,
  },
  {
    id: "toyota-camry-25hybrid-2021",
    brand: "Toyota",
    model: "Camry",
    generation: "XV70",
    year: 2021,
    engine: "2.5 Hybrid",
    transmission: "cvt",
    fuelPrimary: "petrol",
    fuelSecondary: "ev",
    consumptionMixedLPer100Km: 4.9,
    consumptionUrbanLPer100Km: 5.4,
    consumptionExtraUrbanLPer100Km: 4.4,
    tankLiters: 50,
    batteryKWh: 1.6,
  },
  {
    id: "hyundai-tucson-16crdi-2020",
    brand: "Hyundai",
    model: "Tucson",
    generation: "III FL",
    year: 2020,
    engine: "1.6 CRDi",
    transmission: "dct",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 5.6,
    consumptionUrbanLPer100Km: 6.5,
    consumptionExtraUrbanLPer100Km: 4.9,
    tankLiters: 62,
  },
  {
    id: "kia-ceed-16crdi-2019",
    brand: "Kia",
    model: "Ceed",
    generation: "CD",
    year: 2019,
    engine: "1.6 CRDi",
    transmission: "manual",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 4.8,
    consumptionUrbanLPer100Km: 5.6,
    consumptionExtraUrbanLPer100Km: 4.2,
    tankLiters: 50,
  },
  {
    id: "ford-focus-ecoboost-2018",
    brand: "Ford",
    model: "Focus",
    generation: "Mk4",
    year: 2018,
    engine: "1.5 EcoBoost",
    transmission: "manual",
    fuelPrimary: "petrol",
    consumptionMixedLPer100Km: 6.2,
    consumptionUrbanLPer100Km: 7.4,
    consumptionExtraUrbanLPer100Km: 5.3,
    tankLiters: 52,
  },
  {
    id: "opel-astra-16cdti-2017",
    brand: "Opel",
    model: "Astra",
    generation: "K",
    year: 2017,
    engine: "1.6 CDTi",
    transmission: "manual",
    fuelPrimary: "diesel",
    consumptionMixedLPer100Km: 4.5,
    consumptionUrbanLPer100Km: 5.3,
    consumptionExtraUrbanLPer100Km: 3.9,
    tankLiters: 48,
  },
  {
    id: "nissan-leaf-40kwh-2020",
    brand: "Nissan",
    model: "Leaf",
    generation: "ZE1",
    year: 2020,
    engine: "40 kWh",
    transmission: "automatic",
    fuelPrimary: "ev",
    consumptionMixedLPer100Km: 0,
    consumptionUrbanLPer100Km: 0,
    consumptionExtraUrbanLPer100Km: 0,
    batteryKWh: 40,
  },
  {
    id: "tesla-model3-lr-2022",
    brand: "Tesla",
    model: "Model 3",
    generation: "Highland",
    year: 2022,
    engine: "Long Range AWD",
    transmission: "automatic",
    fuelPrimary: "ev",
    consumptionMixedLPer100Km: 0,
    consumptionUrbanLPer100Km: 0,
    consumptionExtraUrbanLPer100Km: 0,
    batteryKWh: 75,
  },
  {
    id: "lada-vesta-16-2019",
    brand: "Lada",
    model: "Vesta",
    generation: "I",
    year: 2019,
    engine: "1.6",
    transmission: "manual",
    fuelPrimary: "petrol",
    consumptionMixedLPer100Km: 7.8,
    consumptionUrbanLPer100Km: 9.2,
    consumptionExtraUrbanLPer100Km: 6.5,
    tankLiters: 55,
  },
  {
    id: "lada-granta-16-2021",
    brand: "Lada",
    model: "Granta",
    generation: "FL",
    year: 2021,
    engine: "1.6 8V",
    transmission: "manual",
    fuelPrimary: "petrol",
    consumptionMixedLPer100Km: 7.4,
    consumptionUrbanLPer100Km: 8.8,
    consumptionExtraUrbanLPer100Km: 6.2,
    tankLiters: 50,
  },
  {
    id: "toyota-rav4-25hybrid-2022",
    brand: "Toyota",
    model: "RAV4",
    generation: "XA50",
    year: 2022,
    engine: "2.5 Hybrid AWD",
    transmission: "cvt",
    fuelPrimary: "petrol",
    fuelSecondary: "ev",
    consumptionMixedLPer100Km: 5.6,
    consumptionUrbanLPer100Km: 6.2,
    consumptionExtraUrbanLPer100Km: 5.0,
    tankLiters: 55,
    batteryKWh: 1.6,
  },
];

export const VEHICLE_CATALOG: VehicleCatalogEntry[] = [
  ...MANUAL_VEHICLE_CATALOG,
  ...(garageExpanded as VehicleCatalogEntry[]),
];

const catalogById = new Map<string, VehicleCatalogEntry>();
for (const v of VEHICLE_CATALOG) {
  catalogById.set(v.id, v);
}

export function getVehicleCatalogEntryById(id: string): VehicleCatalogEntry | undefined {
  return catalogById.get(id);
}

export function listVehicleCatalogByIds(ids: string[]): VehicleCatalogEntry[] {
  const out: VehicleCatalogEntry[] = [];
  for (const id of ids) {
    const v = catalogById.get(id);
    if (v) out.push(v);
  }
  return out;
}

function scoreVehicle(v: VehicleCatalogEntry, q: string): number {
  const hay = `${v.brand} ${v.model} ${v.generation ?? ""} ${v.year} ${v.engine}`.toLowerCase();
  if (!hay.includes(q)) return 0;
  let s = 10;
  if (v.brand.toLowerCase().startsWith(q)) s += 8;
  if (v.model.toLowerCase().startsWith(q)) s += 6;
  if (`${v.brand} ${v.model}`.toLowerCase().includes(q)) s += 4;
  if (hay.startsWith(q)) s += 5;
  return s;
}

export function searchVehicleCatalog(
  query: string,
  limit = 40,
): VehicleCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return VEHICLE_CATALOG.slice(0, limit);
  }
  return VEHICLE_CATALOG.map((v) => ({ v, s: scoreVehicle(v, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.v);
}
