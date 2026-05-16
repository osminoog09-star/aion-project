import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker, UrlTile } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import {
  fetchNearbyFuelStations,
  type FuelStationMarker,
} from "../features/maps/overpassFuel";
import {
  enrichFuelStationsWithRegionalPrices,
  pickCheapestStationId,
} from "../features/maps/fuelStationRanking";
import { GradientButton } from "../components/ui/GradientButton";
import { useDevice } from "../hooks/useDevice";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { useShift } from "../hooks/useShift";
import {
  loadFuelFavoriteIds,
  toggleFuelFavoriteId,
} from "../storage/driver/fuelFavoritesStorage";
import { spacing } from "../tokens";
import { formatCurrencyDisplay } from "../utils/formatting";
import { useTheme } from "../contexts/ThemeContext";

function accentToRgba(accent: string, alpha: number): string {
  const s = accent.trim();
  const rgbaMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${alpha})`;
  }
  const hex = s.replace("#", "");
  if (hex.length !== 6) return `rgba(34,211,238,${alpha})`;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const DEFAULT_REGION = {
  latitude: 55.751244,
  longitude: 37.618423,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

const OSM_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function MapExplorerScreen() {
  const insets = useSafeAreaInsets();
  const { semantic, canvas } = useTheme();
  const { settings } = useDevice();
  const currency = useResolvedCurrency();
  const { profile } = useShift();
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState(DEFAULT_REGION);
  const [rawStations, setRawStations] = useState<FuelStationMarker[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [fuelError, setFuelError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [heatAnchor, setHeatAnchor] = useState({
    lat: DEFAULT_REGION.latitude,
    lng: DEFAULT_REGION.longitude,
  });

  const country =
    profile?.countryCode && profile.countryCode.length === 2
      ? profile.countryCode
      : settings.regionCountryCode;

  const enriched = useMemo(
    () =>
      enrichFuelStationsWithRegionalPrices(rawStations, country, currency),
    [rawStations, country, currency],
  );

  const cheapestId = useMemo(() => pickCheapestStationId(enriched), [enriched]);

  const heatZones = useMemo(
    () => [
      { lat: heatAnchor.lat + 0.008, lng: heatAnchor.lng + 0.006, r: 900, o: 0.14 },
      { lat: heatAnchor.lat - 0.005, lng: heatAnchor.lng + 0.012, r: 1200, o: 0.12 },
      { lat: heatAnchor.lat + 0.003, lng: heatAnchor.lng - 0.011, r: 700, o: 0.1 },
    ],
    [heatAnchor.lat, heatAnchor.lng],
  );

  useEffect(() => {
    void loadFuelFavoriteIds().then(setFavoriteIds);
  }, []);

  const loadFuel = useCallback(async (lat: number, lng: number) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoadingFuel(true);
    setFuelError(null);
    try {
      const rows = await fetchNearbyFuelStations(lat, lng, ac.signal);
      setRawStations(rows);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setFuelError("Не удалось загрузить АЗС (сеть или лимит Overpass).");
      setRawStations([]);
    } finally {
      setLoadingFuel(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      const next = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
      setCenter(next);
      setHeatAnchor({ lat: next.latitude, lng: next.longitude });
      mapRef.current?.animateToRegion(next, 480);
      void loadFuel(next.latitude, next.longitude);
    })();
    return () => abortRef.current?.abort();
  }, [loadFuel]);

  const onToggleFavorite = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* ignore */
    }
    const next = await toggleFuelFavoriteId(id);
    setFavoriteIds(next);
  };

  const recenter = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    const next = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      latitudeDelta: center.latitudeDelta,
      longitudeDelta: center.longitudeDelta,
    };
    mapRef.current?.animateToRegion(next, 420);
    void loadFuel(next.latitude, next.longitude);
  };

  const cheapest = enriched.find((s) => s.id === cheapestId);

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={DEFAULT_REGION}
        mapType={Platform.OS === "android" ? "none" : "none"}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={(r) => {
          setCenter({
            latitude: r.latitude,
            longitude: r.longitude,
            latitudeDelta: r.latitudeDelta,
            longitudeDelta: r.longitudeDelta,
          });
        }}
      >
        <UrlTile urlTemplate={OSM_TEMPLATE} maximumZ={19} flipY={false} />
        {heatZones.map((z, i) => (
          <Circle
            key={`heat_${i}`}
            center={{ latitude: z.lat, longitude: z.lng }}
            radius={z.r}
            fillColor={accentToRgba(semantic.accent, z.o)}
            strokeColor={accentToRgba(semantic.accent, 0.22)}
            strokeWidth={1}
          />
        ))}
        {enriched.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={s.name}
            description={
              favoriteIds.includes(s.id)
                ? "★ избранное · оценка цены"
                : s.id === cheapestId
                  ? "Дешевле рядом (оценка)"
                  : "OSM · оценка цены региона"
            }
            tracksViewChanges={false}
          >
            <FuelMarkerDot
              isCheapest={s.id === cheapestId}
              isFavorite={favoriteIds.includes(s.id)}
            />
          </Marker>
        ))}
      </MapView>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: semantic.heatTint,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: insets.top + spacing.sm,
          left: spacing.md,
          right: spacing.md,
        }}
      >
        <View
          style={{
            borderRadius: 16,
            backgroundColor: semantic.surface,
            borderWidth: 1,
            borderColor: semantic.borderStrong,
            padding: spacing.md,
          }}
        >
          <Text style={{ color: semantic.textPrimary, fontSize: 15, fontWeight: "800" }}>
            Карта Driver · OSM
          </Text>
          <Text style={{ color: semantic.textTertiary, fontSize: 11, marginTop: 6, lineHeight: 16 }}>
            АЗС — Overpass. Цены — локальная оценка по региону для подсказки «дешевле рядом»; избранное хранится на
            устройстве.
          </Text>
          {cheapest ? (
            <Text style={{ color: semantic.success, fontSize: 12, marginTop: 8, fontWeight: "700" }}>
              Выгоднее сейчас: {cheapest.name.slice(0, 28)} · ~
              {formatCurrencyDisplay(cheapest.priceEstimate, currency)}
            </Text>
          ) : null}
          {loadingFuel ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
              <ActivityIndicator color={semantic.accent} size="small" />
              <Text style={{ color: semantic.textSecondary, fontSize: 11 }}>Загрузка заправок…</Text>
            </View>
          ) : fuelError ? (
            <Text style={{ color: semantic.danger, fontSize: 11, marginTop: 8 }}>{fuelError}</Text>
          ) : (
            <Text style={{ color: semantic.accent, fontSize: 11, marginTop: 8 }}>
              АЗС: {enriched.length} · избранное {favoriteIds.length}
            </Text>
          )}
          <Pressable
            onPress={() => void loadFuel(center.latitude, center.longitude)}
            style={{
              marginTop: 10,
              alignSelf: "flex-start",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: semantic.border,
            }}
          >
            <Text style={{ color: semantic.accent, fontSize: 11, fontWeight: "700" }}>Обновить АЗС</Text>
          </Pressable>
          {enriched.length > 0 ? (
            <View style={{ marginTop: 12, maxHeight: 120 }}>
              <Text style={{ color: semantic.textTertiary, fontSize: 10, fontWeight: "800", marginBottom: 6 }}>
                РЯДОМ
              </Text>
              {enriched.slice(0, 5).map((s) => (
                <View
                  key={`row_${s.id}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: semantic.border,
                  }}
                >
                  <Text style={{ color: semantic.textPrimary, fontSize: 12, flex: 1, marginRight: 8 }} numberOfLines={1}>
                    {s.id === cheapestId ? "⚡ " : ""}
                    {s.name}
                  </Text>
                  <Text style={{ color: semantic.textSecondary, fontSize: 11, marginRight: 10 }}>
                    ~{formatCurrencyDisplay(s.priceEstimate, currency)}
                  </Text>
                  <Pressable onPress={() => void onToggleFavorite(s.id)} hitSlop={10}>
                    <Text style={{ fontSize: 16 }}>{favoriteIds.includes(s.id) ? "★" : "☆"}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + spacing.lg,
          right: spacing.md,
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <Pressable
          onPress={() => void recenter()}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: semantic.surface,
            borderWidth: 1,
            borderColor: semantic.borderStrong,
          }}
        >
          <Text style={{ color: semantic.accent, fontSize: 12, fontWeight: "800" }}>Я здесь</Text>
        </Pressable>
        <GradientButton title="Назад" variant="glass" onPress={() => router.back()} />
      </View>
    </View>
  );
}

function FuelMarkerDot({
  isCheapest,
  isFavorite,
}: {
  isCheapest: boolean;
  isFavorite: boolean;
}) {
  const { semantic } = useTheme();
  const size = isCheapest ? 20 : 16;
  const bg = isCheapest ? semantic.success : isFavorite ? "#fbbf24" : semantic.violet;
  const glow = isCheapest ? semantic.success : semantic.accent;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.9)",
        shadowColor: glow,
        shadowOpacity: isCheapest ? 0.85 : 0.45,
        shadowRadius: isCheapest ? 10 : 6,
        elevation: 4,
      }}
    />
  );
}
