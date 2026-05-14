import type { Metadata } from "next";
import Link from "next/link";
import { AionWebEntity } from "@/components/AionWebEntity";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness } from "@/lib/readiness";
import { fetchPublishedRollouts } from "@/lib/ecosystem/cloud-queries";
import { isPortalSupabaseConfigured } from "@/lib/env/portal-env";

export const metadata: Metadata = {
  title: "AION Control — центр управления экосистемой",
  description: "Сводка состояния; публичные снимки и rollout из Supabase при настроенных ключах.",
};

export default async function ControlPage() {
  const eco = await getEcosystemStatus();
  const avg = averageReadiness(eco.readiness);

  const rollouts = await fetchPublishedRollouts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-white md:text-4xl">Control center</h1>
      <p className="mt-4 max-w-3xl text-slate-400">
        Операционный слой AION: устройства, релизы, OTA/APK, диагностика синка. Данные roadmap/релизов подмешиваются из{" "}
        <strong className="text-slate-200">Supabase</strong>, если заданы{" "}
        <span className="font-mono text-xs text-slate-500">NEXT_PUBLIC_SUPABASE_*</span> и есть публичные строки в
        таблицах; иначе — JSON из репозитория. Realtime на снимках `ecosystem_public_snapshots` обновляет страницу.
      </p>

      {!isPortalSupabaseConfigured() ? (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100/90">
          Облако не подключено к этому деплою: задайте URL и anon key в Vercel (см. DEPLOY.md).
        </p>
      ) : null}

      <div className="mt-12 flex flex-col items-start gap-10 md:flex-row md:items-center">
        <AionWebEntity readinessAvg={avg} />
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
            Аккаунт: вход на портале и приватные device feeds — следующий этап (RLS уже на таблицах устройств).
          </div>
          <p className="text-sm text-slate-500">
            Пока используйте диагностику внутри AION Driver и раздел{" "}
            <Link href="/releases" className="text-cyan-400 hover:underline">
              Релизы
            </Link>{" "}
            здесь.
          </p>
        </div>
      </div>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(eco.readiness).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{k}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{v}%</p>
          </div>
        ))}
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
