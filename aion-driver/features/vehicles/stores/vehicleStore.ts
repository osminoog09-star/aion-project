import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GarageVehicle, VehicleCatalogEntry } from "../../../core/types/vehicle";

const STORAGE_KEY = "aion-platform-garage-v1";

type VehicleState = {
  vehicles: GarageVehicle[];
  addFromCatalog: (entry: VehicleCatalogEntry) => void;
  remove: (localId: string) => void;
  setPrimary: (localId: string) => void;
};

export function catalogToGarage(entry: VehicleCatalogEntry): GarageVehicle {
  return {
    ...entry,
    localId: `${entry.id}_${Date.now().toString(36)}`,
    isPrimary: false,
  };
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      addFromCatalog: (entry) => {
        const v = catalogToGarage(entry);
        const list = get().vehicles;
        const next = list.length === 0 ? [{ ...v, isPrimary: true }] : [...list, v];
        set({ vehicles: next });
      },
      remove: (localId) => {
        const filtered = get().vehicles.filter((x) => x.localId !== localId);
        const hasPrimary = filtered.some((x) => x.isPrimary);
        const vehicles = hasPrimary
          ? filtered
          : filtered.map((x, i) => ({ ...x, isPrimary: i === 0 }));
        set({ vehicles });
      },
      setPrimary: (localId) => {
        set({
          vehicles: get().vehicles.map((x) => ({
            ...x,
            isPrimary: x.localId === localId,
          })),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
