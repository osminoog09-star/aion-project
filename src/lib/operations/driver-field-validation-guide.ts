/** Статический чеклист — зеркало `aion-driver` computeRouteFieldValidation (owner device gate). */
export type DriverFieldValidationGuideStep = {
  id: string;
  labelRu: string;
  actionRu: string;
};

export const DRIVER_FIELD_VALIDATION_STEPS: DriverFieldValidationGuideStep[] = [
  {
    id: "gps-sessions",
    labelRu: "Есть GPS-смены",
    actionRu: "Смена → 5+ км с GPS → завершить → Маршруты",
  },
  {
    id: "analytics-coverage",
    labelRu: "Покрытие снимками аналитики (≥50%)",
    actionRu: "Ещё 1–2 GPS-смены или pull-to-refresh на Маршрутах",
  },
  {
    id: "backfill-ran",
    labelRu: "Backfill отработал",
    actionRu: "Потянуть экран вниз на Маршрутах",
  },
  {
    id: "historical-rollups",
    labelRu: "Исторические rollups (≥2 снимка)",
    actionRu: "≥2 завершённые смены со снимком аналитики",
  },
  {
    id: "stop-observations",
    labelRu: "Данные для stop-zone (≥5 наблюдений)",
    actionRu: "Больше остановок ≥3 мин в реальных сменах",
  },
  {
    id: "stop-insights",
    labelRu: "Stop-zone insights",
    actionRu: "1–2 смены с повторяющимися зонами остановок",
  },
  {
    id: "fgs-heartbeat",
    labelRu: "FGS heartbeat (фон, <5 мин)",
    actionRu: "Активная смена → свернуть Driver 2–3 мин → Маршруты",
  },
  {
    id: "bg-merge-state",
    labelRu: "Headless merge state (Android)",
    actionRu: "Смена с FGS + точка GPS в фоне",
  },
];

export const DRIVER_FIELD_VALIDATION_APP_PATH =
  "AION Driver → Главная → «Маршруты GPS · чеклист 8/8»";
