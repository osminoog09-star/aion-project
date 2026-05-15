import type { Metadata } from "next";
import { loadExecutionAuditView, ConfidenceGrid, OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { ReadinessPillarGrid } from "@/components/ecosystem/EcosystemAuditViews";

export const metadata: Metadata = {
  title: "Runtime readiness — операции AION",
  description: "Готовность runtime, overlay, OCR, driver intelligence.",
};

const RUNTIME_SUBSYSTEM_IDS = [
  "mobile-app",
  "background-drive",
  "overlay-orb",
  "ocr-import",
  "driver-intelligence",
  "profit-engine",
  "cloud-sync",
];

export default async function OperationsRuntimePage() {
  const view = await loadExecutionAuditView();
  const runtimeRows = view.subsystemConfidence.filter((r) =>
    RUNTIME_SUBSYSTEM_IDS.some((id) => r.id.includes(id) || r.id === id),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400/90">Runtime</p>
      <h1 className="mt-3 text-3xl font-bold text-white">Runtime monitoring</h1>
      <p className="mt-3 text-sm text-slate-400">
        Уверенность по подсистемам, влияющим на always-on смену, overlay, OCR и прибыль. Без выдуманных метрик.
      </p>
      <OperationsSubNav />
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Направления (readiness)</h2>
        <div className="mt-4">
          <ReadinessPillarGrid readiness={view.eco.readiness} />
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Runtime-подсистемы</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {runtimeRows.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="font-semibold text-white">{r.name}</p>
              <p className="mt-1 text-xs text-slate-500">{r.note}</p>
              <p className="mt-2 text-[10px] uppercase text-cyan-300/80">confidence: {r.confidence}</p>
            </div>
          ))}
        </div>
      </section>
      <ConfidenceGrid view={view} />
    </div>
  );
}
