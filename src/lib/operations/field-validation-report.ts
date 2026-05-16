import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type OwnerFieldValidationReport = {
  version: string;
  lastUpdated: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  ready: boolean;
  passedCount: number | null;
  totalCount: number;
  reportText: string | null;
  source: "owner_paste" | "cursor" | null;
};

const REPORT_FILE = path.join(
  process.cwd(),
  "src/content/owner-field-validation-report.json",
);

export function getLocalFieldValidationReport(): OwnerFieldValidationReport {
  try {
    return JSON.parse(readFileSync(REPORT_FILE, "utf8")) as OwnerFieldValidationReport;
  } catch {
    return {
      version: "1.0",
      lastUpdated: null,
      submittedAt: null,
      submittedBy: null,
      ready: false,
      passedCount: null,
      totalCount: 8,
      reportText: null,
      source: null,
    };
  }
}

/** Парсит отчёт с устройства (formatFieldValidationReportRu). */
export function parseFieldValidationReport(text: string): {
  ready: boolean;
  passedCount: number | null;
  totalCount: number;
} {
  const header = text.split("\n")[0]?.trim() ?? "";
  const ready =
    /8\/8/i.test(header) ||
    /ГОТОВО/i.test(header) ||
    /FIELD VALIDATION:\s*ГОТОВО/i.test(text);
  const frac = header.match(/(\d+)\/(\d+)/);
  const passedCount = frac ? Number.parseInt(frac[1]!, 10) : ready ? 8 : null;
  const totalCount = frac ? Number.parseInt(frac[2]!, 10) : 8;
  return {
    ready: ready || (passedCount != null && passedCount >= 8),
    passedCount,
    totalCount,
  };
}

export function saveFieldValidationReport(input: {
  reportText: string;
  submittedBy?: string;
  source?: OwnerFieldValidationReport["source"];
}): OwnerFieldValidationReport {
  const parsed = parseFieldValidationReport(input.reportText);
  const now = new Date().toISOString();
  const doc: OwnerFieldValidationReport = {
    version: "1.0",
    lastUpdated: now,
    submittedAt: now,
    submittedBy: input.submittedBy ?? "owner",
    ready: parsed.ready,
    passedCount: parsed.passedCount,
    totalCount: parsed.totalCount,
    reportText: input.reportText.trim(),
    source: input.source ?? "owner_paste",
  };
  writeFileSync(REPORT_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  return doc;
}
