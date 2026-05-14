import type { Metadata } from "next";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness, averageSubsystemPercent } from "@/lib/readiness";
import { MilestoneTimeline, ReadinessPillarGrid, ReleasePhaseStrip } from "@/components/ecosystem/EcosystemAuditViews";
import { RoadmapHubLinks, SubsystemMasterCard, VisionPanel } from "@/components/ecosystem/MasterRoadmapPanels";

export const metadata: Metadata = {
  title: "Ecosystem — живой центр AION",
  description: "Видение, подсистемы, готовность и фазы экосистемы AION на aion.com.",
};

export default async function EcosystemPage() {
  const eco = await getEcosystemStatus();
  const pillar = averageReadiness(eco.readiness);
  const subAvg = averageSubsystemPercent(eco.subsystems);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-400/90">Live dashboard</p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Экосистема</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{eco.methodology}</p>
      <div className="mt-4">
        <RoadmapHubLinks />
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Направления Ø</p>
          <p className="text-2xl font-bold text-cyan-200">{pillar}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Подсистемы Ø</p>
          <p className="text-2xl font-bold text-violet-200">{subAvg}%</p>
        </div>
      </div>

      {eco.vision ? (
        <div className="mt-10">
          <VisionPanel vision={eco.vision} />
        </div>
      ) : null}

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Фазы релиза</h2>
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
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Подсистемы (карточки)</h2>
        <p className="mt-2 text-xs text-slate-600">
          Профили расширения из roadmap-subsystem-extensions.json; cloud overlay: kind{" "}
          <span className="font-mono">portal_roadmap_master</span>.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eco.subsystems.map((s) => (
            <SubsystemMasterCard key={s.id} s={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
