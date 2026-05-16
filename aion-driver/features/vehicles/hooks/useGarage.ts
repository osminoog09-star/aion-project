import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { searchVehicleCatalog } from "../../../data/vehicleCatalog";
import type { VehicleCatalogEntry } from "../../../core/types/vehicle";
import type { GarageVehicle } from "../../../core/types/vehicle";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  deleteVehicle,
  insertVehicle,
  listVehicles,
  setPrimaryVehicle,
} from "../../cloud/repositories/vehiclesRepository";
import { catalogToGarage, useVehicleStore } from "../stores/vehicleStore";
import { qk } from "../../../lib/queryKeys";
import { requireSupabase } from "../../../lib/supabase";

export function useGarage() {
  const [q, setQ] = useState("");
  const { session, isConfigured } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const localVehicles = useVehicleStore((s) => s.vehicles);
  const localAdd = useVehicleStore((s) => s.addFromCatalog);
  const localRemove = useVehicleStore((s) => s.remove);
  const localSetPrimary = useVehicleStore((s) => s.setPrimary);

  const remoteQuery = useQuery({
    queryKey: userId ? qk.vehicles(userId) : ["cloud:vehicles", "off"],
    enabled: Boolean(userId && isConfigured),
    queryFn: async () => {
      const client = requireSupabase();
      return listVehicles(client, userId!);
    },
    staleTime: 30_000,
  });

  const invalidateRemote = useCallback(async () => {
    if (userId) {
      await queryClient.invalidateQueries({ queryKey: qk.vehicles(userId) });
    }
  }, [queryClient, userId]);

  const addRemote = useMutation({
    mutationFn: async (entry: VehicleCatalogEntry) => {
      const client = requireSupabase();
      const current = await listVehicles(client, userId!);
      const isFirst = current.length === 0;
      const v: GarageVehicle = { ...catalogToGarage(entry), isPrimary: isFirst };
      const id = await insertVehicle(client, userId!, v, entry.id);
      if (v.isPrimary) {
        await setPrimaryVehicle(client, userId!, id);
      }
      return id;
    },
    onSuccess: () => void invalidateRemote(),
  });

  const removeRemote = useMutation({
    mutationFn: async (remoteId: string) => {
      const client = requireSupabase();
      await deleteVehicle(client, userId!, remoteId);
    },
    onSuccess: () => void invalidateRemote(),
  });

  const primaryRemote = useMutation({
    mutationFn: async (remoteId: string) => {
      const client = requireSupabase();
      await setPrimaryVehicle(client, userId!, remoteId);
    },
    onSuccess: () => void invalidateRemote(),
  });

  const mode = userId && isConfigured ? "cloud" : "guest";

  const vehicles = mode === "cloud" ? (remoteQuery.data ?? []) : localVehicles;

  const results = useMemo(() => searchVehicleCatalog(q), [q]);

  const addFromCatalog = useCallback(
    (entry: VehicleCatalogEntry) => {
      if (mode === "cloud") {
        addRemote.mutate(entry);
      } else {
        localAdd(entry);
      }
    },
    [mode, addRemote, localAdd],
  );

  const remove = useCallback(
    (v: GarageVehicle) => {
      if (mode === "cloud" && v.remoteId) {
        removeRemote.mutate(v.remoteId);
      } else {
        localRemove(v.localId);
      }
    },
    [mode, removeRemote, localRemove],
  );

  const setPrimary = useCallback(
    (v: GarageVehicle) => {
      if (mode === "cloud" && v.remoteId) {
        primaryRemote.mutate(v.remoteId);
      } else {
        localSetPrimary(v.localId);
      }
    },
    [mode, primaryRemote, localSetPrimary],
  );

  const isBusy =
    addRemote.isPending ||
    removeRemote.isPending ||
    primaryRemote.isPending;

  return {
    mode,
    q,
    setQ,
    results,
    vehicles,
    addFromCatalog,
    remove,
    setPrimary,
    isBusy,
    remoteError: remoteQuery.error,
  };
}
