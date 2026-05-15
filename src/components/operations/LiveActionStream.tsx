"use client";

type ActionEntry = {
  at: string;
  tag: string;
  message: string;
  file?: string;
  repo?: string;
};

const TAG_RU: Record<string, string> = {
  CODE: "Код",
  VALIDATE: "Проверка",
  DEPLOY: "Деплой",
  ANALYZE: "Анализ",
  PLAN: "План",
  HEAL: "Восстановление",
  NEXT: "След. задача",
  REVIEW: "Ревью",
  RETRY: "Повтор",
  OPTIMIZE: "Оптимизация",
  AUDIT: "Аудит",
  HEARTBEAT: "Пульс",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function LiveActionStream({ actions }: { actions: ActionEntry[] }) {
  if (!actions.length) return null;

  return (
    <section className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/90">
        Поток действий AI (как в терминале Cursor)
      </p>
      <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {actions.slice(0, 16).map((a) => (
          <li
            key={`${a.at}-${a.tag}-${a.message.slice(0, 24)}`}
            className="rounded-lg border border-white/5 bg-black/25 px-3 py-2 font-mono text-[11px]"
          >
            <span className="text-slate-500">{formatTime(a.at)}</span>
            <span className="ml-2 font-bold text-cyan-300">[{a.tag}]</span>
            <span className="ml-2 text-slate-200">{TAG_RU[a.tag] ?? a.tag}</span>
            <p className="mt-1 text-slate-300">{a.message}</p>
            {a.file ? <p className="mt-0.5 truncate text-slate-500">{a.file}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
