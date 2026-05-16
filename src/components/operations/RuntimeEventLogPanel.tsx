"use client";

import { useEffect, useState } from "react";

type Event = {
  id: string;
  at: string;
  type: string;
  summary: string;
};

export function RuntimeEventLogPanel() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/execution-runtime", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { recentEvents?: Event[] };
        setEvents(data.recentEvents ?? []);
      } catch {
        setEvents([]);
      }
    };
    void load();
    const id = setInterval(() => void load(), 12_000);
    return () => clearInterval(id);
  }, []);

  if (!events.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
        Журнал событий runtime
      </p>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {events.map((e) => (
          <li key={e.id} className="font-mono text-[10px] text-slate-400">
            <span className="text-slate-600">{new Date(e.at).toLocaleString("ru-RU")}</span>{" "}
            <span className="text-violet-300/90">{e.type}</span> — {e.summary}
          </li>
        ))}
      </ul>
    </section>
  );
}
