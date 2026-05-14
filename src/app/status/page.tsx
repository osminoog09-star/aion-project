import type { Metadata } from "next";
import Link from "next/link";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness, averageSubsystemPercent } from "@/lib/readiness";
import {
  DefinitionOfDoneCallout,
  EcosystemSummaryHeader,
  MilestoneTimeline,
  OperationsDashboard,
  ReadinessPillarGrid,
  ReleasePhaseStrip,
  SubsystemAuditTable,
  TechnicalDebtBoard,
} from "@/components/ecosystem/EcosystemAuditViews";

export const metadata: Metadata = {
  title: "Статус экосистемы — аудит AION",
  description: "Честная сводка подсистем, операций, техдолга и фаз релиза; данные из JSON репозитория и публичных снимков Supabase.",
};

export default async function EcosystemStatusPage() {
  const eco = await getEcosystemStatus();
  const pillarAvg = averageReadiness(eco.readiness);
  const subsystemAvg = averageSubsystemPercent(eco.subsystems);
  const operations = eco.operations ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <EcosystemSummaryHeader eco={eco} />
      <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">Статус экосистемы</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">{eco.methodology}</p>

      <div className="mt-8 flex flex-wrap gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Направления (среднее)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-cyan-300">{pillarAvg}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Подсистемы (среднее)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-violet-300">{subsystemAvg}%</p>
          <p className="mt-1 max-w-xs text-[10px] text-slate-600">Отдельно от столбцов readiness — см. таблицу ниже.</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-600">
        Дорожная карта: <Link href="/roadmap" className="text-cyan-400 hover:underline">/roadmap</Link> · Control:{" "}
        <Link href="/control" className="text-cyan-400 hover:underline">/control</Link>
      </p>

      {eco.definitionOfDone?.length ? (
        <div className="mt-10">
          <DefinitionOfDoneCallout lines={eco.definitionOfDone} />
        </div>
      ) : null}

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Фазы релиза</h2>
        <div className="mt-4">
          <ReleasePhaseStrip phases={eco.releasePhases ?? []} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400/90">Операционное здоровье</h2>
        <p className="mt-2 max-w-3xl text-xs text-slate-500">
          OTA, APK, синк, облако, realtime, Link, OCR, деплой — отдельно от «подсистем продукта», чтобы ops не терялись в длинной таблице.
        </p>
        <div className="mt-6">
          <OperationsDashboard rows={operations} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Готовность направлений</h2>
        <div className="mt-6">
          <ReadinessPillarGrid readiness={eco.readiness} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-rose-300/80">Технический долг</h2>
        <div className="mt-4">
          <TechnicalDebtBoard items={eco.technicalDebt ?? []} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Полный аудит подсистем</h2>
        <p className="mt-2 text-xs text-slate-600">M / W / B — оценка по mobile / web / backend внутри строки (0 — не применимо).</p>
        <div className="mt-4">
          <SubsystemAuditTable subsystems={eco.subsystems} />
        </div>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Вехи</h2>
          <div className="mt-4">
            <MilestoneTimeline milestones={eco.milestones ?? []} />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400/90">Активные эпики</h2>
          <ul className="mt-3 list-inside list-disc text-sm text-slate-400">
            {eco.epics.active.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-600">Завершённые</h3>
          <ul className="mt-3 list-inside list-disc text-sm text-slate-600">
            {eco.epics.completed.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
