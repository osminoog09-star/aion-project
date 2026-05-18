import { formatCurrency as intlCurrency } from "../core/utils/formatCurrency";
import type { AppCurrencyCode } from "../types/device";
import type { DistanceUnits } from "../types/device";

export function formatCurrencyDisplay(
  value: number,
  currency: AppCurrencyCode = "EUR",
): string {
  return intlCurrency(value, currency);
}

export function formatCurrency(value: number, currencySymbol = "₽"): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const sign = value < 0 ? "−" : "";
  return `${sign}${formatted} ${currencySymbol}`;
}

export function formatCompactCurrency(value: number): string {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatKm(km: number, units: DistanceUnits = "km"): string {
  if (units === "mi") {
    const mi = km * 0.621371192;
    return `${mi.toLocaleString(undefined, { maximumFractionDigits: 2 })} mi`;
  }
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 2 })} км`;
}

export function formatLiters(l: number): string {
  return `${l.toLocaleString(undefined, { maximumFractionDigits: 2 })} л`;
}

export function formatPerHour(value: number, currency: AppCurrencyCode = "EUR"): string {
  return `${intlCurrency(value, currency)}/ч`;
}

export function formatPerKm(value: number, currency: AppCurrencyCode = "EUR"): string {
  return `${intlCurrency(value, currency)}/км`;
}

/** Подпись поля ввода суммы в выбранной валюте (EUR, ₽, …). */
export function currencyAmountFieldLabel(currency: AppCurrencyCode): string {
  return `Сумма (${currency})`;
}

/** Расход топлива на 100 км / 100 mi в валюте пользователя. */
export function formatFuelCostPer100Km(
  value: number,
  currency: AppCurrencyCode,
  units: DistanceUnits = "km",
): string {
  const per100 = units === "mi" ? "100 mi" : "100 км";
  return `${intlCurrency(value, currency)}/${per100}`;
}
