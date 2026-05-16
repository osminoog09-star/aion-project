import type { Metadata } from "next";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { OperationalGovernancePanel } from "@/components/operations/OperationalGovernancePanel";

export const metadata: Metadata = {
  title: "Engineering Governance — AION Operations",
  description:
    "Unified operational dashboard: runtime health, release intelligence, APK compatibility, stale detection, event stream.",
};

export default function OperationsGovernancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
      <OperationsSubNav />
      <header className="mt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400/80">
          System reliability layer
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Engineering governance</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Единая панель: release intelligence, runtime activation gates, heartbeat stale protection,
          SAFE MODE и append-only event stream. Обновление каждые 10 с.
        </p>
      </header>
      <div className="mt-10">
        <OperationalGovernancePanel />
      </div>
    </div>
  );
}
