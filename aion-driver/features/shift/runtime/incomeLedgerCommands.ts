import type { ActiveShift, IncomeEntry } from "../../../types";

export function appendIncomeBatch(
  shift: ActiveShift,
  amount: number,
  count: number,
  createEntry: () => IncomeEntry,
): { next: ActiveShift; entryIds: string[] } | null {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(count) || count < 1 || count > 50) return null;
  const entries = Array.from({ length: count }, createEntry);
  return {
    next: {
      ...shift,
      totalIncome: shift.totalIncome + amount * count,
      incomeEventsCount: (shift.incomeEventsCount ?? 0) + count,
      incomeLedger: [...(shift.incomeLedger ?? []), ...entries],
    },
    entryIds: entries.map((entry) => entry.id),
  };
}

export function removeIncomeEntries(shift: ActiveShift, entryIds: readonly string[]): ActiveShift | null {
  const ids = new Set(entryIds);
  const ledger = shift.incomeLedger ?? [];
  const removed = ledger.filter((entry) => ids.has(entry.id));
  if (!removed.length) return null;
  const removedTotal = removed.reduce((sum, entry) => sum + entry.amount, 0);
  return {
    ...shift,
    totalIncome: Math.max(0, shift.totalIncome - removedTotal),
    incomeEventsCount: Math.max(0, (shift.incomeEventsCount ?? ledger.length) - removed.length),
    incomeLedger: ledger.filter((entry) => !ids.has(entry.id)),
  };
}
