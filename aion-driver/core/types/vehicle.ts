import type { FuelCategory, TransmissionKind } from "./fuel";

/** Каталог / пресет ТС (Smart Car). */
export interface VehicleCatalogEntry {
  id: string;
  brand: string;
  model: string;
  /** Поколение / рестайлинг для UI (Mk7, Mk8…). */
  generation?: string;
  year: number;
  engine: string;
  transmission: TransmissionKind;
  fuelPrimary: FuelCategory;
  /** Доп. топливо (гибрид PHEV, битопливо). */
  fuelSecondary?: FuelCategory;
  consumptionMixedLPer100Km: number;
  consumptionUrbanLPer100Km: number;
  consumptionExtraUrbanLPer100Km: number;
  tankLiters?: number;
  batteryKWh?: number;
}

/** Авто в гараже пользователя (локально + синк в облако). */
export interface GarageVehicle extends VehicleCatalogEntry {
  /** UUID строки в Supabase после синка. */
  remoteId?: string;
  localId: string;
  isPrimary: boolean;
  nickname?: string;
  /** Пользовательские правки расхода поверх каталога. */
  overrides?: Partial<
    Pick<
      VehicleCatalogEntry,
      | "consumptionMixedLPer100Km"
      | "consumptionUrbanLPer100Km"
      | "consumptionExtraUrbanLPer100Km"
      | "tankLiters"
      | "batteryKWh"
    >
  >;
}
