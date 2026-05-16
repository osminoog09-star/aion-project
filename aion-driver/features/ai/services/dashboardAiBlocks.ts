import type { Shift, UserProfile } from "../../../types";
import type { DriverAnalytics } from "../../driver/analytics/computeDriverAnalytics";

export type AiInsight = { id: string; title: string; body: string; tone: "cyan" | "violet" | "amber" };

/**
 * Локальный AI coach без сети. Контракт сохраняем для будущего Edge/LLM.
 */
export function buildDashboardAiBlocks(
  history: Shift[],
  profile: UserProfile,
  vehicleLabel: string,
  analytics?: DriverAnalytics | null,
): AiInsight[] {
  const blocks: AiInsight[] = [];
  if (history.length === 0) {
    blocks.push({
      id: "empty",
      title: "Недостаточно данных для анализа",
      body: "Завершите первую смену — тогда появятся инсайты по маршруту и топливу без «оценочных» оценок.",
      tone: "amber",
    });
    return blocks;
  }

  if (history.length < 3) {
    return [
      {
        id: "insufficient-core",
        title: "Недостаточно данных для анализа",
        body: "Нужно минимум 3 завершённые смены для маршрутной эффективности, 5 — для тренда топлива, 7 — для оценки стабильности.",
        tone: "amber",
      },
      {
        id: "onboard-tip",
        title: "Пока что",
        body: "Заполняйте профиль расхода и цен — после нескольких смен сравним прибыль/час и топливо.",
        tone: "cyan",
      },
    ];
  }

  if (analytics?.fatigueHint) {
    blocks.push({
      id: "fatigue",
      title: "Режим водителя",
      body: analytics.fatigueHint,
      tone: "amber",
    });
  }

  if (analytics?.weakZonesLabel && analytics.weakZonesLabel.length > 4) {
    blocks.push({
      id: "weak",
      title: "Зоны внимания",
      body: analytics.weakZonesLabel,
      tone: "amber",
    });
  }

  if (analytics?.momentumInsight) {
    blocks.push({
      id: "momentum",
      title: "Моментум",
      body: analytics.momentumInsight,
      tone: "violet",
    });
  }

  if (history.length >= 5) {
    blocks.push({
      id: "score",
      title: "Driver score",
      body: analytics?.driverScoreEvolution ?? "Динамика по последним сменам.",
      tone: "cyan",
    });
  }

  if (
    history.length >= 7 &&
    analytics?.consistencyScore != null &&
    analytics.consistencyScore > 0
  ) {
    blocks.push({
      id: "consistency",
      title: "Стабильность",
      body: `Consistency ${analytics.consistencyScore}/100 — разброс прибыли/час по последним сменам.`,
      tone: "cyan",
    });
  }

  if (
    history.length >= 3 &&
    analytics?.routeEfficiencyScore != null &&
    analytics.routeEfficiencyScore > 0
  ) {
    blocks.push({
      id: "route",
      title: "Маршрутная эффективность",
      body: `Route score ${analytics.routeEfficiencyScore}/100 — профит/км vs ваша медиана.`,
      tone: "violet",
    });
  }

  if (history.length >= 5 && analytics?.fuelTrendLabel) {
    blocks.push({
      id: "fuel-trend",
      title: "Тренд топлива",
      body: `${analytics.fuelTrendLabel}${analytics.estimatedFuelWasteRub > 20 ? ` · оценка перерасхода ~${Math.round(analytics.estimatedFuelWasteRub)} на последней смене.` : ""}`,
      tone: "amber",
    });
  }

  const last = history[0]!;
  const avgFuelPerH =
    history.reduce((s, x) => s + x.fuelCostTotal / Math.max(x.durationMs / 3_600_000, 0.25), 0) /
    history.length;
  const lastFuelPerH =
    last.fuelCostTotal / Math.max(last.durationMs / 3_600_000, 0.25);
  if (history.length >= 5 && lastFuelPerH > avgFuelPerH * 1.12) {
    blocks.push({
      id: "fuel",
      title: "Расход выше нормы",
      body: "Последняя смена: топливо на час заметно выше вашей медианы. Проверьте простой и переключение бензин/газ.",
      tone: "amber",
    });
  } else if (history.length >= 5 && analytics?.fuelWasteHint && !(lastFuelPerH > avgFuelPerH * 1.12)) {
    blocks.push({
      id: "fuel-live",
      title: "Топливо · срез",
      body: analytics.fuelWasteHint,
      tone: "amber",
    });
  }

  blocks.push({
    id: "window",
    title: "Сильные часы",
    body:
      analytics?.bestHoursLabel ??
      `По мере накопления смен выделим окна с лучшей прибылью/час в ${profile.countryCode ?? "вашем регионе"}.`,
    tone: "violet",
  });

  blocks.push({
    id: "week-tip",
    title: "Недели",
    body: analytics?.weeklyTip ?? "Сравниваем последние смены с медианой — держите ритм и фиксируйте простой.",
    tone: "cyan",
  });

  blocks.push({
    id: "vehicle",
    title: "Эффективность авто",
    body: `${vehicleLabel}: при ровном трафике держите mixed расход около ${profile.petrolConsumptionLPer100Km} л/100 км — так ниже риск «просадки» прибыли на км.`,
    tone: "cyan",
  });

  blocks.push({
    id: "fuel-map",
    title: "Умное топливо",
    body: "На карте OSM — ближайшие АЗС и подсказка «дешевле рядом» по оценочным ценам региона; избранное сохраняется локально.",
    tone: "violet",
  });

  const seen = new Set<string>();
  const out: AiInsight[] = [];
  for (const b of blocks) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    out.push(b);
    if (out.length >= 6) break;
  }
  return out;
}
