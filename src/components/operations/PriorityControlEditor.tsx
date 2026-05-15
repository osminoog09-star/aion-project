"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  ExecutionQueue,
  PriorityChangeAudit,
  PriorityChangeRecord,
  StrategicPrioritiesPayload,
  StrategicPriorityItem,
  StrategicPriorityLevel,
  StrategicPriorityStatus,
} from "@/lib/ecosystem-types";
import { priorityLevelLabel, priorityStatusLabel, t } from "@/i18n";
import { priorityLevelBadgeClass } from "@/lib/strategic-priorities";
import {
  validateStrategicPriorities,
  type PriorityValidationIssue,
} from "@/lib/operations/priority-validation";

const LEVELS: StrategicPriorityLevel[] = [
  "critical",
  "high",
  "medium",
  "low",
  "blocked",
  "experimental",
];

const STATUSES: StrategicPriorityStatus[] = [
  "not_started",
  "in_progress",
  "done",
  "blocked",
];

type Props = {
  initial: StrategicPrioritiesPayload;
  executionQueue: ExecutionQueue | null | undefined;
  authConfigured: boolean;
  initialAuthenticated: boolean;
};

function diffPayload(
  prev: StrategicPrioritiesPayload,
  next: StrategicPrioritiesPayload,
): PriorityChangeRecord[] {
  const changes: PriorityChangeRecord[] = [];
  if (prev.ownerDirective !== next.ownerDirective) {
    changes.push({
      path: "ownerDirective",
      previousValue: prev.ownerDirective,
      newValue: next.ownerDirective,
      affectedSubsystemIds: [],
    });
  }
  if ((prev.executionNotes ?? "") !== (next.executionNotes ?? "")) {
    changes.push({
      path: "executionNotes",
      previousValue: prev.executionNotes ?? "",
      newValue: next.executionNotes ?? "",
    });
  }
  for (const p of next.priorities) {
    const old = prev.priorities.find((x) => x.id === p.id);
    if (!old) {
      changes.push({
        path: `priorities.${p.id}`,
        previousValue: "—",
        newValue: `${p.level} / ${p.status}`,
        affectedSubsystemIds: p.subsystemIds,
      });
      continue;
    }
    if (old.level !== p.level) {
      changes.push({
        path: `priorities.${p.id}.level`,
        previousValue: old.level,
        newValue: p.level,
        affectedSubsystemIds: p.subsystemIds,
      });
    }
    if (old.status !== p.status) {
      changes.push({
        path: `priorities.${p.id}.status`,
        previousValue: old.status,
        newValue: p.status,
        affectedSubsystemIds: p.subsystemIds,
      });
    }
    if (old.nextAction !== p.nextAction) {
      changes.push({
        path: `priorities.${p.id}.nextAction`,
        previousValue: old.nextAction,
        newValue: p.nextAction,
        affectedSubsystemIds: p.subsystemIds,
      });
    }
  }
  return changes;
}

