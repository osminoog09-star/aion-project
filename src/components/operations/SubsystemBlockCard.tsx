import type { OwnerSubsystemBlock } from "@/lib/operations/owner-command-center";

const GLOW: Record<string, string> = {
  active: "border-cyan-400/50 shadow-[0_0_24px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/30",
  blocked: "border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.12)]",
  done: "border-emerald-500/30",
  idle: "border-white/10",
};

function ItemList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <p className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs text-slate-400">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SubsystemBlockCard({ block }: { block: OwnerSubsystemBlock }) {
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-gradient-to-br from-slate-900/90 to-black/50 p-5 transition-shadow ${GLOW[block.glow]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-2xl">{block.icon}</span>
          <h3 className="mt-2 text-lg font-semibold text-white">{block.titleRu}</h3>
          <p className="mt-1 text-xs text-slate-500">{block.readinessLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-cyan-200">{block.progressPercent}%</p>
          <p className="text-[10px] text-slate-600">{block.estimatedReadiness}</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
          style={{ width: `${block.progressPercent}%` }}
        />
      </div>

      {block.currentAiTask ? (
        <p className="mt-4 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          <span className="font-semibold text-cyan-300">AI сейчас: </span>
          {block.currentAiTask}
        </p>
      ) : null}

      <ItemList title="Готово" items={block.completed} color="text-emerald-400/90" />
      <ItemList title="В работе" items={block.active} color="text-cyan-400/90" />
      <ItemList title="Заблокировано" items={block.blocked} color="text-rose-400/90" />
      <ItemList title="Дальше" items={block.future} color="text-slate-500" />

      {block.dependencies.length > 0 ? (
        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Зависимости</p>
          <ul className="mt-1 space-y-1">
            {block.dependencies.map((d) => (
              <li key={d.id} className="flex justify-between text-[11px] text-slate-500">
                <span>{d.title}</span>
                <span>{d.statusRu}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
