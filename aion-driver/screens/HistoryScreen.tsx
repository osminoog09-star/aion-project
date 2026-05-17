import { useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useCallback, useState, memo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlowCard } from "../components/ui/GlowCard";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { useDevice } from "../hooks/useDevice";
import { useShift } from "../hooks/useShift";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useMergedShiftHistory } from "../features/trips/hooks/useMergedShiftHistory";
import {
  useTimelineEntries,
  type TimelineEntry,
} from "../features/history/useTimelineEntries";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { useResolvedDistanceUnits } from "../hooks/useResolvedDistanceUnits";
import { qk } from "../lib/queryKeys";
import type { AionTimelineEvent } from "../storage/core/aionTimelineStorage";
import type { OcrImportRecord } from "../features/import/types";
import type { Shift } from "../types";
import type { AppCurrencyCode, DistanceUnits } from "../types/device";
import {
  formatCurrencyDisplay,
  formatDuration,
  formatKm,
  formatLiters,
} from "../utils/formatting";
import {
  formatOperationalCostsBrief,
  pickProfitFromRouteRow,
} from "../utils/shiftDisplayEconomics";

export function HistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const currency = useResolvedCurrency();
  const distanceUnits = useResolvedDistanceUnits();
  const { merged: history, isLoading } = useMergedShiftHistory();
  const { entries, refreshOcr } = useTimelineEntries(history);
  const { refreshHistory } = useShift();
  const { settings } = useDevice();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshHistory();
    await refreshOcr();
    const uid = session?.user.id;
    if (uid) {
      await queryClient.invalidateQueries({ queryKey: qk.trips(uid) });
    }
    setRefreshing(false);
  }, [refreshHistory, refreshOcr, queryClient, session?.user.id]);

  const bgVariant =
    settings.nightContrast === "nightDrive" ? "nightDrive" : "cockpit";

  return (
    <CockpitBackground variant={bgVariant}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="px-4 pb-3 pt-2">
          <Text className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            история
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-white">Лента</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Смены · OCR · расходы (OCR и облако при входе) · {entries.length}{" "}
            событий
            {isLoading ? " · синк…" : ""}
          </Text>
          <Pressable
            className="mt-3 self-start rounded-lg border border-cyan-500/30 px-3 py-2"
            onPress={() => router.push("/driver/route-timeline" as Href)}
          >
            <Text className="text-sm text-cyan-300">Маршруты GPS →</Text>
          </Pressable>
        </View>
        <FlatList
          data={entries}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          renderItem={({ item }) => (
            <TimelineRow
              item={item}
              currency={currency}
              distanceUnits={distanceUnits}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <Text className="mt-10 text-center text-slate-500">
              Пока пусто. Завершите смену на пульте или импортируйте выплату во вкладке
              «Импорт».
            </Text>
          }
        />
      </SafeAreaView>
    </CockpitBackground>
  );
}

const TimelineRow = memo(function TimelineRow({
  item,
  currency,
  distanceUnits,
}: {
  item: TimelineEntry;
  currency: AppCurrencyCode;
  distanceUnits: DistanceUnits;
}) {
  if (item.kind === "shift") {
    return (
      <ShiftRow
        shift={item.shift}
        currency={currency}
        distanceUnits={distanceUnits}
      />
    );
  }
  if (item.kind === "ocr") {
    return <OcrRow record={item.record} currency={currency} />;
  }
  return <AionRow event={item.event} />;
});

