import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { FuelCategory } from "../../../../core/types/fuel";
import type { VehicleCatalogEntry } from "../../../../core/types/vehicle";
import type { GarageVehicle } from "../../../../core/types/vehicle";
import { searchVehicleCatalog, listVehicleCatalogByIds } from "../../../../data/vehicleCatalog";
import { useTheme } from "../../../../contexts/ThemeContext";
import { CockpitBackground } from "../../../../components/ui/CockpitBackground";
import { useGarage } from "../../../../features/vehicles/hooks/useGarage";
import { useGarageCatalogUx } from "../../../../features/vehicles/hooks/useGarageCatalogUx";
import { vehicleCatalogGlyph } from "../../../../features/vehicles/vehicleVisuals";

type FuelFilter = "all" | FuelCategory | "hybrid";

const FILTERS: { id: FuelFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "ev", label: "Электро" },
  { id: "hybrid", label: "Гибрид" },
  { id: "diesel", label: "Дизель" },
  { id: "petrol", label: "Бензин" },
  { id: "lpg", label: "Газ" },
];

function fuelLabelRu(code: string): string {
  const m: Record<string, string> = {
    petrol: "Бензин",
    diesel: "Дизель",
    ev: "Электро",
    lpg: "Газ",
    hybrid: "Гибрид",
  };
  return m[code] ?? code.toUpperCase();
}

function matchesFuelFilter(v: VehicleCatalogEntry, f: FuelFilter): boolean {
  if (f === "all") return true;
  if (f === "hybrid") return v.fuelSecondary === "ev";
  if (f === "ev") return v.fuelPrimary === "ev";
  return v.fuelPrimary === f;
}

