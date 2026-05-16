import type { SupportedCurrency } from "../constants/currencies";

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}
