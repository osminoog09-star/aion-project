"use client";

import { useCallback, useEffect, useState } from "react";

type ReportPayload = {
  ready: boolean;
  passedCount: number | null;
  totalCount: number;
  submittedAt: string | null;
  reportText: string | null;
};

export function OwnerFieldValidationReportPanel() {
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/operations/field-validation-report", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { report: ReportPayload };
      setReport(data.report);
    } catch {
      setReport(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 20_000);
    return () => clearInterval(id);
  }, [load]);

  const submit = async () => {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/operations/field-validation-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText: draft }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; report?: ReportPayload };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setStatus("ok");
      setMessage(
        data.report?.ready
          ? "✓ Распознано 8/8 — можно продолжать OTA smoke"
          : `Сохранено: ${data.report?.passedCount ?? "?"}/${data.report?.totalCount ?? 8}`,
      );
      setDraft("");
      await load();
    } catch (e) {
      setStatus("err");
      setMessage(e instanceof Error ? e.message : "Ошибка сети");
    }
  };

  return (
    <section className="rounded-2xl border border-violet-500/35 bg-violet-500/8 px-5 py-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-300">
        Отчёт с устройства · вставить сюда
      </p>
      <p className="mt-2 text-sm text-slate-400">
        На телефоне: Маршруты → <span className="text-cyan-300">Скопировать отчёт</span> → вставьте
        ниже (нужен вход владельца на портале).
      </p>
      {report?.submittedAt ? (
        <p className="mt-3 text-sm text-white">
          Последний снимок:{" "}
          <span className={report.ready ? "text-emerald-300" : "text-amber-300"}>
            {report.ready ? "8/8 готово" : `${report.passedCount ?? "?"}/${report.totalCount}`}
          </span>
          <span className="text-slate-500"> · {new Date(report.submittedAt).toLocaleString("ru-RU")}</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Отчёт ещё не загружен.</p>
      )}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={"FIELD VALIDATION: …\n✓ Есть GPS-смены: …"}
        rows={6}
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-slate-200 placeholder:text-slate-600"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={status === "saving" || draft.trim().length < 20}
          onClick={() => void submit()}
          className="rounded-full border border-violet-400/50 bg-violet-500/20 px-4 py-2 text-xs font-semibold text-violet-100 disabled:opacity-40"
        >
          {status === "saving" ? "Сохранение…" : "Сохранить отчёт"}
        </button>
        {message ? (
          <span className={`text-xs ${status === "err" ? "text-rose-300" : "text-emerald-300"}`}>
            {message}
          </span>
        ) : null}
      </div>
      {report?.reportText ? (
        <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-white/5 bg-black/40 p-3 text-[10px] text-slate-400">
          {report.reportText.slice(0, 1200)}
          {report.reportText.length > 1200 ? "…" : ""}
        </pre>
      ) : null}
    </section>
  );
}
