import type { Shift } from "../../../types";

export type DriverAnalytics = {
  efficiencyScore: number;
  /** 0–23, топ-3 часа старта смен по взвешенной прибыли/ч */
  bestStartHours: number[];
  bestHoursLabel: string;
  fuelWasteHint: string;
  weeklyTip: string;
  shiftQualityAvg: number;
  medianProfitPerHour: number;
  lastTenAvgProfitPerHour: number;
  /** 0–100: профит/км vs медиана */
  routeEfficiencyScore: number;
  /** Тренд топлива на час: последние 5 смен vs предыдущие 5 */
  fuelTrend: "up" | "down" | "flat";
  fuelTrendLabel: string;
  /** Оценка «лишнего» топлива на последней смене (руб), эвристика */
  estimatedFuelWasteRub: number;
  /** 0–100 стабильность прибыли/час */
  consistencyScore: number;
  /** Эволюция score vs прошлый период, текст */
  driverScoreEvolution: string;
  /** Подсказка по длинным сменам / просадке */
  fatigueHint: string;
  /** Слабые зоны одной строкой */
  weakZonesLabel: string;
  /** Импульс недели vs медиана */
  momentumInsight: string;
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const v = nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length;
  return Math.sqrt(v);
}

/**
 * Локальная «AI»-аналитика по завершённым сменам (без облака / LLM).
 */
