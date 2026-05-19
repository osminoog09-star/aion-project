/** Идентификатор сбрасываемого блока статистики / данных. */
export type StatElementId =
  | "shifts_all"
  | "shifts_today"
  | "shifts_7d"
  | "shifts_30d"
  | "shift_one"
  | "gps_all"
  | "gps_orphan"
  | "analytics_all"
  | "pending_fuel"
  | "ocr"
  | "timeline"
  | "post_shift_handoff"
  | "sync_queue"
  | "cloud_trips"
  | "active_shift"
  | "everything_local";

export type StatPeriod = "today" | "7d" | "30d";

export type StatResetTarget =
  | { id: Exclude<StatElementId, "shift_one"> }
  | { id: "shift_one"; shiftId: string };

export type StatElementGroup = "shifts" | "tracks" | "imports" | "system" | "cloud";

export type StatElementDescriptor = {
  id: StatElementId;
  group: StatElementGroup;
  title: string;
  description: string;
  /** Нужен вход в Supabase. */
  requiresCloud?: boolean;
  /** Нельзя сбросить при активной смене (кроме active_shift с подтверждением). */
  blockedWhenActiveShift?: boolean;
};

export type StatElementInventoryItem = StatElementDescriptor & {
  count: number;
  preview: string;
  empty: boolean;
};

export type StatShiftRow = {
  id: string;
  endedAt: string;
  netProfit: number;
  distanceKm: number;
  label: string;
};

export type StatisticsInventory = {
  elements: StatElementInventoryItem[];
  recentShifts: StatShiftRow[];
  hasActiveShift: boolean;
};

export type StatResetResult = {
  ok: boolean;
  error?: string;
  message?: string;
  affected?: number;
};
