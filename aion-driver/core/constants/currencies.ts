import type { AppCurrencyCode } from "../../features/geo/generatedAlpha2ToCurrency";
import { KNOWN_ISO4217_CURRENCIES } from "../../features/geo/generatedAlpha2ToCurrency";

/** Полный список валют из датасета стран (ISO 4217). */
export const APP_CURRENCIES: readonly AppCurrencyCode[] = [...KNOWN_ISO4217_CURRENCIES];

export function getCurrencySymbol(currency: AppCurrencyCode): string {
  try {
    const s = (1).toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const sym = s.replace(/[0-9.,\s\u00a0]/g, "").trim();
    return sym || currency;
  } catch {
    return currency;
  }
}

export const DEFAULT_CURRENCY: AppCurrencyCode = "EUR";

export const SUPPORTED_CURRENCIES = APP_CURRENCIES;

export type SupportedCurrency = AppCurrencyCode;
