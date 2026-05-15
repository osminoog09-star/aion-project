import Link from "next/link";
import type { OwnerCommandCenterView } from "@/lib/operations/owner-command-center";
import { selfHealOwnerCard } from "@/lib/operations/execution-owner-ru";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { ReadinessRing } from "./ReadinessRing";
import { SubsystemBlockCard } from "./SubsystemBlockCard";
import { LiveExecutionPanel } from "./LiveExecutionPanel";
import { ReadinessMetricsGrid } from "./ReadinessMetricsGrid";
import { DependencyGraphPanel } from "./DependencyGraphPanel";
import { ValidationDeployCenter } from "./ValidationDeployCenter";

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

function NarrationStream({ items }: { items: OwnerCommandCenterView["narration"] }) {
  return (
    <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {items.map((n) => (
        <li
          key={`${n.at}-${n.title}`}
          className="rounded-lg border border-white/5 bg-black/30 px-3 py-2"
        >
          <p className="text-sm font-medium text-white">
            {n.icon} {n.title}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            <span className="text-slate-600">Причина: </span>
            {n.explanation}
          </p>
          <p className="mt-0.5 text-xs text-emerald-300/80">
            <span className="text-slate-600">Результат: </span>
            {n.result}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function OwnerCommandCenter({ view }: { view: OwnerCommandCenterView }) {
  const heal = selfHealOwnerCard(view.runtime);

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-950 to-violet-950/30 p-6 md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400/90">
          AION · Центр управления AI
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Автономная инженерная организация · вы наблюдаете и задаёте стратегию
        </p>

        <div className="mt-8 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <ReadinessRing percent={view.readiness.mvpPercent} size={120} label="MVP" />
            <ReadinessRing percent={view.readiness.productionPercent} size={120} label="сайт" />
            <ReadinessRing percent={view.overallReadinessPercent} size={100} label="общая" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-white md:text-3xl">{view.aiActivityRu}</p>
            <p className="mt-2 text-sm text-slate-300">
              Фаза: <span className="text-violet-200">{view.currentPhaseRu}</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Подсистема: <span className="text-cyan-200">{view.activeSubsystemRu}</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Уверенность: <span className="font-semibold text-violet-200">{view.confidencePercent}%</span>
              {view.retryCount > 0 ? (
                <span className="ml-2 text-amber-300">· попыток восстановления: {view.retryCount}</span>
              ) : null}
            </p>
            {view.lastCompletedRu ? (
              <p className="mt-2 text-xs text-slate-500">✓ Готово: {view.lastCompletedRu}</p>
            ) : null}
            <p className="mt-3 text-sm text-cyan-100/90">
              <span className="text-slate-500">Следующее: </span>
              {view.nextActionRu}
            </p>
            <div className="mt-5 grid gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs sm:grid-cols-2">
              <p className="col-span-2 font-bold uppercase tracking-wider text-emerald-300/90">
                {view.continuousRuntime.orchestrationModeRu}
              </p>
              <p>
                <span className="text-slate-500">Прогресс: </span>
                {view.continuousRuntime.progressPercent}%
              </p>
              <p>
                <span className="text-slate-500">ETA: </span>
                {view.continuousRuntime.etaMinutes != null
                  ? `~${view.continuousRuntime.etaMinutes} мин`
                  : "—"}
              </p>
              <p>
                <span className="text-slate-500">Runtime: </span>
                {view.continuousRuntime.runtimeGraph}
              </p>
              <p>
                <span className="text-slate-500">Глубина: </span>
                {view.continuousRuntime.autonomousDepth}
              </p>
              <p>
                <span className="text-slate-500">Heartbeat: </span>
                {view.continuousRuntime.heartbeatAgeSec} сек
              </p>
              {view.continuousRuntime.lastAction ? (
                <p>
                  <span className="text-slate-500">Действие: </span>
                  [{view.continuousRuntime.lastAction}]
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
            <Link
              href={ecosystemRoutes.operationsLive}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-center text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"
            >
              Живой поток AI →
            </Link>
            <Link
              href={ecosystemRoutes.operationsPriorities}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm text-slate-300 hover:border-violet-500/40"
            >
              Стратегические приоритеты
            </Link>
          </div>
        </div>

        {heal ? (
          <div className="mt-6 rounded-xl border border-violet-500/35 bg-violet-500/8 px-4 py-4">
            <p className="text-xs font-bold uppercase text-violet-300">🛠 AI восстанавливает систему</p>
            <p className="mt-2 text-sm text-rose-200/90">Что сломалось: {heal.broken}</p>
            <p className="mt-1 text-sm text-slate-200">Действие: {heal.action}</p>
            <p className="mt-1 text-xs text-slate-400">{heal.attempts} · {heal.risk}</p>
          </div>
        ) : null}

        {view.blockers.length > 0 ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <p className="text-xs font-bold uppercase text-rose-300">⚠ Блокировки</p>
            <ul className="mt-2 space-y-1">
              {view.blockers.map((b) => (
                <li key={b} className="text-sm text-rose-100/90">
                  · {b}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 text-xs leading-relaxed text-slate-600">{view.primaryObjectiveRu}</p>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-violet-400/90">
          Готовность проекта
        </h2>
        <div className="mt-4">
          <ReadinessMetricsGrid metrics={view.readiness} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400/90">
          Деплой и проверки
        </h2>
        <div className="mt-4">
          <ValidationDeployCenter matrix={view.validationMatrix} health={view.health} />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Очередь AI
          </h2>
          <div className="mt-4">
            <TaskQueue items={view.taskQueue} />
          </div>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Поток исполнения AI
          </h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <NarrationStream items={view.narration} />
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">
            Граф зависимостей
          </h2>
          <p className="mt-1 text-xs text-slate-600">Что блокирует что — без технических терминов</p>
          <div className="mt-4">
            <DependencyGraphPanel nodes={view.dependencyGraph} />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">
            Roadmap · блоки подсистем
          </h2>
          <p className="mt-1 text-xs text-slate-600">Прогресс и статус каждого направления</p>
          <div className="mt-4 grid gap-4">
            {view.subsystems.slice(0, 3).map((block) => (
              <SubsystemBlockCard key={block.id} block={block} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Все подсистемы
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {view.subsystems.map((block) => (
            <SubsystemBlockCard key={block.id} block={block} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">
          Технические детали (по желанию)
        </h2>
        <details className="mt-4 rounded-2xl border border-white/10 bg-black/20">
          <summary className="cursor-pointer px-5 py-4 text-sm text-slate-400 hover:text-white">
            Показать пути файлов, API и сырой runtime
          </summary>
          <div className="border-t border-white/10 p-5">
            <LiveExecutionPanel />
          </div>
        </details>
      </section>
    </div>
  );
}
