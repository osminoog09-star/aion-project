import type { Shift } from "../../types";
import type { StatPeriod } from "./types";

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function filterShiftsByPeriod(shifts: Shift[], period: StatPeriod): Shift[] {
  const now = Date.now();
  const t0 = startOfTodayMs();
  const w0 = now - 7 * 86_400_000;
  const m0 = now - 30 * 86_400_000;

  return shifts.filter((s) => {
    const end = Date.parse(s.endedAt);
    if (!Number.isFinite(end)) return false;
    if (period === "today") return end >= t0;
    if (period === "7d") return end >= w0;
    return end >= m0;
  });
}

export function formatShiftRowLabel(s: Shift): string {
  const d = new Date(s.endedAt);
  const date = Number.isNaN(d.getTime())
    ? s.endedAt.slice(0, 10)
    : d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
  return `${date} · ${Math.round(s.netProfit)} · ${s.distanceKm.toFixed(1)} км`;
}
