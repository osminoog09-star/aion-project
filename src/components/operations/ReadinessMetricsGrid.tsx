import type { ProjectReadinessMetrics } from "@/lib/operations/owner-command-center";
import { ReadinessRing } from "./ReadinessRing";

const METRICS: { key: keyof ProjectReadinessMetrics; label: string; icon: string }[] = [
  { key: "mvpPercent", label: "Готовность MVP", icon: "🎯" },
  { key: "productionPercent", label: "Сайт production", icon: "🌐" },
  { key: "runtimeStabilityPercent", label: "Стабильность runtime", icon: "⚙️" },
  { key: "driverIntelligencePercent", label: "Интеллект водителя", icon: "🧠" },
  { key: "ecosystemMaturityPercent", label: "Зрелость экосистемы", icon: "✨" },
];

export function ReadinessMetricsGrid({ metrics }: { metrics: ProjectReadinessMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {METRICS.map(({ key, label, icon }) => (
        <div
          key={key}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-5"
        >
          <span className="text-xl">{icon}</span>
          <ReadinessRing percent={metrics[key]} size={88} />
          <p className="mt-2 text-center text-[11px] font-medium leading-snug text-slate-300">{label}</p>
        </div>
      ))}
    </div>
  );
}
