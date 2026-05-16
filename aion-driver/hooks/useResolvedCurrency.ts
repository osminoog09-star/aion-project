import type { AppCurrencyCode } from "../types/device";
import { useDevice } from "./useDevice";
import { useShift } from "./useShift";

export function useResolvedCurrency(): AppCurrencyCode {
  const { settings } = useDevice();
  const { profile } = useShift();
  return (profile?.currencyCode ?? settings.currencyCode) as AppCurrencyCode;
}
