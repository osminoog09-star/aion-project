import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as ExpoLinking from "expo-linking";
import * as Haptics from "expo-haptics";
import {
  listGpsTripShiftIds,
  loadGpsTripSession,
} from "../features/gps/tripStore/gpsTripStorage";
import { parseGeoUri } from "../features/maps/parseGeoUri";
import { fetchRoadRoute, type RoadRoute } from "../features/maps/osrmRoute";
import { haversineMeters } from "../utils/geo";
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

// Пярну — рабочий город владельца; карта тут только до первого GPS-фикса.
const DEFAULT_REGION = {
  latitude: 58.3859,
  longitude: 24.4971,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

/** Не душить Polyline: прореживаем очень длинные маршруты. */
const MAX_ROUTE_POINTS = 1500;

const OSM_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function MapExplorerScreen() {
  const insets = useSafeAreaInsets();
  const { semantic, canvas } = useTheme();
  const { settings } = useDevice();
  const currency = useResolvedCurrency();
  const { profile, activeShift } = useShift();
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState(DEFAULT_REGION);
  const [rawStations, setRawStations] = useState<FuelStationMarker[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [fuelError, setFuelError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeIsLive, setRouteIsLive] = useState(false);
  const [userPos, setUserPos] = useState<{ latitude: number; longitude: number } | null>(null);

  // Точка назначения из навигационной ссылки (Bolt → «Навигация» → AION).
  const incomingUrl = ExpoLinking.useURL();
  const destination = useMemo(
    () => (incomingUrl ? parseGeoUri(incomingUrl) : null),
    [incomingUrl],
  );

  useEffect(() => {
    if (!destination) return;
    mapRef.current?.animateToRegion(
      {
        latitude: destination.lat,
        longitude: destination.lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      480,
    );
  }, [destination]);

  // Маршрут по дорогам до точки (OSRM). Недоступен → honest-фолбэк: пунктир по прямой.
  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(null);
  useEffect(() => {
    setRoadRoute(null);
    if (!destination || !userPos) return;
    const ac = new AbortController();
    void fetchRoadRoute(
      userPos,
      { latitude: destination.lat, longitude: destination.lng },
      ac.signal,
    ).then((r) => {
      if (ac.signal.aborted) return;
      setRoadRoute(r);
      // Показать маршрут целиком.
      if (r && r.coords.length >= 2) {
        mapRef.current?.fitToCoordinates(r.coords, {
          edgePadding: { top: 180, right: 60, bottom: 120, left: 60 },
          animated: true,
        });
      }
    });
    return () => ac.abort();
  }, [destination, userPos]);

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

  useEffect(() => {
    void loadFuelFavoriteIds().then(setFavoriteIds);
  }, []);

  // Реальный маршрут: активная смена, а без неё — последняя записанная.
  // Никаких выдуманных зон/точек — только настоящие GPS-точки.
  useEffect(() => {
    let alive = true;
    void (async () => {
      let shiftId = activeShift?.id ?? null;
      if (!shiftId) {
        const ids = await listGpsTripShiftIds();
        shiftId = ids[0] ?? null;
      }
      if (!shiftId) return;
      const session = await loadGpsTripSession(shiftId);
      if (!alive || !session || session.points.length < 2) return;
      const step = Math.max(1, Math.ceil(session.points.length / MAX_ROUTE_POINTS));
      const coords = session.points
        .filter((_, i) => i % step === 0)
        .map((p) => ({ latitude: p.lat, longitude: p.lng }));
      setRouteCoords(coords);
      setRouteIsLive(Boolean(activeShift?.id));
    })();
    return () => {
      alive = false;
    };
  }, [activeShift?.id]);

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
      setUserPos({ latitude: next.latitude, longitude: next.longitude });
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
    setUserPos({ latitude: next.latitude, longitude: next.longitude });
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
        {routeCoords.length >= 2 ? (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeColor={accentToRgba(semantic.accent, 0.9)}
              strokeWidth={4}
            />
            <Marker
              coordinate={routeCoords[0]}
              title="Старт смены"
              tracksViewChanges={false}
            />
            {!routeIsLive ? (
              <Marker
                coordinate={routeCoords[routeCoords.length - 1]}
                title="Финиш"
                tracksViewChanges={false}
              />
            ) : null}
          </>
        ) : null}
        {destination ? (
          <>
            <Marker
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              title={destination.label ?? "Точка назначения"}
              pinColor="#22d3ee"
              tracksViewChanges={false}
            />
            {roadRoute ? (
              <Polyline
                coordinates={roadRoute.coords}
                strokeColor={accentToRgba(semantic.accent, 0.95)}
                strokeWidth={5}
              />
            ) : userPos ? (
              <Polyline
                coordinates={[userPos, { latitude: destination.lat, longitude: destination.lng }]}
                strokeColor={accentToRgba(semantic.accent, 0.55)}
                strokeWidth={2}
                lineDashPattern={[10, 8]}
              />
            ) : null}
          </>
        ) : null}
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
            Карта Driver
          </Text>
          <Text style={{ color: semantic.textTertiary, fontSize: 11, marginTop: 6, lineHeight: 16 }}>
            {routeCoords.length >= 2
              ? routeIsLive
                ? "Маршрут текущей смены рисуется по GPS."
                : "Показан маршрут последней смены."
              : "Начните смену — маршрут появится на карте по GPS."}{" "}
            Заправки рядом — с ценовой подсказкой «дешевле рядом».
          </Text>
          {destination ? (
            <Text style={{ color: semantic.accent, fontSize: 12, marginTop: 8, fontWeight: "700" }}>
              Точка назначения{destination.label ? `: ${destination.label}` : ""}
              {roadRoute
                ? ` · ${(roadRoute.distanceMeters / 1000).toFixed(1)} км · ~${Math.max(
                    1,
                    Math.round(roadRoute.durationSec / 60),
                  )} мин по дорогам`
                : userPos
                  ? ` · ${(
                      haversineMeters(
                        { lat: userPos.latitude, lng: userPos.longitude },
                        { lat: destination.lat, lng: destination.lng },
                      ) / 1000
                    ).toFixed(1)} км по прямой`
                  : ""}
            </Text>
          ) : null}
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
