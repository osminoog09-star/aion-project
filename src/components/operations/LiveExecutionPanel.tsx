"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExecutionRuntimeStatus, ValidationStepStatus } from "@/contracts/execution-runtime";
import type { DeploymentStatusPayload } from "@/contracts/deployment-status";

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
    timeline: { at: string; phase: string; summary: string }[];
    heartbeats: { at: string }[];
  };
  deployment: DeploymentStatusPayload;
  dependencyTarget: string;
  primaryObjective: string;
  orchestrationNote: string | null;
};

const POLL_MS = 8_000;

const STATUS_LABELS: Record<string, string> = {
  idle: "Простой",
  planning: "Планирование",
  analyzing: "Анализ",
  coding: "Код",
  validating: "Валидация",
  reviewing: "Ревью",
  deploying: "Деплой",
  blocked: "Блокировка",
  recovering: "Восстановление",
  waiting_approval: "Ожидание решения",
  waiting_review: "Ожидание Apply",
  completed: "Завершено",
};

const VALIDATION_LABELS: Record<ValidationStepStatus, string> = {
  idle: "—",
  pending: "ожидание",
  running: "выполняется",
  passed: "OK",
  failed: "СБОЙ",
};

function healthBadge(health: string, ageMs: number) {
  const sec = Math.round(ageMs / 1000);
  switch (health) {
    case "active":
      return { dot: "🟢", text: `ACTIVE — heartbeat ${sec}s ago`, cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" };
    case "waiting_review":
      return { dot: "🟡", text: "WAITING REVIEW — Apply в Cursor", cls: "border-amber-500/40 bg-amber-500/10 text-amber-200" };
    case "blocked":
      return { dot: "🔴", text: "BLOCKED", cls: "border-rose-500/40 bg-rose-500/10 text-rose-200" };
    case "idle":
      return { dot: "⚪", text: `IDLE — ${sec}s`, cls: "border-white/10 bg-white/5 text-slate-400" };
    default:
      return { dot: "🟡", text: `STALE — ${sec}s`, cls: "border-amber-500/40 bg-amber-500/10 text-amber-200" };
  }
}

function formatTs(iso: string) {
  try {
    return new Date(iso).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

function ValidationRow({ label, status }: { label: string; status: ValidationStepStatus }) {
  const color =
    status === "passed"
      ? "text-emerald-400"
      : status === "failed"
        ? "text-rose-400"
        : status === "running"
          ? "text-cyan-400"
          : "text-slate-500";
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={color}>{VALIDATION_LABELS[status]}</span>
    </div>
  );
}

export function LiveExecutionPanel() {
  const [data, setData] = useState<LiveApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/execution-runtime", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as LiveApiResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
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
    return <p className="text-sm text-rose-300">API: {error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Загрузка live runtime…</p>;
  }

  const r = data.runtime;
  const badge = healthBadge(data.health.health, data.health.heartbeatAgeMs);
  const dep = data.deployment.lastProductionDeploy;

  return (
    <div className="space-y-8">
      <section className={`rounded-2xl border px-5 py-4 ${badge.cls}`}>
        <p className="text-sm font-semibold">
          {badge.dot} {badge.text}
        </p>
        <p className="mt-2 text-lg font-mono text-white">
          heartbeat {Math.round(data.health.heartbeatAgeMs / 1000)}s ago
        </p>
        {r.validationProgress ? (
          <p className="mt-1 text-xs text-cyan-200/90">progress: {r.validationProgress}</p>
        ) : null}
        {r.retryCount != null && r.retryCount > 0 ? (
          <p className="mt-1 text-xs text-amber-300/90">retries: {r.retryCount}</p>
        ) : null}
        <p className="mt-2 text-xs opacity-80">
          poll {POLL_MS / 1000}s · {data.meta.persistedVia === "build_snapshot" ? "снимок main" : "filesystem"}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5 lg:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">Исполнение</h2>
          <p className="mt-2 text-2xl font-bold text-white">
            {STATUS_LABELS[r.phase] ?? r.phase}
            <span className="ml-2 text-base font-normal text-slate-500">({STATUS_LABELS[r.status] ?? r.status})</span>
          </p>
          <p className="mt-3 text-sm text-slate-200">{r.currentTask}</p>
          <p className="mt-2 text-xs text-slate-500">
            {r.subsystem} · confidence {(r.confidence * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Валидация</h2>
          <div className="mt-3 space-y-2">
            <ValidationRow label="typecheck" status={r.lastValidation.typecheck} />
            <ValidationRow label="build" status={r.lastValidation.build} />
            <ValidationRow label="deploy" status={r.lastValidation.deploy} />
            <ValidationRow label="routes" status={r.lastValidation.routes ?? "idle"} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400/90">Reasoning</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{r.reasoning}</p>
          {r.blocker ? <p className="mt-3 text-xs text-rose-300">Блокер: {r.blocker}</p> : null}
          {r.lastFailure ? (
            <p className="mt-2 text-xs text-amber-300/90">
              Последний сбой ({r.lastFailure.kind}): {r.lastFailure.message}
            </p>
          ) : null}
          {r.lastCompletedAction ? (
            <p className="mt-2 text-xs text-slate-500">last: {r.lastCompletedAction}</p>
          ) : null}
          {r.recoveryConfidence != null ? (
            <p className="mt-1 text-xs text-violet-300/80">
              recovery {(r.recoveryConfidence * 100).toFixed(0)}%
            </p>
          ) : null}
          <p className="mt-3 text-xs text-cyan-200/90">→ {r.nextStep}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400/90">Production deploy</h2>
          <p className="mt-2 text-sm text-slate-200">
            Статус: <span className="font-semibold">{dep.status}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">commit {dep.commit ?? "—"}</p>
          <p className="mt-1 text-xs text-slate-500">{dep.notes ?? "—"}</p>
          {data.deployment.routeValidation ? (
            <p className="mt-2 text-xs text-slate-400">
              Routes: {data.deployment.routeValidation.allPassed ? "все OK" : "есть сбои"} ·{" "}
              {formatTs(data.deployment.routeValidation.checkedAt)}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Файлы</h2>
          <ul className="mt-3 space-y-1 font-mono text-[11px] text-slate-400">
            {r.files.length ? r.files.map((f) => <li key={f}>· {f}</li>) : <li className="text-slate-600">—</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Git</h2>
          <p className="mt-2 text-sm text-slate-300">Ветка: {r.branch ?? "—"}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">Commit: {r.commitCandidate ?? "—"}</p>
          {r.pendingReviewCount ? (
            <p className="mt-2 text-xs text-amber-300">Pending review: {r.pendingReviewCount}</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Timeline</h2>
        <ul className="mt-4 space-y-2">
          {data.document.timeline.slice(0, 14).map((ev) => (
            <li
              key={`${ev.at}-${ev.phase}-${ev.summary}`}
              className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs"
            >
              <span className="text-slate-500">{formatTs(ev.at)}</span>
              <span className="font-semibold text-cyan-300/90">{STATUS_LABELS[ev.phase] ?? ev.phase}</span>
              <span className="text-slate-400">{ev.summary}</span>
            </li>
          ))}
        </ul>
        <div ref={timelineEndRef} />
      </section>
    </div>
  );
}
