"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutionRuntimeStatus } from "@/lib/execution-runtime";

type LiveApiResponse = {
  meta: {
    health: string;
    heartbeatAgeMs: number;
    persistedVia: string;
  };
  health: { health: string; heartbeatAgeMs: number; label: string };
  payload: {
    state: {
      status: ExecutionRuntimeStatus;
      currentTask: string;
      subsystem: string;
      reasoning: string;
      confidence: number;
      startedAt: string;
      updatedAt: string;
      files: string[];
      commitCandidate: string | null;
      blocker: string | null;
      nextStep: string;
      branch?: string;
      dependencyTarget?: string;
      validationStatus?: string;
      pendingReviewCount?: number;
    };
    timeline: { at: string; phase: string; summary: string }[];
    heartbeats: { at: string }[];
  };
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
  waiting_approval: "Ожидание решения",
  waiting_review: "Ожидание Apply",
  completed: "Завершено",
};

function healthBadge(health: string, ageMs: number) {
  const sec = Math.round(ageMs / 1000);
  switch (health) {
    case "active":
      return {
        dot: "🟢",
        text: `ACTIVE — heartbeat ${sec}s ago`,
        className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
      };
    case "waiting_review":
      return {
        dot: "🟡",
        text: "WAITING REVIEW — Apply/Accept в Cursor",
        className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
      };
    case "blocked":
      return {
        dot: "🔴",
        text: "BLOCKED",
        className: "border-rose-500/40 bg-rose-500/10 text-rose-200",
      };
    case "stale":
      return {
        dot: "🟡",
        text: `STALE — последний сигнал ${sec}s назад`,
        className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
      };
    default:
      return {
        dot: "⚪",
        text: `IDLE — ${sec}s`,
        className: "border-white/10 bg-white/5 text-slate-400",
      };
  }
}

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

export function LiveExecutionPanel() {
  const [data, setData] = useState<LiveApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error && !data) {
    return <p className="text-sm text-rose-300">API: {error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Загрузка live state…</p>;
  }

  const { state } = data.payload;
  const badge = healthBadge(data.health.health, data.health.heartbeatAgeMs);

  return (
    <div className="space-y-8">
      <section
        className={`rounded-2xl border px-5 py-4 ${badge.className}`}
      >
        <p className="text-sm font-semibold">
          {badge.dot} {badge.text}
        </p>
        <p className="mt-2 text-xs opacity-80">
          Источник: {data.meta.persistedVia === "build_snapshot" ? "снимок main (обновляется при push)" : "filesystem"} · poll {POLL_MS / 1000}s
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">
            Текущая фаза
          </h2>
          <p className="mt-2 text-2xl font-bold text-white">
            {STATUS_LABELS[state.status] ?? state.status}
          </p>
          <p className="mt-3 text-sm text-slate-200">{state.currentTask}</p>
          <p className="mt-2 text-xs text-slate-500">
            Подсистема: <span className="text-slate-300">{state.subsystem}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Confidence: {(state.confidence * 100).toFixed(0)}% · валидация: {state.validationStatus ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400/90">
            Reasoning
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{state.reasoning}</p>
          {state.blocker ? (
            <p className="mt-3 text-xs text-rose-300">Блокер: {state.blocker}</p>
          ) : null}
          <p className="mt-3 text-xs text-cyan-200/90">→ {state.nextStep}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Dependency-safe target
        </h2>
        <p className="mt-2 text-sm text-slate-200">{data.dependencyTarget}</p>
        <p className="mt-2 text-xs text-slate-500">{data.primaryObjective}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Активные файлы
          </h2>
          <ul className="mt-3 space-y-1 font-mono text-[11px] text-slate-400">
            {state.files.length ? (
              state.files.map((f) => <li key={f}>· {f}</li>)
            ) : (
              <li className="text-slate-600">—</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Git / commit
          </h2>
          <p className="mt-2 text-sm text-slate-300">Ветка: {state.branch ?? "—"}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            Commit: {state.commitCandidate ?? "—"}
          </p>
          {state.pendingReviewCount ? (
            <p className="mt-2 text-xs text-amber-300">
              Pending review: {state.pendingReviewCount} файл(ов)
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Execution timeline
        </h2>
        <ul className="mt-4 space-y-2">
          {data.payload.timeline.slice(0, 12).map((ev) => (
            <li
              key={`${ev.at}-${ev.phase}`}
              className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs"
            >
              <span className="text-slate-500">{formatTs(ev.at)}</span>
              <span className="font-semibold text-cyan-300/90">
                {STATUS_LABELS[ev.phase] ?? ev.phase}
              </span>
              <span className="text-slate-400">{ev.summary}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
