/** Текстовый инсайт с проверяемым evidence (без opaque score). */
export type StopZoneInsight = {
  text: string;
  evidence: string;
};

export type StopZonePatterns = {
  windowDays: number;
  sampleShifts: number;
  stopObservationCount: number;
  insights: StopZoneInsight[];
};
