import { useMemo } from "react";
import type { Shift } from "../../../types";
import { getCompletedShiftProfit } from "../../../utils/shiftDisplayEconomics";

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 7 дней прибыли по дням: слева старше, справа сегодня. */
export function usePeriodShiftStats(shifts: Shift[]) {
  return useMemo(() => {
    const now = Date.now();
    const t0 = startOfTodayMs();
    const w0 = now - 7 * 86_400_000;
    let todayProfit = 0;
    let weekProfit = 0;
    let weekFuel = 0;
    let weekTrips = 0;
    const weekSpark = [0, 0, 0, 0, 0, 0, 0];
    const weekFuelSpark = [0, 0, 0, 0, 0, 0, 0];
    const m30 = now - 30 * 86_400_000;
    let monthProfit = 0;
    let monthFuel = 0;
    let monthTrips = 0;
    const monthWeekSpark = [0, 0, 0, 0];

    for (let w = 0; w < 4; w += 1) {
      const wEnd = now - w * 7 * 86_400_000;
      const wStart = wEnd - 7 * 86_400_000;
      for (const s of shifts) {
        const end = new Date(s.endedAt).getTime();
        if (Number.isNaN(end)) continue;
        if (end >= wStart && end < wEnd) {
          monthWeekSpark[3 - w] += getCompletedShiftProfit(s);
        }
      }
    }

    for (let i = 0; i < 7; i += 1) {
      const dayStart = t0 - (6 - i) * 86_400_000;
      const dayEnd = dayStart + 86_400_000;
      for (const s of shifts) {
        const end = new Date(s.endedAt).getTime();
        if (Number.isNaN(end)) continue;
        if (end >= dayStart && end < dayEnd) {
          weekSpark[i] += getCompletedShiftProfit(s);
          weekFuelSpark[i] += s.fuelCostTotal;
        }
      }
    }

    for (const s of shifts) {
      const end = new Date(s.endedAt).getTime();
      if (Number.isNaN(end)) continue;
      const displayProfit = getCompletedShiftProfit(s);
      if (end >= t0) todayProfit += displayProfit;
      if (end >= w0) {
        weekProfit += displayProfit;
        weekFuel += s.fuelCostTotal;
        weekTrips += 1;
      }
      if (end >= m30) {
        monthProfit += displayProfit;
        monthFuel += s.fuelCostTotal;
        monthTrips += 1;
      }
    }
    return {
      todayProfit,
      weekProfit,
      weekFuel,
      weekTrips,
      weekSpark,
      weekFuelSpark,
      monthProfit,
      monthFuel,
      monthTrips,
      monthWeekSpark,
    };
  }, [shifts]);
}
