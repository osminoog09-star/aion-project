import { DEFAULT_CURRENCY } from "../core/constants/currencies";
import type { AppCurrencyCode } from "../types/device";
import { useDevice } from "./useDevice";
import { useShift } from "./useShift";

/** Валюта из онбординга/настроек устройства; профиль зеркалит её для облака. */
export function useResolvedCurrency(): AppCurrencyCode {
  const { settings } = useDevice();
  const { profile } = useShift();
  return (settings.currencyCode ?? profile?.currencyCode ?? DEFAULT_CURRENCY) as AppCurrencyCode;
}
