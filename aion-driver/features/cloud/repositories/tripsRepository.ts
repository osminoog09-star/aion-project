import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "../../../lib/database.types";
import type { Database } from "../../../lib/database.types";
import type { Shift } from "../../../types";
import { getCompletedShiftEconomicsProjection } from "../../../utils/shiftDisplayEconomics";

export function shiftToTripInsert(
  userId: string,
  shift: Shift,
  vehicleRemoteId: string | null,
): Database["public"]["Tables"]["trips"]["Insert"] {
  const economics = getCompletedShiftEconomicsProjection(shift);
  return {
    user_id: userId,
    vehicle_id: vehicleRemoteId,
    client_ref: shift.id,
    payload: shift as unknown as Json,
    started_at: shift.startedAt,
    ended_at: shift.endedAt,
    earnings: shift.income,
    expenses_total: economics.totalExpenses,
    distance_km: shift.distanceKm,
    duration_seconds: Math.max(0, Math.round(shift.durationMs / 1000)),
    fuel_liters_equivalent:
      shift.fuelUsedPetrolLiters + shift.fuelUsedGasLiters,
    profit_per_hour: economics.profitPerHour,
    profit_per_km: economics.profitPerKm,
  };
}

export async function upsertTripFromShift(
  client: SupabaseClient<Database>,
  userId: string,
  shift: Shift,
  vehicleRemoteId: string | null,
): Promise<void> {
  const row = shiftToTripInsert(userId, shift, vehicleRemoteId);
  const { data: existing, error: findErr } = await client
    .from("trips")
    .select("id")
    .eq("user_id", userId)
    .eq("client_ref", shift.id)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing?.id) {
    const { error } = await client
      .from("trips")
      .update({
        vehicle_id: row.vehicle_id,
        payload: row.payload,
        started_at: row.started_at,
        ended_at: row.ended_at,
        earnings: row.earnings,
        expenses_total: row.expenses_total,
        distance_km: row.distance_km,
        duration_seconds: row.duration_seconds,
        fuel_liters_equivalent: row.fuel_liters_equivalent,
        profit_per_hour: row.profit_per_hour,
        profit_per_km: row.profit_per_km,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await client.from("trips").insert(row);
  if (error) throw error;
}

export async function listTrips(
  client: SupabaseClient<Database>,
  userId: string,
  limit = 200,
): Promise<Database["public"]["Tables"]["trips"]["Row"][]> {
  const { data, error } = await client
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function rowPayloadToShift(
  row: Database["public"]["Tables"]["trips"]["Row"],
): Shift | null {
  const p = row.payload as unknown as Partial<Shift> | null;
  if (p && typeof p.id === "string" && typeof p.endedAt === "string") {
    return p as Shift;
  }
  if (!row.ended_at || row.earnings == null || row.distance_km == null) {
    return null;
  }
  const durationMs = (row.duration_seconds ?? 0) * 1000;
  const profitAfterCosts = (row.earnings ?? 0) - (row.expenses_total ?? 0);
  const profitPerHourAfterCosts = row.profit_per_hour ?? 0;
  return {
    id: row.client_ref ?? row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMs,
    distanceKm: row.distance_km,
    distanceKmPetrol: row.distance_km,
    distanceKmGas: 0,
    income: row.earnings,
    fuelUsedPetrolLiters: row.fuel_liters_equivalent ?? 0,
    fuelUsedGasLiters: 0,
    fuelCostPetrol: row.expenses_total ?? 0,
    fuelCostGas: 0,
    fuelCostTotal: row.expenses_total ?? 0,
    gasSavingsRub: 0,
    netProfit: profitAfterCosts,
    profitPerHour: profitPerHourAfterCosts,
    profitPerKm: row.profit_per_km ?? 0,
    netProfitAfterCosts: profitAfterCosts,
    profitPerHourAfterCosts,
  };
}
