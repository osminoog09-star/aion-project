import type { ActiveShift, UserProfile } from "../types";
import {
  computeDualFuelShiftMetrics,
  reconcileFuelSplitKm,
} from "./calculations";
import { getEffectiveShiftDurationMs } from "./shiftActiveDuration";
import { mergeConfirmedFuelCosts } from "./shiftEconomics";
import { computeShiftOperationalCosts } from "./rentalEconomics";
import type { LiveShiftMetrics } from "../features/shift/runtime/liveShiftTypes";

/** Единый расчёт живых метрик активной смены (модель GPS + подтверждённые чеки АЗС). */
export function buildLiveShiftMetrics(
  profile: UserProfile,
  activeShift: ActiveShift,
  nowMs: number,
): LiveShiftMetrics {
  const durationMs = getEffectiveShiftDurationMs(activeShift, nowMs);
  const kmTotal = activeShift.distanceMeters / 1000;
  const { kmPetrol, kmGas } = reconcileFuelSplitKm({
    totalKm: kmTotal,
    kmPetrol: activeShift.distanceMetersPetrol / 1000,
    kmGas: activeShift.distanceMetersGas / 1000,
  });
  const income = activeShift.totalIncome;
  const base = computeDualFuelShiftMetrics(profile, {
    kmPetrol,
    kmGas,
    income,
    durationMs,
  });
  const merged = mergeConfirmedFuelCosts(base, income, durationMs, activeShift.fuelEntries);
  const operationalCosts = computeShiftOperationalCosts(
    merged.netProfit,
    durationMs,
    profile.rentalEconomics,
  );
  return {
    durationMs,
    income,
    ...merged,
    operationalCosts,
  };
}