export function PriorityControlEditor({
  initial,
  executionQueue,
  authConfigured,
  initialAuthenticated,
}: Props) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState<StrategicPrioritiesPayload>(initial);
  const [nextTarget, setNextTarget] = useState(
    initial.nextImplementationTarget ?? executionQueue?.nextImplementationTarget ?? "",
  );
  const [saveReason, setSaveReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<PriorityValidationIssue[]>([]);

  const validation = useMemo(() => validateStrategicPriorities(draft), [draft]);

  const login = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/operations/owner-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
      setMessage("Вход выполнен. Редактирование разблокировано.");
    } else {
      const j = (await res.json()) as { error?: string };
      setMessage(j.error ?? "Ошибка входа");
    }
  };

  const logout = async () => {
    await fetch("/api/operations/owner-logout", { method: "POST" });
    setAuthenticated(false);
    setMessage("Сессия завершена.");
  };

  const updatePriority = useCallback((id: string, patch: Partial<StrategicPriorityItem>) => {
    setDraft((d) => ({
      ...d,
      priorities: d.priorities.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const movePriority = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= draft.priorities.length) return;
    const list = [...draft.priorities];
    const [item] = list.splice(index, 1);
    list.splice(j, 0, item!);
    setDraft((d) => ({ ...d, priorities: list }));
  };

  const save = async () => {
    if (!authenticated) {
      setMessage("Нужен вход владельца.");
      return;
    }
    if (!saveReason.trim()) {
      setMessage("Укажите причину изменения (audit).");
      return;
    }
    setBusy(true);
    setMessage(null);
    const payload: StrategicPrioritiesPayload = {
      ...draft,
      nextImplementationTarget: nextTarget.trim() || undefined,
    };
    const audit: PriorityChangeAudit = {
      reason: saveReason.trim(),
      changedAt: new Date().toISOString(),
      changedBy: "product-owner",
      changes: diffPayload(initial, payload),
    };
    const res = await fetch("/api/strategic-priorities", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload,
        nextImplementationTarget: nextTarget.trim() || undefined,
        audit,
      }),
    });
    const j = (await res.json()) as {
      ok?: boolean;
      error?: string;
      issues?: PriorityValidationIssue[];
      persistedTo?: string[];
      feedEventId?: string;
    };
    setBusy(false);
    if (!res.ok) {
      setIssues(j.issues ?? []);
      setMessage(j.error ?? "Сохранение не удалось");
      return;
    }
    setIssues(j.issues ?? validation.issues);
    setMessage(
      `Сохранено (${(j.persistedTo ?? []).join(", ")}). Feed: ${j.feedEventId ?? "—"}. Cursor перечитает приоритеты.`,
    );
    setSaveReason("");
  };

  if (!authConfigured) {
    return (
      <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90">
        {t("operations.pages.priorities.authSetup")}
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-8">
      {!authenticated ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/90">{t("common.ownerLogin")}</h2>
          <p className="mt-2 text-xs text-slate-500">{t("operations.pages.priorities.ownerOnly")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("common.ownerSecret")}
              className="min-w-[12rem] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void login()}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {t("common.login")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-emerald-300/90">{t("operations.pages.priorities.editMode")}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            {t("common.logout")}
          </button>
        </div>
      )}

      {message ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          {message}
        </p>
      ) : null}

      {(issues.length > 0 || validation.issues.length > 0) && (
        <ul className="space-y-2 text-xs">
          {[...validation.issues, ...issues].map((i) => (
            <li
              key={i.id}
              className={
                i.severity === "error"
                  ? "rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-100"
                  : "rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-100"
              }
            >
              {i.message}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">
          {t("common.ownerDirective")}
        </label>
        <textarea
          disabled={!authenticated}
          value={draft.ownerDirective}
          onChange={(e) => setDraft((d) => ({ ...d, ownerDirective: e.target.value }))}
          rows={3}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
        />
        <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Execution notes
        </label>
        <textarea
          disabled={!authenticated}
          value={draft.executionNotes ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, executionNotes: e.target.value }))}
          rows={2}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
        />
        <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">
          {t("operations.pages.priorities.nextTargetField")}
        </label>
        <textarea
          disabled={!authenticated}
          value={nextTarget}
          onChange={(e) => setNextTarget(e.target.value)}
          rows={2}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
        />
        {executionQueue?.currentSubsystemFocus ? (
          <p className="mt-2 text-[10px] text-slate-600">
            {t("operations.pages.priorities.queueFocus")}: {executionQueue.currentSubsystemFocus} ·{" "}
            {t("operations.pages.priorities.epic")}: {executionQueue.currentActiveEpic}
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("common.editPriorities")}</h2>
        <ul className="mt-4 space-y-4">
          {draft.priorities.map((p, index) => (
            <li key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{p.title}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityLevelBadgeClass(p.level)}`}
                >
                  {priorityLevelLabel(p.level)}
                </span>
                {authenticated ? (
                  <span className="ml-auto flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePriority(index, -1)}
                      className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === draft.priorities.length - 1}
                      onClick={() => movePriority(index, 1)}
                      className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </span>
                ) : null}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] uppercase text-slate-500">
                  Level
                  <select
                    disabled={!authenticated}
                    value={p.level}
                    onChange={(e) =>
                      updatePriority(p.id, { level: e.target.value as StrategicPriorityLevel })
                    }
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[10px] uppercase text-slate-500">
                  Status
                  <select
                    disabled={!authenticated}
                    value={p.status}
                    onChange={(e) =>
                      updatePriority(p.id, { status: e.target.value as StrategicPriorityStatus })
                    }
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-[10px] uppercase text-slate-500">
                Next action
                <input
                  disabled={!authenticated}
                  value={p.nextAction}
                  onChange={(e) => updatePriority(p.id, { nextAction: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="mt-2 block text-[10px] uppercase text-slate-500">
                Execution notes
                <input
                  disabled={!authenticated}
                  value={p.executionNotes ?? ""}
                  onChange={(e) => updatePriority(p.id, { executionNotes: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>
            </li>
          ))}
        </ul>
      </div>

      {authenticated ? (
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/90">
            Причина изменения (audit)
          </label>
          <input
            value={saveReason}
            onChange={(e) => setSaveReason(e.target.value)}
            placeholder="Почему меняем приоритеты сейчас"
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy || !validation.ok}
            onClick={() => void save()}
            className="mt-4 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {busy ? "Сохранение…" : "Сохранить приоритеты + roadmap + feed"}
          </button>
          {!validation.ok ? (
            <p className="mt-2 text-xs text-rose-300/90">
              Исправьте ошибки dependency перед сохранением.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