export function computeDriverAnalytics(shifts: Shift[]): DriverAnalytics {
  if (shifts.length === 0) {
    return {
      efficiencyScore: 0,
      bestStartHours: [],
      bestHoursLabel: "Завершите смены — появится персональное окно по часам.",
      fuelWasteHint: "",
      weeklyTip: "Стартуйте смену с заполненного профиля — так точнее расчёт топлива.",
      shiftQualityAvg: 0,
      medianProfitPerHour: 0,
      lastTenAvgProfitPerHour: 0,
      routeEfficiencyScore: 0,
      fuelTrend: "flat",
      fuelTrendLabel: "Недостаточно смен для тренда топлива.",
      estimatedFuelWasteRub: 0,
      consistencyScore: 0,
      driverScoreEvolution: "Накопите историю — покажем динамику Driver score.",
      fatigueHint: "",
      weakZonesLabel: "",
      momentumInsight: "",
    };
  }

  const pph = shifts.map((s) => s.profitPerHour);
  const med = median(pph);
  const lastN = shifts.slice(0, Math.min(10, shifts.length));
  const lastAvg = lastN.reduce((a, s) => a + s.profitPerHour, 0) / lastN.length;

  const hourWeight = new Array(24).fill(0);
  const hourProfit = new Array(24).fill(0);
  for (const s of shifts) {
    const h = new Date(s.startedAt).getHours();
    const w = Math.max(s.durationMs / 3_600_000, 0.25);
    hourWeight[h] += w;
    hourProfit[h] += s.profitPerHour * w;
  }
  const scored = hourWeight
    .map((w, h) => ({
      h,
      score: w > 0 ? hourProfit[h]! / w : 0,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const bestStartHours = scored.slice(0, 3).map((x) => x.h);
  const bestHoursLabel =
    bestStartHours.length >= 2
      ? `Сильнее всего по прибыли/час старты около ${bestStartHours.map((h) => `${h}:00`).join(", ")} — попробуйте сместить выход в эти окна.`
      : "Накопите ещё смен с разным временем старта — выделим лучшие часы.";

  const fuelPerH = shifts.map((s) => s.fuelCostTotal / Math.max(s.durationMs / 3_600_000, 0.25));
  const medFuel = median(fuelPerH);
  const lastFuel = fuelPerH[0] ?? 0;
  let fuelWasteHint = "";
  if (medFuel > 0 && lastFuel > medFuel * 1.15) {
    fuelWasteHint =
      "Последняя смена: топливо на час заметно выше вашей медианы — проверьте простой и долю км на газу.";
  } else if (medFuel > 0 && lastFuel < medFuel * 0.85) {
    fuelWasteHint = "Топливо на час ниже обычного — хороший темп, закрепите маршрут и время выхода.";
  } else {
    fuelWasteHint = "Расход топлива на час в норме относительно ваших последних смен.";
  }

  let weeklyTip = "Держите смены 6+ ч — стабильнее профиль для сравнения по часам.";
  if (lastAvg > med * 1.08) {
    weeklyTip = "Последние смены сильнее медианы по прибыли/ч — хороший ритм, не перегоняйте простой.";
  } else if (lastAvg < med * 0.92) {
    weeklyTip = "Ниже привычной прибыли/ч — попробуйте сдвиг старта на ваши «сильные» часы или проверьте топливо.";
  }

  const qualityScores = shifts.map((s) => {
    const fuelRatio = s.income > 0 ? s.fuelCostTotal / s.income : 1;
    const p = Math.min(100, (s.profitPerHour / Math.max(med, 1)) * 45 + (1 - Math.min(fuelRatio, 0.5)) * 55);
    return Math.round(Math.max(0, Math.min(100, p)));
  });
  const shiftQualityAvg =
    qualityScores.reduce((a, b) => a + b, 0) / Math.max(qualityScores.length, 1);

  const rel = med > 0 ? lastAvg / med : 1;
  const fuelRel = medFuel > 0 && lastFuel > 0 ? medFuel / lastFuel : 1;
  const efficiencyScore = Math.round(
    Math.max(0, Math.min(100, shiftQualityAvg * 0.55 + rel * 25 + Math.min(fuelRel, 1.3) * 20)),
  );

  const last = shifts[0]!;
  const ppk = shifts.map((s) => s.profitPerKm);
  const medPpk = median(ppk);
  const routeEfficiencyScore = Math.round(
    medPpk > 0
      ? Math.max(0, Math.min(100, (last.profitPerKm / medPpk) * 70 + 15))
      : 55,
  );

  const recentFuelSlice = fuelPerH.slice(0, 5);
  const olderFuelSlice = fuelPerH.slice(5, 10);
  const avgRecentFuel = recentFuelSlice.length
    ? recentFuelSlice.reduce((a, b) => a + b, 0) / recentFuelSlice.length
    : lastFuel;
  const avgOlderFuel = olderFuelSlice.length
    ? olderFuelSlice.reduce((a, b) => a + b, 0) / olderFuelSlice.length
    : avgRecentFuel;
  let fuelTrend: "up" | "down" | "flat" = "flat";
  let fuelTrendLabel = "Добавьте ещё смен — сравним тренд топлива.";
  if (olderFuelSlice.length >= 2) {
    if (avgRecentFuel > avgOlderFuel * 1.08) {
      fuelTrend = "up";
      fuelTrendLabel = "Топливо на час растёт относительно предыдущих смен.";
    } else if (avgRecentFuel < avgOlderFuel * 0.92) {
      fuelTrend = "down";
      fuelTrendLabel = "Топливо на час снижается — хороший знак для маржи.";
    } else {
      fuelTrendLabel = "Топливо на час держится в привычном коридоре.";
    }
  }

  const lastDurH = Math.max(last.durationMs / 3_600_000, 0.25);
  const estimatedFuelWasteRub =
    medFuel > 0 && lastFuel > medFuel
      ? Math.max(0, (lastFuel - medFuel) * lastDurH)
      : 0;

  const recentPph = shifts.slice(0, 10).map((s) => s.profitPerHour);
  const pphSd = stdev(recentPph);
  const consistencyScore = Math.round(
    Math.max(0, Math.min(100, 100 - (pphSd / Math.max(med * 0.14, 12)) * 38)),
  );

  let driverScoreEvolution = "Driver score стабилен относительно медианы.";
  if (efficiencyScore >= shiftQualityAvg + 6) {
    driverScoreEvolution = "Driver score растёт — вы в позитивном импульсе.";
  } else if (efficiencyScore <= shiftQualityAvg - 8) {
    driverScoreEvolution = "Driver score просел vs вашу среднюю — пересоберите окно выхода.";
  }

  let fatigueHint = "";
  if (last.durationMs > 10 * 3_600_000 && last.profitPerHour < med * 0.88) {
    fatigueHint =
      "Длинная смена с просадкой прибыли/ч — планируйте паузы и сон между выходами.";
  } else if (last.durationMs > 12 * 3_600_000) {
    fatigueHint = "12+ часов в линии — высокий риск ошибок и простоя; разбейте на блоки.";
  }

  let weakZonesLabel = "Слабых зон не выявлено — держите курс.";
  if (lastFuel > medFuel * 1.12 && lastAvg < med * 0.95) {
    weakZonesLabel = "Топливо + низкая прибыль/ч — проверьте газ и время простоя.";
  } else if (lastAvg < med * 0.9) {
    weakZonesLabel = "Прибыль/ч ниже вашей нормы — сместите старт на сильные часы.";
  } else if (last.income > 0 && last.fuelCostTotal / last.income > 0.38) {
    weakZonesLabel = "Доля топлива в выручке высокая — маршрут и тип топлива.";
  }

  let momentumInsight = "Моментум нейтральный.";
  if (lastAvg > med * 1.06) {
    momentumInsight = "Недельный моментум вверх — закрепляйте текущий паттерн.";
  } else if (lastAvg < med * 0.94) {
    momentumInsight = "Моментум вниз — смените окно или сократите холостой прогон.";
  }

  return {
    efficiencyScore,
    bestStartHours,
    bestHoursLabel,
    fuelWasteHint,
    weeklyTip,
    shiftQualityAvg,
    medianProfitPerHour: med,
    lastTenAvgProfitPerHour: lastAvg,
    routeEfficiencyScore,
    fuelTrend,
    fuelTrendLabel,
    estimatedFuelWasteRub,
    consistencyScore,
    driverScoreEvolution,
    fatigueHint,
    weakZonesLabel,
    momentumInsight,
  };
}