export default function FleetScreen() {
  const insets = useSafeAreaInsets();
  const { semantic } = useTheme();
  const {
    q,
    setQ,
    vehicles,
    addFromCatalog,
    remove,
    setPrimary,
    mode,
    isBusy,
    remoteError,
  } = useGarage();
  const { favoriteIds, recentIds, hydrated, toggleFavorite, touchRecent } = useGarageCatalogUx();
  const [fuelFilter, setFuelFilter] = useState<FuelFilter>("all");

  const favoriteEntries = useMemo(() => {
    const list = listVehicleCatalogByIds(favoriteIds);
    return list.filter((v) => matchesFuelFilter(v, fuelFilter));
  }, [favoriteIds, fuelFilter]);

  const recentEntries = useMemo(() => {
    const list = listVehicleCatalogByIds(recentIds);
    return list.filter((v) => matchesFuelFilter(v, fuelFilter) && !favoriteIds.includes(v.id));
  }, [recentIds, favoriteIds, fuelFilter]);

  const catalogList = useMemo(() => {
    const raw = searchVehicleCatalog(q, 100).filter((v) => matchesFuelFilter(v, fuelFilter));
    const fav = new Set(favoriteIds);
    const starred = raw.filter((v) => fav.has(v.id));
    const rest = raw.filter((v) => !fav.has(v.id));
    const seen = new Set<string>();
    const ordered: VehicleCatalogEntry[] = [];
    for (const v of [...starred, ...rest]) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      ordered.push(v);
    }
    return ordered;
  }, [q, fuelFilter, favoriteIds]);

  const primary = useMemo(() => vehicles.find((v) => v.isPrimary) ?? null, [vehicles]);

  const onAdd = useCallback(
    (item: VehicleCatalogEntry) => {
      void touchRecent(item.id);
      addFromCatalog(item);
    },
    [addFromCatalog, touchRecent],
  );

  const cloudCard =
    remoteError != null ? (
      <View
        className="mb-4 rounded-2xl border p-4"
        style={{
          borderColor: semantic.borderStrong,
          backgroundColor: semantic.surfaceMuted,
        }}
      >
        <Text className="text-sm font-semibold" style={{ color: semantic.textPrimary }}>
          Синхронизация недоступна
        </Text>
        <Text className="mt-1 text-xs leading-5" style={{ color: semantic.textSecondary }}>
          Проверьте сеть и вход в аккаунт. Гараж можно вести локально в гостевом режиме.
        </Text>
      </View>
    ) : null;

  const renderCatalogRow = ({ item }: { item: VehicleCatalogEntry }) => {
    const isFav = favoriteIds.includes(item.id);
    const glyph = vehicleCatalogGlyph(item);
    return (
      <View
        className="mb-2 flex-row items-stretch overflow-hidden rounded-2xl border"
        style={{ borderColor: semantic.border, backgroundColor: semantic.surface }}
      >
        <Pressable
          onPress={() => onAdd(item)}
          className="flex-1 flex-row items-center px-3 py-3 active:opacity-85"
        >
          <View
            className="mr-3 h-12 w-12 items-center justify-center rounded-2xl border"
            style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
          >
            <Text className="text-xl">{glyph}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: semantic.textPrimary }}>
              {item.brand} {item.model} {item.year}
            </Text>
            <Text className="text-xs" style={{ color: semantic.textSecondary }}>
              {item.engine} · {fuelLabelRu(item.fuelPrimary)}
              {item.fuelSecondary === "ev" ? " + электро" : ""} · {item.consumptionMixedLPer100Km} л
              {item.tankLiters ? ` · бак ${item.tankLiters} л` : ""}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => void toggleFavorite(item.id)}
          className="justify-center border-l px-3 active:opacity-70"
          style={{ borderColor: semantic.border }}
          accessibilityLabel={isFav ? "Убрать из избранного" : "В избранное"}
        >
          <MaterialIcons
            name={isFav ? "star" : "star-border"}
            size={24}
            color={isFav ? semantic.accent : semantic.textTertiary}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <CockpitBackground variant="cockpit">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 140,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-1 text-2xl font-bold" style={{ color: semantic.textPrimary }}>
          Гараж
        </Text>
        <Text className="mb-4 text-sm leading-5" style={{ color: semantic.textSecondary }}>
          Каталог, избранное и недавние пресеты.{" "}
          {mode === "cloud" ? "Синхронизация с облаком включена." : "Гостевой режим — данные на устройстве."}
        </Text>

        {cloudCard}

        {primary ? (
          <View
            className="mb-4 rounded-2xl border p-4"
            style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
          >
            <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: semantic.accent }}>
              Текущее авто
            </Text>
            <Text className="mt-2 text-lg font-semibold" style={{ color: semantic.textPrimary }}>
              {vehicleCatalogGlyph(primary)} {primary.brand} {primary.model}
            </Text>
            <Text className="mt-1 text-xs leading-5" style={{ color: semantic.textSecondary }}>
              Справочно по каталогу: смешанный расход {primary.consumptionMixedLPer100Km} л/100 км
              {primary.tankLiters ? ` · бак ${primary.tankLiters} л` : ""}.
              ТО и шины зависят от пробега и условий — планируйте по фактическим км в сменах.
            </Text>
          </View>
        ) : null}

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Марка, модель, год…"
          placeholderTextColor={semantic.textTertiary}
          className="mb-3 rounded-2xl border px-4 py-3 text-base"
          style={{
            borderColor: semantic.border,
            backgroundColor: semantic.surface,
            color: semantic.textPrimary,
          }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => {
            const on = fuelFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFuelFilter(f.id)}
                className="rounded-full border px-4 py-2 active:opacity-80"
                style={{
                  borderColor: on ? semantic.accent : semantic.border,
                  backgroundColor: on ? semantic.accentMuted : semantic.surfaceMuted,
                }}
              >
                <Text className="text-xs font-semibold" style={{ color: on ? semantic.accent : semantic.textSecondary }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: semantic.textTertiary }}>
          Мои авто
        </Text>
        {isBusy && vehicles.length === 0 ? (
          <ActivityIndicator color={semantic.accent} className="mb-4" />
        ) : vehicles.length === 0 ? (
          <Text className="mb-4 text-sm" style={{ color: semantic.textTertiary }}>
            Пока пусто — добавьте авто из каталога ниже.
          </Text>
        ) : (
          <View className="mb-6">
            {vehicles.map((v: GarageVehicle) => (
              <View
                key={v.remoteId ?? v.localId}
                className="mb-2 flex-row items-center justify-between rounded-2xl border px-3 py-3"
                style={{ borderColor: semantic.border, backgroundColor: semantic.surface }}
              >
                <View className="flex-1 flex-row items-center pr-2">
                  <Text className="mr-2 text-lg">{vehicleCatalogGlyph(v)}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: semantic.textPrimary }}>
                      {v.brand} {v.model}
                      {v.isPrimary ? (
                        <Text style={{ color: semantic.accent }}> · основная</Text>
                      ) : null}
                    </Text>
                    <Text className="text-xs" style={{ color: semantic.textSecondary }}>
                      {v.engine} · {fuelLabelRu(v.fuelPrimary)}
                      {v.fuelSecondary === "ev" ? " + электро" : ""} · смешанный {v.consumptionMixedLPer100Km} л
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {!v.isPrimary ? (
                    <Pressable
                      onPress={() => setPrimary(v)}
                      className="rounded-xl px-2 py-1"
                      style={{ backgroundColor: semantic.accentMuted }}
                    >
                      <Text className="text-[10px] font-semibold" style={{ color: semantic.accent }}>
                        ★
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => remove(v)}
                    className="rounded-xl px-2 py-1"
                    style={{ backgroundColor: `${semantic.danger}22` }}
                  >
                    <Text className="text-[10px] font-semibold" style={{ color: semantic.danger }}>
                      ✕
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {hydrated && favoriteEntries.length > 0 ? (
          <>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: semantic.textTertiary }}>
              Избранное в каталоге
            </Text>
            <View className="mb-4">{favoriteEntries.map((item) => (
              <View key={`fav-${item.id}`}>{renderCatalogRow({ item })}</View>
            ))}</View>
          </>
        ) : null}

        {hydrated && recentEntries.length > 0 ? (
          <>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: semantic.textTertiary }}>
              Недавно смотрели
            </Text>
            <View className="mb-4">{recentEntries.map((item) => (
              <View key={`rec-${item.id}`}>{renderCatalogRow({ item })}</View>
            ))}</View>
          </>
        ) : null}

        <Text className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: semantic.textTertiary }}>
          Каталог {q.trim() ? "· поиск" : "· топ"}
        </Text>
        <FlatList
          scrollEnabled={false}
          data={catalogList}
          keyExtractor={(item) => item.id}
          renderItem={renderCatalogRow}
          keyboardShouldPersistTaps="handled"
        />
      </ScrollView>
    </CockpitBackground>
  );
}
