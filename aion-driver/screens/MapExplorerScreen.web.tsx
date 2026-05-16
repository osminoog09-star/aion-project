import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const DEFAULT_REGION = {
  latitude: 55.751244,
  longitude: 37.618423,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

export function MapExplorerScreen() {
  const insets = useSafeAreaInsets();
  const { semantic, canvas } = useTheme();
  const { settings } = useDevice();
  const currency = useResolvedCurrency();
  const { profile } = useShift();
  const [rawStations, setRawStations] = useState<FuelStationMarker[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [fuelError, setFuelError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
    void loadFuel(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
    return () => abortRef.current?.abort();
  }, [loadFuel]);

  const onToggleFavorite = async (id: string) => {
    const next = await toggleFuelFavoriteId(id);
    setFavoriteIds(next);
  };

  const cheapest = enriched.find((s) => s.id === cheapestId);

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.lg,
          paddingHorizontal: spacing.md,
          gap: spacing.md,
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
            Карта Driver · веб
          </Text>
          <Text style={{ color: semantic.textTertiary, fontSize: 11, marginTop: 6, lineHeight: 16 }}>
            Интерактивная карта OSM доступна в мобильном приложении. Здесь — те же АЗС вокруг Москвы (по
            умолчанию) и избранное.
          </Text>
          {cheapest ? (
            <Text style={{ color: semantic.success, fontSize: 12, marginTop: 8, fontWeight: "700" }}>
              Выгоднее в выборке: {cheapest.name.slice(0, 40)} · ~
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
            onPress={() => void loadFuel(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude)}
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
        </View>

        {enriched.length > 0 ? (
          <View
            style={{
              borderRadius: 16,
              backgroundColor: semantic.surface,
              borderWidth: 1,
              borderColor: semantic.border,
              padding: spacing.md,
            }}
          >
            <Text style={{ color: semantic.textTertiary, fontSize: 10, fontWeight: "800", marginBottom: 8 }}>
              РЯДОМ
            </Text>
            {enriched.map((s) => (
              <View
                key={s.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: semantic.border,
                }}
              >
                <Text style={{ color: semantic.textPrimary, fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={2}>
                  {s.id === cheapestId ? "⚡ " : ""}
                  {s.name}
                </Text>
                <Text style={{ color: semantic.textSecondary, fontSize: 12, marginRight: 10 }}>
                  ~{formatCurrencyDisplay(s.priceEstimate, currency)}
                </Text>
                <Pressable onPress={() => void onToggleFavorite(s.id)} hitSlop={10}>
                  <Text style={{ fontSize: 18 }}>{favoriteIds.includes(s.id) ? "★" : "☆"}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <GradientButton title="Назад" variant="glass" onPress={() => router.back()} />
      </ScrollView>
    </View>
  );
}
