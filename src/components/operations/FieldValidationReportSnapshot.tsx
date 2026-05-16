import { getLocalFieldValidationReport } from "@/lib/operations/field-validation-report";

export function FieldValidationReportSnapshot() {
  const r = getLocalFieldValidationReport();
  if (!r.submittedAt) return null;

  return (
    <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
      <span className="text-slate-500">Отчёт с устройства (git snapshot): </span>
      <span className={r.ready ? "font-medium text-emerald-300" : "font-medium text-amber-300"}>
        {r.ready ? "8/8" : `${r.passedCount ?? "?"}/${r.totalCount}`}
      </span>
      <span className="text-slate-500"> · {new Date(r.submittedAt).toLocaleString("ru-RU")}</span>
    </p>
  );
}
