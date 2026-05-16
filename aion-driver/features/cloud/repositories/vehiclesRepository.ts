import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "../../../lib/database.types";
import type { Database } from "../../../lib/database.types";
import type { GarageVehicle, VehicleCatalogEntry } from "../../../core/types/vehicle";

function garageToPayload(v: GarageVehicle): Json {
  const { remoteId: _r, ...rest } = v;
  return rest as unknown as Json;
}

export function rowToGarageVehicle(
  row: Database["public"]["Tables"]["vehicles"]["Row"],
): GarageVehicle {
  const payload = row.payload as unknown as Partial<GarageVehicle> &
    Partial<VehicleCatalogEntry>;
  return {
    id: payload.id ?? row.catalog_id ?? row.id,
    generation: payload.generation,
    brand: payload.brand ?? "",
    model: payload.model ?? "",
    year: payload.year ?? new Date().getFullYear(),
    engine: payload.engine ?? "",
    transmission: payload.transmission ?? "automatic",
    fuelPrimary: payload.fuelPrimary ?? "petrol",
    fuelSecondary: payload.fuelSecondary,
    consumptionMixedLPer100Km: payload.consumptionMixedLPer100Km ?? 8,
    consumptionUrbanLPer100Km: payload.consumptionUrbanLPer100Km ?? 9,
    consumptionExtraUrbanLPer100Km: payload.consumptionExtraUrbanLPer100Km ?? 7,
    tankLiters: payload.tankLiters,
    batteryKWh: payload.batteryKWh,
    localId: payload.localId ?? row.id,
    isPrimary: row.is_primary,
    nickname: payload.nickname,
    overrides: payload.overrides,
    remoteId: row.id,
  };
}

export async function listVehicles(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<GarageVehicle[]> {
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToGarageVehicle);
}

export async function insertVehicle(
  client: SupabaseClient<Database>,
  userId: string,
  vehicle: GarageVehicle,
  catalogId: string | null,
): Promise<string> {
  const { data, error } = await client
    .from("vehicles")
    .insert({
      user_id: userId,
      catalog_id: catalogId,
      payload: garageToPayload(vehicle),
      is_primary: vehicle.isPrimary,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteVehicle(
  client: SupabaseClient<Database>,
  userId: string,
  remoteId: string,
): Promise<void> {
  const { error } = await client
    .from("vehicles")
    .delete()
    .eq("id", remoteId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setPrimaryVehicle(
  client: SupabaseClient<Database>,
  userId: string,
  remoteId: string,
): Promise<void> {
  const { data: rows, error: listErr } = await client
    .from("vehicles")
    .select("id")
    .eq("user_id", userId);
  if (listErr) throw listErr;
  const now = new Date().toISOString();
  for (const r of rows ?? []) {
    const { error } = await client
      .from("vehicles")
      .update({
        is_primary: r.id === remoteId,
        updated_at: now,
      })
      .eq("id", r.id)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

export async function updateVehiclePayload(
  client: SupabaseClient<Database>,
  userId: string,
  remoteId: string,
  vehicle: GarageVehicle,
): Promise<void> {
  const { error } = await client
    .from("vehicles")
    .update({
      payload: garageToPayload(vehicle),
      catalog_id: vehicle.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", remoteId)
    .eq("user_id", userId);
  if (error) throw error;
}
