import * as Location from "expo-location";

export type GpsCountryResult = {
  countryCode: string | null;
  detail?: string;
};

/** Foreground GPS + reverse geocode → ISO2 (если платформа вернула isoCountryCode). */
export async function detectCountryFromGps(): Promise<GpsCountryResult> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== "granted") {
    return { countryCode: null, detail: "permission_denied" };
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const geo = await Location.reverseGeocodeAsync({
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  });
  const first = geo[0];
  const iso = first?.isoCountryCode?.toUpperCase();
  if (iso && /^[A-Z]{2}$/.test(iso)) {
    const parts = [first.city, first.region, first.country].filter(Boolean);
    return { countryCode: iso, detail: parts.join(" · ") };
  }
  return { countryCode: null, detail: "no_iso" };
}
