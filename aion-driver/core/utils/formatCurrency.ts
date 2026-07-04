import type { SupportedCurrency } from "../constants/currencies";

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  options?: Intl.NumberFormatOptions,
): string {
  // Защита от NaN/Infinity: иначе Intl выдаёт «NaN ₽» / «∞ ₽» пользователю.
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    ...options,
  }).format(safe);
}
