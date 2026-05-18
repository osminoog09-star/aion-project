"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DriverBugReportRow } from "@/lib/operations/fetch-driver-bug-reports";

type ApiResponse = {
  ok: boolean;
  reports: DriverBugReportRow[];
};

type Props = {
  initial: DriverBugReportRow[];
  pollMs?: number;
};

export function OperationsBugReportsLive({ initial, pollMs = 45_000 }: Props) {
  const [reports, setReports] = useState(initial);
  const [newCount, setNewCount] = useState(0);
  const knownIds = useRef(new Set(initial.map((r) => r.id)));

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/operations/bug-reports", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as ApiResponse;
      if (!body.ok || !Array.isArray(body.reports)) return;

      let fresh = 0;
      for (const r of body.reports) {
        if (!knownIds.current.has(r.id)) {
          knownIds.current.add(r.id);
          fresh += 1;
        }
      }
      if (fresh > 0) {
        setNewCount((n) => n + fresh);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("AION · новый баг-репорт", {
            body: `${fresh} новых отчётов с Driver`,
            tag: "aion-bug-reports",
          });
        }
      }
      setReports(body.reports);
    } catch {
      /* ignore transient network */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => void poll(), pollMs);
    return () => clearInterval(id);
  }, [poll, pollMs]);

  const enableNotify = () => {
    if (typeof Notification === "undefined") return;
    void Notification.requestPermission();
  };

  return (
    <>
      {newCount > 0 ? (
        <div
          role="status"
          className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3"
        >
          <p className="text-sm text-amber-100">
            {newCount === 1 ? "Новый отчёт с Driver" : `Новых отчётов: ${newCount}`}
          </p>
          <button
            type="button"
            onClick={() => setNewCount(0)}
            className="ml-auto rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5"
          >
            Скрыть
          </button>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void poll()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 hover:bg-white/10"
        >
          Обновить сейчас
        </button>
        <button
          type="button"
          onClick={enableNotify}
          className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs text-violet-200 hover:bg-violet-500/20"
        >
          Уведомления в браузере
        </button>
        <span className="self-center text-[10px] text-slate-600">авто · каждые 45 с</span>
      </div>
      <ul className="mt-8 space-y-4">
        {reports.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
              <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-rose-200">
                {r.category}
              </span>
              <span>{r.status}</span>
              <span>{r.platform ?? "—"}</span>
              <span>v{r.app_version ?? "?"}</span>
              <span className="ml-auto font-mono text-slate-600">{r.id.slice(0, 8)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {new Date(r.created_at).toLocaleString("ru-RU")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white">{r.description}</p>
            {r.diagnostics ? (
              <pre className="mt-3 max-h-48 overflow-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-slate-400">
                {JSON.stringify(r.diagnostics, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
