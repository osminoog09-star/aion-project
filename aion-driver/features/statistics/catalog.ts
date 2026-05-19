import type { StatElementDescriptor, StatElementId } from "./types";

export const STAT_ELEMENT_CATALOG: StatElementDescriptor[] = [
  {
    id: "shifts_today",
    group: "shifts",
    title: "Смены за сегодня",
    description: "Завершённые смены, закончившиеся с 00:00 сегодня. График дня на главной.",
    blockedWhenActiveShift: true,
  },
  {
    id: "shifts_7d",
    group: "shifts",
    title: "Смены за 7 дней",
    description: "Недельная прибыль, спарк-линия и аналитика за последние 7 суток.",
    blockedWhenActiveShift: true,
  },
  {
    id: "shifts_30d",
    group: "shifts",
    title: "Смены за 30 дней",
    description: "Месячные итоги и rollups на маршрутах.",
    blockedWhenActiveShift: true,
  },
  {
    id: "shifts_all",
    group: "shifts",
    title: "Вся история смен",
    description: "Все завершённые смены локально. Профиль и настройки не затрагиваются.",
    blockedWhenActiveShift: true,
  },
  {
    id: "gps_all",
    group: "tracks",
    title: "GPS-треки всех смен",
    description: "Сохранённые точки и остановки на карте / timeline.",
  },
  {
    id: "gps_orphan",
    group: "tracks",
    title: "GPS без смены",
    description: "Треки, у которых уже нет записи в истории смен.",
  },
  {
    id: "analytics_all",
    group: "tracks",
    title: "Аналитика смен",
    description: "Post-shift снимки (эффективность, остановки) — пересчитаются при новых сменах.",
  },
  {
    id: "pending_fuel",
    group: "imports",
    title: "Заправки вне смены",
    description: "Очередь заправок, добавленных без активной смены.",
  },
  {
    id: "ocr",
    group: "imports",
    title: "OCR-импорты",
    description: "История скриншотов и очередь разбора выплат.",
  },
  {
    id: "timeline",
    group: "system",
    title: "Лента AION",
    description: "События на главной (рекомендации, OTA, завершения смен).",
  },
  {
    id: "post_shift_handoff",
    group: "system",
    title: "Итог последней смены",
    description: "Баннер «смена завершена» с кратким итогом.",
    blockedWhenActiveShift: true,
  },
  {
    id: "sync_queue",
    group: "system",
    title: "Очередь синхронизации",
    description: "Несинхронизированные операции в офлайн-очереди.",
  },
  {
    id: "cloud_trips",
    group: "cloud",
    title: "Смены в облаке",
    description: "Записи trips в Supabase для этого аккаунта.",
    requiresCloud: true,
    blockedWhenActiveShift: true,
  },
  {
    id: "active_shift",
    group: "shifts",
    title: "Текущая смена",
    description: "Прервать и удалить незавершённую смену без сохранения в историю.",
  },
  {
    id: "everything_local",
    group: "system",
    title: "Всё локально",
    description: "Полный сброс: смены, треки, OCR, лента, заправки вне смены.",
    blockedWhenActiveShift: true,
  },
];

export function catalogEntry(id: StatElementId): StatElementDescriptor {
  const e = STAT_ELEMENT_CATALOG.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown stat element: ${id}`);
  return e;
}

export const STAT_GROUP_LABELS: Record<string, string> = {
  shifts: "Смены и прибыль",
  tracks: "Маршруты и аналитика",
  imports: "Импорт и заправки",
  system: "Система",
  cloud: "Облако",
};