function ShiftRow({
  shift,
  currency,
  distanceUnits,
}: {
  shift: Shift;
  currency: AppCurrencyCode;
  distanceUnits: DistanceUnits;
}) {
  const date = new Date(shift.endedAt);
  const dateLabel = date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const profit = pickProfitFromRouteRow({ shift });
  const profitValue = profit.profit ?? shift.netProfit;
  return (
    <GlowCard className="mb-3" glow="neutral">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] uppercase tracking-widest text-cyan-400/80">
            Смена
            {profit.usesAfterCosts ? " · нетто" : ""}
          </Text>
          <Text className="text-sm text-slate-300">{dateLabel}</Text>
        </View>
        <Text className="text-lg font-semibold text-emerald-300">
          {formatCurrencyDisplay(profitValue, currency)}
        </Text>
      </View>
      {profit.usesAfterCosts &&
      shift.rentalCostAccrued != null &&
      shift.fixedOpsCost != null ? (
        <Text className="mt-2 text-[10px] text-violet-300/80">
          {formatOperationalCostsBrief(
            {
              rentalAccrued: shift.rentalCostAccrued,
              fixedOpsAccrued: shift.fixedOpsCost,
              totalOperationalCost:
                shift.rentalCostAccrued + shift.fixedOpsCost,
              profitAfterCosts: shift.netProfitAfterCosts ?? profitValue,
              profitPerHourAfterCosts: shift.profitPerHourAfterCosts ?? 0,
            },
            currency,
          )}
        </Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
        <Meta label="Время" value={formatDuration(shift.durationMs)} />
        <Meta label="Км всего" value={formatKm(shift.distanceKm, distanceUnits)} />
        <Meta label="Км бензин" value={formatKm(shift.distanceKmPetrol, distanceUnits)} />
        <Meta label="Км газ" value={formatKm(shift.distanceKmGas, distanceUnits)} />
        <Meta
          label="Доход"
          value={formatCurrencyDisplay(shift.income, currency)}
        />
        <Meta
          label="Бензин"
          value={`${formatLiters(shift.fuelUsedPetrolLiters)} · ${formatCurrencyDisplay(shift.fuelCostPetrol, currency)}`}
        />
        <Meta
          label="Газ"
          value={`${formatLiters(shift.fuelUsedGasLiters)} · ${formatCurrencyDisplay(shift.fuelCostGas, currency)}`}
        />
        <Meta
          label="Топливо Σ"
          value={formatCurrencyDisplay(shift.fuelCostTotal, currency)}
        />
        <Meta
          label="Экономия газ"
          value={formatCurrencyDisplay(shift.gasSavingsRub, currency)}
        />
      </View>
    </GlowCard>
  );
}

function OcrRow({
  record,
  currency,
}: {
  record: OcrImportRecord;
  currency: AppCurrencyCode;
}) {
  const p = record.parse;
  const date = new Date(record.createdAt);
  const dateLabel = date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <GlowCard className="mb-3" glow="violet">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] uppercase tracking-widest text-violet-300/90">
            OCR · {p.platform.toUpperCase()}
          </Text>
          <Text className="text-sm text-slate-300">{dateLabel}</Text>
        </View>
        <Text className="text-lg font-semibold text-cyan-200">
          {formatCurrencyDisplay(p.netProfit, currency)}
        </Text>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
        <Meta
          label="Выплата"
          value={formatCurrencyDisplay(p.earnings, currency)}
        />
        <Meta label="Часы" value={String(p.hoursOnline)} />
        <Meta label="Поездки" value={String(p.tripCount)} />
        <Meta
          label="Топливо (оценка)"
          value={formatCurrencyDisplay(p.estimatedFuelCost, currency)}
        />
      </View>
    </GlowCard>
  );
}

function AionRow({ event }: { event: AionTimelineEvent }) {
  const date = new Date(event.at);
  const dateLabel = date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <GlowCard className="mb-3" glow="cyan">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[10px] uppercase tracking-widest text-cyan-300/90">
            AION · {event.type}
          </Text>
          <Text className="mt-1 text-base font-semibold text-white">{event.title}</Text>
          {event.detail ? (
            <Text className="mt-1 text-sm text-slate-400">{event.detail}</Text>
          ) : null}
          <Text className="mt-2 text-xs text-slate-500">{dateLabel}</Text>
        </View>
      </View>
    </GlowCard>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[44%] flex-1">
      <Text className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </Text>
      <Text className="text-sm text-slate-200">{value}</Text>
    </View>
  );
}
