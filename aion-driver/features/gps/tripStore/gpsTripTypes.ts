/** Источник точки — для dedupe и waterline. */
export type GpsPointSource = "foreground" | "headless" | "restore";

/** Компактная точка маршрута (реальный GPS, без интерполяции). */
export type GpsTripPointRecord = {
  t: number;
  lat: number;
  lng: number;
  acc?: number;
  dM?: number;
  src?: GpsPointSource;
  seq?: number;
};

export type GpsStopPoint = {
  lat: number;
  lng: number;
  startedAtMs: number;
  endedAtMs: number;
  durationMs: number;
};

export type RouteBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** Упрощённая геометрия для UI (не полный raw stream). */
export type RoutePathPreview = {
  lat: number;
  lng: number;
}[];

export type RouteSessionSummary = {
  distanceMeters: number;
  durationMs: number;
  movingMs: number;
  idleMs: number;
  idleRatio: number;
  stopCount: number;
  stopDurationMs: number;
  pointCount: number;
  bounds: RouteBounds | null;
  pathPreview: RoutePathPreview;
};

export type GpsIngestionMeta = {
  headlessWaterlineMs: number;
  lastSeq: number;
  lastForegroundTs?: number;
};

export type ShiftGpsSession = {
  shiftId: string;
  startedAtMs: number;
  endedAtMs?: number;
  points: GpsTripPointRecord[];
  stops: GpsStopPoint[];
  pointCount: number;
  truncated?: boolean;
  ingestion?: GpsIngestionMeta;
  routeSummary?: RouteSessionSummary;
};

export type ShiftGpsSummary = {
  shiftId: string;
  pointCount: number;
  stopCount: number;
  distanceMetersFromPoints: number;
  routeSummary?: RouteSessionSummary;
};
