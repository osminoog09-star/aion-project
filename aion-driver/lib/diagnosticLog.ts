import AsyncStorage from "@react-native-async-storage/async-storage";

const LOG_KEY = "@aion_driver/diagnostic_log_v1";
const MAX_ENTRIES = 250;

export type DiagnosticLevel = "info" | "warn" | "error";

export type DiagnosticEntry = {
  id: string;
  at: number;
  level: DiagnosticLevel;
  tag: string;
  message: string;
  data?: unknown;
};

let memory: DiagnosticEntry[] = [];
let persistChain: Promise<void> = Promise.resolve();

function newId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

async function persist(): Promise<void> {
  const slice = memory.slice(-MAX_ENTRIES);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(slice));
}

function schedulePersist(): void {
  persistChain = persistChain.then(() => persist()).catch(() => undefined);
}

function push(entry: DiagnosticEntry): void {
  memory.push(entry);
  if (memory.length > MAX_ENTRIES) {
    memory = memory.slice(-MAX_ENTRIES);
  }
  schedulePersist();
}

export async function initDiagnosticLog(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    if (!raw) {
      memory = [];
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    memory = Array.isArray(parsed)
      ? (parsed as DiagnosticEntry[]).slice(-MAX_ENTRIES)
      : [];
  } catch {
    memory = [];
  }
  push({
    id: newId(),
    at: Date.now(),
    level: "info",
    tag: "app",
    message: "Диагностический журнал загружен",
  });
}

export function diagLog(
  level: DiagnosticLevel,
  tag: string,
  message: string,
  data?: unknown,
): void {
  push({
    id: newId(),
    at: Date.now(),
    level,
    tag,
    message,
    data: data !== undefined ? sanitizeData(data) : undefined,
  });
}

function sanitizeData(data: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return String(data);
  }
}

export function getDiagnosticEntries(): DiagnosticEntry[] {
  return [...memory];
}

export async function clearDiagnosticLog(): Promise<void> {
  memory = [];
  await AsyncStorage.removeItem(LOG_KEY);
}

export function formatDiagnosticLogText(entries = memory): string {
  if (!entries.length) return "(журнал пуст)";
  return entries
    .slice(-120)
    .map((e) => {
      const t = new Date(e.at).toISOString().slice(11, 19);
      const extra = e.data != null ? ` ${JSON.stringify(e.data)}` : "";
      return `${t} [${e.level}] ${e.tag}: ${e.message}${extra}`;
    })
    .join("\n");
}
