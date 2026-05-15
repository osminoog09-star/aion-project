import Link from "next/link";
import type { OwnerCommandCenterView } from "@/lib/operations/owner-command-center";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { ReadinessRing } from "./ReadinessRing";
import { SubsystemBlockCard } from "./SubsystemBlockCard";
import { LiveExecutionPanel } from "./LiveExecutionPanel";

function TaskQueue({ items }: { items: OwnerCommandCenterView["taskQueue"] }) {
  const statusStyle = {
    active: "border-cyan-400/50 bg-cyan-500/10 text-cyan-100",
    next: "border-violet-400/40 bg-violet-500/10 text-violet-100",
    queued: "border-white/10 bg-white/[0.02] text-slate-400",
    blocked: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  };
  const statusLabel = {
    active: "Сейчас",
    next: "Далее",
    queued: "В очереди",
    blocked: "Блок",
  };
  return (
    <ol className="space-y-2">
      {items.map((t) => (
        <li
          key={t.order}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${statusStyle[t.status]}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm font-bold">
            {t.order}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              {statusLabel[t.status]}
            </p>
            <p className="mt-0.5 text-sm font-medium">{t.titleRu}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function HealthStrip({ health }: { health: OwnerCommandCenterView["health"] }) {
  const rows = [
    { icon: "🌐", label: "Production", value: health.productionRu },
    { icon: "🚀", label: "Деплой", value: health.deploymentRu },
    { icon: "⚙️", label: "Runtime", value: health.runtimeRu },
    { icon: "🤖", label: "AI", value: health.aiExecutionRu },
    { icon: "✅", label: "Валидация", value: health.validationRu },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-3"
        >
          <p className="text-lg">{row.icon}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {row.label}
          </p>
          <p className="mt-1 text-xs leading-snug text-slate-300">{row.value}</p>
        </div>
      ))}
    </div>
  );
}

function NarrationStream({
  items,
}: {
  items: OwnerCommandCenterView["narration"];
}) {
  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {items.map((n) => (
        <li
          key={`${n.at}-${n.title}`}
          className="rounded-lg border border-white/5 bg-black/30 px-3 py-2"
        >
          <p className="text-sm font-medium text-white">
            {n.icon} {n.title}
          </p>
          <p className="mt-1 text-xs text-slate-400">{n.explanation}</p>
          <p className="mt-0.5 text-xs text-emerald-300/80">{n.result}</p>
        </li>
      ))}
    </ul>
  );
}

export function OwnerCommandCenter({ view }: { view: OwnerCommandCenterView }) {
  return (
    <div className="space-y-12">
      {/* Hero command strip */}
      <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-950 to-violet-950/30 p-6 md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400/90">
          AION · Центр управления AI
        </p>
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <ReadinessRing percent={view.overallReadinessPercent} size={140} label="готовность" />
            <div>
              <p className="text-2xl font-bold text-white md:text-3xl">{view.aiActivityRu}</p>
              <p className="mt-2 text-sm text-slate-300">
                Подсистема: <span className="text-cyan-200">{view.activeSubsystemRu}</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Уверенность AI: <span className="font-semibold text-violet-200">{view.confidencePercent}%</span>
                {view.retryCount > 0 ? (
                  <span className="ml-2 text-amber-300">· попыток: {view.retryCount}</span>
                ) : null}
              </p>
              <p className="mt-3 text-sm text-cyan-100/90">
                <span className="text-slate-500">Следующее: </span>
                {view.nextActionRu}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-xs lg:flex-col">
            <Link
              href={ecosystemRoutes.operationsLive}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-center text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"
            >
              Живое исполнение →
            </Link>
            <Link
              href={ecosystemRoutes.operationsPriorities}
              className="rounded-xl border border-white/15 px-4 py-2 text-center text-sm text-slate-300 hover:border-violet-500/40"
            >
              Приоритеты владельца
            </Link>
          </div>
        </div>
        {view.blockers.length > 0 ? (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <p className="text-xs font-bold uppercase text-rose-300">Блокировки</p>
            <ul className="mt-2 space-y-1">
              {view.blockers.map((b) => (
                <li key={b} className="text-sm text-rose-100/90">
                  · {b}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="mt-4 text-xs text-slate-600">{view.primaryObjectiveRu}</p>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400/90">
          Здоровье проекта
        </h2>
        <div className="mt-4">
          <HealthStrip health={view.health} />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Очередь исполнения
          </h2>
          <div className="mt-4">
            <TaskQueue items={view.taskQueue} />
          </div>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Поток AI (человеческий)
          </h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <NarrationStream items={view.narration} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">
          Roadmap · блоки подсистем
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Прогресс, зависимости и статус без технического шума
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {view.subsystems.map((block) => (
            <SubsystemBlockCard key={block.id} block={block} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400/90">
          Live AI · детали (свёрнуто по умолчанию на карточках выше)
        </h2>
        <details className="mt-4 rounded-2xl border border-white/10 bg-black/20">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-300 hover:text-white">
            Технические детали исполнения (для углублённого просмотра)
          </summary>
          <div className="border-t border-white/10 p-5">
            <LiveExecutionPanel />
          </div>
        </details>
      </section>
    </div>
  );
}
