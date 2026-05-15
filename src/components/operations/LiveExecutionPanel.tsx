"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExecutionRuntimeStatus, ValidationStepStatus } from "@/contracts/execution-runtime";
import type { DeploymentStatusPayload } from "@/contracts/deployment-status";
import {
  abstractFileChanges,
  buildHumanTimelineCard,
  CONTROL_MODE_RU,
  deployStatusHuman,
  failureHuman,
  HEALTH_OWNER,
  ownerControlMode,
  PHASE_OWNER,
  selfHealOwnerCard,
  validationHuman,
} from "@/lib/operations/execution-owner-ru";
import type { ExecutionHealth } from "@/contracts/execution-runtime";

type LiveApiResponse = {
  meta: { health: string; heartbeatAgeMs: number; persistedVia: string };
  health: { health: string; heartbeatAgeMs: number; label: string };
  runtime: {
    status: ExecutionRuntimeStatus;
    phase: ExecutionRuntimeStatus;
    currentTask: string;
    subsystem: string;
    reasoning: string;
    confidence: number;
    startedAt: string;
    updatedAt: string;
    heartbeatAt: string;
    files: string[];
    commitCandidate: string | null;
    blocker: string | null;
    nextStep: string;
    lastCompletedAction?: string | null;
    retryCount?: number;
    validationProgress?: string | null;
    recoveryConfidence?: number;
    branch?: string;
    dependencyTarget?: string;
    pendingReviewCount?: number;
    lastValidation: {
      typecheck: ValidationStepStatus;
      build: ValidationStepStatus;
      deploy: ValidationStepStatus;
      routes?: ValidationStepStatus;
    };
    lastFailure?: { kind: string; message: string; at: string } | null;
  };
  document: {
    timeline: {
      at: string;
      phase: string;
      summary: string;
      titleRu?: string;
      explanationRu?: string;
      resultRu?: string;
      icon?: string;
      confidence?: number;
    }[];
    heartbeats: { at: string }[];
  };
  deployment: DeploymentStatusPayload;
  dependencyTarget: string;
  primaryObjective: string;
  orchestrationNote: string | null;
};

const POLL_MS = 8_000;

function formatTs(iso: string) {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ValidationCard({
  step,
  status,
}: {
  step: "typecheck" | "build" | "deploy" | "routes";
  status: ValidationStepStatus;
}) {
  const ok = status === "passed";
  const fail = status === "failed";
  const running = status === "running";
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/5"
          : fail
            ? "border-rose-500/30 bg-rose-500/5"
            : running
              ? "border-cyan-500/30 bg-cyan-500/5"
              : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <p className={`text-xs ${ok ? "text-emerald-300" : fail ? "text-rose-300" : "text-slate-300"}`}>
        {validationHuman(step, status)}
      </p>
    </div>
  );
}

