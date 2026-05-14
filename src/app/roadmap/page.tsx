import type { Metadata } from "next";
import Link from "next/link";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness, averageSubsystemPercent } from "@/lib/readiness";
import {
  EcosystemSummaryHeader,
  MilestoneTimeline,
  ReadinessBar,
  ReadinessPillarGrid,
  ReleasePhaseStrip,
  StatusBadge,
} from "@/components/ecosystem/EcosystemAuditViews";
import { RoadmapHubLinks } from "@/components/ecosystem/MasterRoadmapPanels";
import type { EcosystemSubsystem } from "@/lib/ecosystem-types";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Roadmap — модульная платформа AION",
  description:
    "Живая дорожная карта экосистемы: фазы, вехи, готовность инфраструктуры и модулей; дашборды /ecosystem и /operations.",
};

function SubsystemRoadmapCard({ s }: { s: EcosystemSubsystem }) {
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">{s.name}</h3>
        <StatusBadge status={s.status} />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-cyan-200">{s.percent}%</p>
      <div className="mt-2">
        <ReadinessBar value={s.percent} />
      </div>
      {s.nextMilestone ? <p className="mt-3 text-[11px] text-slate-500">Дальше: {s.nextMilestone}</p> : null}
      <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">{s.note}</p>
      <Link href={ecosystemRoutes.status} className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-cyan-500/90 hover:underline">
        Детали в аудите →
      </Link>
    </div>
  );
}

export default async function RoadmapPage() {
  const eco = await getEcosystemStatus();
  const avgPillar = averageReadiness(eco.readiness);
  const avgSub = averageSubsystemPercent(eco.subsystems);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <EcosystemSummaryHeader eco={eco} />
      <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">Roadmap экосистемы</h1>
      <p className="mt-3 max-w-3xl text-slate-400">{eco.methodology}</p>
      <div className="mt-4">
        <RoadmapHubLinks />
      </div>

      <section className="mt-10 flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Направления Ø</p>
          <p className="text-2xl font-bold text-white">{avgPillar}%</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Подсистемы Ø</p>
          <p className="text-2xl font-bold text-violet-200">{avgSub}%</p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Текущий фокус</h2>
        <p className="mt-2 text-lg font-semibold text-white">{eco.sprint.label}</p>
        <p className="mt-1 text-slate-400">{eco.sprint.focus}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400/90">Фазы</h2>
        <div className="mt-4">
          <ReleasePhaseStrip phases={eco.releasePhases ?? []} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Вехи</h2>
        <div className="mt-4">
          <MilestoneTimeline milestones={eco.milestones ?? []} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Готовность направлений</h2>
        <div className="mt-6">
          <ReadinessPillarGrid readiness={eco.readiness} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Подсистемы (карточки)</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eco.subsystems.map((s) => (
            <SubsystemRoadmapCard key={s.id} s={s} />
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/90">Активные эпики</h3>
          <ul className="mt-3 list-inside list-disc text-slate-400">
            {eco.epics.active.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Завершённые вехи</h3>
          <ul className="mt-3 list-inside list-disc text-slate-500">
            {eco.epics.completed.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
