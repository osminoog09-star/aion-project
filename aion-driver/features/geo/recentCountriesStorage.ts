import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@aion_driver/onboarding_recent_countries_v1";
const MAX = 8;

export async function loadRecentCountryCodes(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && /^[A-Z]{2}$/i.test(x)).map((x) => x.toUpperCase());
  } catch {
    return [];
  }
}

export async function touchRecentCountryCode(code: string): Promise<string[]> {
  const c = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return loadRecentCountryCodes();
  const cur = await loadRecentCountryCodes();
  const next = [c, ...cur.filter((x) => x !== c)].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