export function LiveExecutionPanel() {
  const [data, setData] = useState<LiveApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/execution-runtime", { cache: "no-store" });
      if (!res.ok) throw new Error(`Ошибка загрузки (${res.status})`);
      setData((await res.json()) as LiveApiResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "не удалось загрузить");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [data?.document.timeline[0]?.at]);

  if (error && !data) {
    return <p className="text-sm text-rose-300">Не удалось загрузить статус AI: {error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Загрузка центра управления AI…</p>;
  }

  const r = data.runtime;
  const healthKey = data.health.health as ExecutionHealth;
  const healthRu = HEALTH_OWNER[healthKey];
  const sec = Math.round(data.health.heartbeatAgeMs / 1000);
  const phaseMeta = PHASE_OWNER[r.phase] ?? PHASE_OWNER.idle;
  const controlMode = ownerControlMode(r, healthKey);
  const controlLabel = CONTROL_MODE_RU[controlMode];
  const heal = selfHealOwnerCard(r);
  const dep = data.deployment.lastProductionDeploy;
  const routesOk = data.deployment.routeValidation?.allPassed;
  const fileAbstracts = abstractFileChanges(r.files);
  const timeline = data.document.timeline;
  const cards = timeline.slice(0, 14).map((ev, i) =>
    buildHumanTimelineCard(ev, timeline[i + 1]?.at ?? null, r.confidence),
  );

  return (
    <div className="space-y-8">
      {/* Owner control banner */}
      <section
        className={`rounded-2xl border px-5 py-5 ${
          controlMode === "ai_blocked"
            ? "border-rose-500/40 bg-rose-500/10"
            : controlMode === "ai_waiting"
              ? "border-amber-500/40 bg-amber-500/10"
              : controlMode === "ai_repairing"
                ? "border-violet-500/40 bg-violet-500/10"
                : controlMode === "ai_active" || controlMode === "ai_validating" || controlMode === "ai_deploying"
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/10 bg-white/[0.03]"
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/80">
          Центр управления AI
        </p>
        <p className="mt-2 text-2xl font-bold text-white">
          {healthRu.icon} {controlLabel}
        </p>
        <p className="mt-1 text-sm text-slate-300">{healthRu.subtitle(sec)}</p>
        <p className="mt-3 text-lg text-white">
          {phaseMeta.icon} {phaseMeta.label}
        </p>
        <p className="mt-2 text-sm text-slate-200">{r.currentTask}</p>
        {r.validationProgress ? (
          <p className="mt-2 text-xs text-cyan-200/90">Сейчас: {r.validationProgress}</p>
        ) : null}
        {r.retryCount != null && r.retryCount > 0 ? (
          <p className="mt-1 text-xs text-amber-300/90">Попытка восстановления: {r.retryCount}</p>
        ) : null}
        <p className="mt-3 text-xs text-slate-500">
          Обновление каждые {POLL_MS / 1000} сек · уверенность {(r.confidence * 100).toFixed(0)}%
        </p>
      </section>

      {/* Self-heal card */}
      {heal ? (
        <section className="rounded-2xl border border-violet-500/35 bg-violet-500/8 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Автовосстановление</p>
          <p className="mt-2 text-sm text-rose-200/90">
            <span className="text-slate-500">Что сломалось: </span>
            {heal.broken}
          </p>
          <p className="mt-2 text-sm text-slate-200">
            <span className="text-slate-500">Что делает AI: </span>
            {heal.action}
          </p>
          <p className="mt-1 text-xs text-slate-400">{heal.attempts}</p>
          <p className="mt-1 text-xs text-amber-300/90">Риск: {heal.risk}</p>
          {heal.needsOwner ? (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              ⚠️ Может потребоваться ваше действие в Cursor или Vercel
            </p>
          ) : (
            <p className="mt-2 text-xs text-emerald-300/80">AI справится автоматически — вмешательство не нужно</p>
          )}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">Зачем AI это делает</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{r.reasoning}</p>
          {r.blocker ? (
            <p className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              Блокировка: {r.blocker}
            </p>
          ) : null}
          {r.lastFailure ? (
            <p className="mt-2 text-xs text-amber-300/90">
              {failureHuman(r.lastFailure.kind, r.lastFailure.message)}
            </p>
          ) : null}
          {r.lastCompletedAction ? (
            <p className="mt-3 text-xs text-slate-500">✓ Готово: {r.lastCompletedAction}</p>
          ) : null}
          <p className="mt-3 text-sm text-cyan-200/90">
            <span className="text-slate-500">Дальше: </span>
            {r.nextStep}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Проверки качества</h2>
          <div className="mt-3 grid gap-2">
            <ValidationCard step="typecheck" status={r.lastValidation.typecheck} />
            <ValidationCard step="build" status={r.lastValidation.build} />
            <ValidationCard step="deploy" status={r.lastValidation.deploy} />
            <ValidationCard step="routes" status={r.lastValidation.routes ?? "idle"} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400/90">Сайт на production</h2>
        <p className="mt-2 text-sm text-slate-200">
          {deployStatusHuman(dep.status, routesOk)}
        </p>
        {data.deployment.routeValidation ? (
          <p className="mt-2 text-xs text-slate-400">
            Последняя проверка маршрутов: {formatTs(data.deployment.routeValidation.checkedAt)}
            {routesOk ? " · все страницы доступны" : " · есть проблемы"}
          </p>
        ) : null}
        {showTechnical ? (
          <p className="mt-2 font-mono text-[10px] text-slate-600">commit {dep.commit ?? "—"}</p>
        ) : null}
      </section>

      {/* Diff abstraction */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Что изменилось</h2>
          <button
            type="button"
            onClick={() => setShowTechnical((v) => !v)}
            className="text-[10px] text-cyan-400/90 underline-offset-2 hover:underline"
          >
            {showTechnical ? "Скрыть технические детали" : "Показать пути файлов"}
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {fileAbstracts.length ? (
            fileAbstracts.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-slate-300">
                <span className="text-cyan-400">·</span>
                {line}
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-600">Пока нет зафиксированных изменений в этом цикле</li>
          )}
        </ul>
        {showTechnical && r.files.length ? (
          <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 font-mono text-[10px] text-slate-600">
            {r.files.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : null}
        {r.pendingReviewCount ? (
          <p className="mt-3 text-xs text-amber-300">
            Ожидает Apply в Cursor: {r.pendingReviewCount} изменений
          </p>
        ) : null}
      </section>

      {/* AI operating center timeline */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Хронология AI</h2>
        <ul className="mt-4 space-y-3">
          {cards.map((card) => (
            <li
              key={`${card.at}-${card.title}`}
              className="rounded-xl border border-white/8 bg-gradient-to-br from-slate-900/80 to-black/40 px-4 py-4"
            >
              <div className="flex flex-wrap items-start gap-2">
                <span className="text-xl">{card.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{card.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatTs(card.at)}</p>
                </div>
                {card.durationSec != null ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
                    {card.durationSec}с
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                <span className="text-slate-500">Причина: </span>
                {card.explanation}
              </p>
              <p className="mt-1 text-sm text-emerald-300/85">
                <span className="text-slate-500">Результат: </span>
                {card.result}
              </p>
              {card.confidence != null ? (
                <p className="mt-2 text-[10px] text-violet-300/80">
                  Уверенность: {Math.round(card.confidence * 100)}%
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <div ref={timelineEndRef} />
      </section>

      <p className="text-center text-[10px] text-slate-600">
        Цель: {data.primaryObjective} · Следующий фокус: {data.dependencyTarget}
      </p>
    </div>
  );
}
