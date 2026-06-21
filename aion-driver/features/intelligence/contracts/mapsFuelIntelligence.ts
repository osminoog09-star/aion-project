export type RealDataProvenance = {
  shiftId: string;
  gpsPointCount: number;
  fuelEntryIds: string[];
  generatedAtMs: number;
};

export type KilometerClass = "on_order" | "pickup" | "empty" | "personal";

export type KilometerClassification = {
  status: "unclassified" | "classified";
  class: KilometerClass | null;
  distanceMeters: number | null;
  evidence: "driver_event" | "platform_import" | null;
};

export type MapsIntelligenceSnapshot = {
  schemaVersion: 1;
  provenance: RealDataProvenance;
  routeDistanceMeters: number | null;
  kilometerClasses: KilometerClassification[];
  publishable: boolean;
};

export type FuelCostAllocation = {
  status: "unallocated" | "allocated";
  kilometerClass: KilometerClass | null;
  fuelEntryIds: string[];
  distanceMeters: number | null;
  allocatedCost: number | null;
};

export type FuelIntelligenceSnapshot = {
  schemaVersion: 1;
  provenance: RealDataProvenance;
  confirmedFuelCost: number | null;
  allocations: FuelCostAllocation[];
  costPer100Km: number | null;
  publishable: boolean;
};
