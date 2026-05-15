import {
  DRIVER_FIELD_VALIDATION_APP_PATH,
  DRIVER_FIELD_VALIDATION_STEPS,
} from "@/lib/operations/driver-field-validation-guide";

export function DriverFieldValidationOwnerGuide() {
  return (
    <section className="rounded-2xl border border-amber-500/35 bg-amber-500/8 px-5 py-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-300">
        Устройство владельца · field validation 8/8
      </p>
      <p className="mt-2 text-sm text-slate-300">
        Статус виден только в приложении. На портале — эталонный чеклист; после 8/8 — «Скопировать
        отчёт» и <span className="text-emerald-300">OTA smoke →</span> на экране Маршрутов.
      </p>
      <p className="mt-2 font-mono text-xs text-cyan-200/90">{DRIVER_FIELD_VALIDATION_APP_PATH}</p>
      <ol className="mt-4 space-y-3">
        {DRIVER_FIELD_VALIDATION_STEPS.map((step, i) => (
          <li key={step.id} className="flex gap-3 text-sm">
            <span className="shrink-0 font-mono text-xs text-slate-500">{i + 1}/8</span>
            <div>
              <p className="font-medium text-white">{step.labelRu}</p>
              <p className="mt-0.5 text-xs text-amber-200/80">→ {step.actionRu}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-slate-500">
        Background tracking production-ready остаётся <span className="text-rose-300/90">false</span>{" "}
        до 8/8 и подписи владельца.
      </p>
    </section>
  );
}
