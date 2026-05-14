import type { Metadata } from "next";
import Link from "next/link";
import { AionWebEntity } from "@/components/AionWebEntity";
import { OperationsDashboard, ReadinessPillarGrid } from "@/components/ecosystem/EcosystemAuditViews";
import { OperationsHub } from "@/components/operations/OperationsHub";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { getOperationsHubView } from "@/lib/operations-hub-data";
import { averageReadiness } from "@/lib/readiness";
import { fetchPublishedRollouts } from "@/lib/ecosystem/cloud-queries";
import { isPortalSupabaseConfigured } from "@/lib/env/portal-env";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "AION Operations Hub — control",
  description: "Единый центр: APK, OTA, релизы, roadmap, облако, rollout; публичные данные + Supabase.",
};

export default async function ControlPage() {
  const [eco, hub, rollouts] = await Promise.all([
    getEcosystemStatus(),
    getOperationsHubView(),
    fetchPublishedRollouts(),
  ]);
  const avg = averageReadiness(eco.readiness);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-white md:text-4xl">Operations Hub</h1>
      <p className="mt-4 max-w-3xl text-slate-400">
        Один экран для APK, OTA, релизов, roadmap и здоровья инфраструктуры. Данные собираются из манифеста,{" "}
        <span className="font-mono text-xs text-slate-500">releases.json</span>, roadmap JSON и (если настроено)
        Supabase. Детальная таблица подсистем:{" "}
        <Link href={ecosystemRoutes.status} className="text-cyan-400 hover:underline">
          /status
        </Link>
        .
      </p>

      {!isPortalSupabaseConfigured() ? (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100/90">
          Облако не подключено: задайте <span className="font-mono">NEXT_PUBLIC_SUPABASE_*</span> для live snapshots и
          rollout (см. DEPLOY.md).
        </p>
      ) : null}

      <div className="mt-10">
        <OperationsHub view={hub} variant="full" />
      </div>

      <div className="mt-14 flex flex-col items-start gap-10 md:flex-row md:items-center">
        <AionWebEntity readinessAvg={avg} />
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
            Устройства: списки online/outdated и пары — только после входа (RLS). Публичный хаб не подменяет приватные
            данные.
          </div>
          <p className="text-sm text-slate-500">
            Релизы: <Link href={ecosystemRoutes.releases} className="text-cyan-400 hover:underline">/releases</Link> ·
            исполнение: <Link href={ecosystemRoutes.operations} className="text-cyan-400 hover:underline">/operations</Link>
          </p>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">Все строки operations (roadmap)</h2>
        <p className="mt-2 max-w-3xl text-xs text-slate-500">Расширенная сетка из ecosystem JSON / snapshot.</p>
        <div className="mt-6">
          <OperationsDashboard rows={eco.operations ?? []} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Готовность направлений</h2>
        <div className="mt-6">
          <ReadinessPillarGrid readiness={eco.readiness} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400/90">Публичные rollout (Supabase)</h2>
        {rollouts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Нет строк с <span className="font-mono">visible_public = true</span> в{" "}
            <span className="font-mono">ecosystem_rollout_state</span>.
          </p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {rollouts.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-xs">
                {r.channel} · {r.rollout_status} · {r.cohort_percentage}% · {r.updated_at}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
