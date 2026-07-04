import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OcrImportRecord, OcrParseResult } from "../../features/import/types";
import { STORAGE_KEYS } from "../core/keys";

function migrateParse(p: OcrParseResult): OcrParseResult {
  if (Array.isArray(p.trips)) return p;
  return {
    ...p,
    trips: [],
    globalConfidence: p.globalConfidence ?? p.confidence ?? 0,
    needsEditMode: p.needsEditMode ?? true,
    analytics: p.analytics ?? null,
  };
}

function migrateRecord(r: OcrImportRecord): OcrImportRecord {
  return {
    ...r,
    shiftId: typeof r.shiftId === "string" ? r.shiftId : undefined,
    queueItemId: typeof r.queueItemId === "string" ? r.queueItemId : undefined,
    parse: migrateParse(r.parse),
  };
}

function safeParse(raw: string | null): OcrImportRecord[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x) =>
          x &&
          typeof x === "object" &&
          typeof (x as OcrImportRecord).id === "string" &&
          typeof (x as OcrImportRecord).createdAt === "string",
      )
      .map((x) => migrateRecord(x as OcrImportRecord));
  } catch {
    return [];
  }
}

export async function loadOcrImports(): Promise<OcrImportRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.OCR_IMPORTS);
  return safeParse(raw);
}

// Сериализация записей OCR-импортов: append делает read-modify-write,
// два одновременных append без неё теряют запись.
let serialized: Promise<unknown> = Promise.resolve();

function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = serialized.then(fn, fn);
  serialized = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function appendOcrImport(record: OcrImportRecord): Promise<void> {
  return runSerialized(async () => {
    const cur = await loadOcrImports();
    let base = cur.filter((x) => x.id !== record.id);
    if (record.sourceUri) {
      base = base.filter((x) => x.sourceUri !== record.sourceUri);
    }
    const next = [record, ...base].slice(0, 200);
    await AsyncStorage.setItem(STORAGE_KEYS.OCR_IMPORTS, JSON.stringify(next));
  });
}
