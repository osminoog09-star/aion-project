import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import type { OcrImportRecord } from "../import/types";
import type { Shift } from "../../types";
import { loadOcrImports } from "../../storage/driver/ocrImportStorage";
import {
  listAionTimeline,
  type AionTimelineEvent,
} from "../../storage/core/aionTimelineStorage";

export type TimelineEntry =
  | { kind: "shift"; id: string; at: string; shift: Shift }
  | { kind: "ocr"; id: string; at: string; record: OcrImportRecord }
  | { kind: "aion"; id: string; at: number; event: AionTimelineEvent };

function mergeTimeline(
  shifts: Shift[],
  ocr: OcrImportRecord[],
  aion: AionTimelineEvent[],
): TimelineEntry[] {
  const rows: TimelineEntry[] = [];
  for (const s of shifts) {
    rows.push({ kind: "shift", id: s.id, at: s.endedAt, shift: s });
  }
  for (const o of ocr) {
    rows.push({ kind: "ocr", id: o.id, at: o.createdAt, record: o });
  }
  for (const e of aion) {
    rows.push({ kind: "aion", id: e.id, at: e.at, event: e });
  }
  return rows.sort((a, b) => {
    const ta =
      a.kind === "aion" ? a.at : new Date(a.at).getTime();
    const tb =
      b.kind === "aion" ? b.at : new Date(b.at).getTime();
    return tb - ta;
  });
}

export function useTimelineEntries(shifts: Shift[]) {
  const [ocr, setOcr] = useState<OcrImportRecord[]>([]);
  const [aion, setAion] = useState<AionTimelineEvent[]>([]);

  const refresh = useCallback(async () => {
    const [o, core] = await Promise.all([
      loadOcrImports(),
      listAionTimeline(40),
    ]);
    setOcr(o);
    setAion(core);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => undefined;
    }, [refresh]),
  );

  const entries = useMemo(
    () => mergeTimeline(shifts, ocr, aion),
    [shifts, ocr, aion],
  );

  return { entries, refreshOcr: refresh };
}
