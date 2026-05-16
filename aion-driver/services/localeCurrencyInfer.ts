import * as Localization from "expo-localization";
import {
  ALPHA2_TO_ISO4217,
  KNOWN_ISO4217_CURRENCIES,
} from "../features/geo/generatedAlpha2ToCurrency";
import type { AppCurrencyCode } from "../features/geo/generatedAlpha2ToCurrency";
import type { DistanceUnits } from "../types/device";

const KNOWN = new Set<string>(KNOWN_ISO4217_CURRENCIES);

/** Мили: США, Великобритания, Либерия, Мьянма. */
export function distanceUnitsForCountry(iso2: string): DistanceUnits {
  const c = iso2.toUpperCase();
  return c === "US" || c === "GB" || c === "LR" || c === "MM" ? "mi" : "km";
}

export function currencyForCountry(iso2: string): AppCurrencyCode {
  const iso3 = ALPHA2_TO_ISO4217[iso2.toUpperCase()];
  if (iso3 && KNOWN.has(iso3)) return iso3 as AppCurrencyCode;
  return "EUR";
}

export function inferFromDeviceLocale(): {
  countryCode: string;
  currencyCode: AppCurrencyCode;
  localeTag: string;
  distanceUnits: DistanceUnits;
} {
  const loc = Localization.getLocales()[0];
  const region = (loc?.regionCode ?? "DE").toUpperCase();
  const fromLocCur = loc?.currencyCode?.toUpperCase();
  const fromMap = ALPHA2_TO_ISO4217[region];
  let currency: AppCurrencyCode = "EUR";
  if (fromLocCur && KNOWN.has(fromLocCur)) {
    currency = fromLocCur as AppCurrencyCode;
  } else if (fromMap && KNOWN.has(fromMap)) {
    currency = fromMap as AppCurrencyCode;
  }
  return {
    countryCode: region,
    currencyCode: currency,
    localeTag: loc?.languageTag ?? "en-US",
    distanceUnits: distanceUnitsForCountry(region),
  };
}

/** Грубый fallback по IANA timezone (если GPS и локаль не помогли). */
export function inferCountryFromTimezone(): string | null {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const tail = tz.includes("/") ? (tz.split("/").pop() ?? "") : tz;
  const cityToCountry: Record<string, string> = {
    Tallinn: "EE",
    Riga: "LV",
    Vilnius: "LT",
    Helsinki: "FI",
    Berlin: "DE",
    Paris: "FR",
    Madrid: "ES",
    Rome: "IT",
    Amsterdam: "NL",
    Brussels: "BE",
    Vienna: "AT",
    Warsaw: "PL",
    Prague: "CZ",
    Stockholm: "SE",
    Oslo: "NO",
    Copenhagen: "DK",
    London: "GB",
    Dublin: "IE",
    Lisbon: "PT",
    Athens: "GR",
    Bucharest: "RO",
    Sofia: "BG",
    Zagreb: "HR",
    Kyiv: "UA",
    Moscow: "RU",
    Istanbul: "TR",
    Dubai: "AE",
    Tel_Aviv: "IL",
    Jerusalem: "IL",
    Tokyo: "JP",
    Seoul: "KR",
    Singapore: "SG",
    Hong_Kong: "HK",
    Bangkok: "TH",
    Jakarta: "ID",
    Manila: "PH",
    Sydney: "AU",
    Melbourne: "AU",
    Auckland: "NZ",
    Toronto: "CA",
    Vancouver: "CA",
    Montreal: "CA",
    Mexico_City: "MX",
    Sao_Paulo: "BR",
    Buenos_Aires: "AR",
    Santiago: "CL",
    Bogota: "CO",
    Lima: "PE",
    Caracas: "VE",
    New_York: "US",
    Chicago: "US",
    Los_Angeles: "US",
    Denver: "US",
    Phoenix: "US",
    Detroit: "US",
    Houston: "US",
    Miami: "US",
    Anchorage: "US",
    Honolulu: "US",
    Johannesburg: "ZA",
    Cairo: "EG",
    Lagos: "NG",
    Nairobi: "KE",
    Casablanca: "MA",
    Almaty: "KZ",
    Tashkent: "UZ",
    Baku: "AZ",
    Yerevan: "AM",
    Tbilisi: "GE",
    Astana: "KZ",
    Minsk: "BY",
  };
  const hit = cityToCountry[tail];
  return hit ?? null;
}
