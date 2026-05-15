import type { DependencyGraphNodeView } from "@/lib/operations/owner-command-center";

export function DependencyGraphPanel({ nodes }: { nodes: DependencyGraphNodeView[] }) {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`rounded-xl border px-4 py-3 ${
            node.isBlocked
              ? "border-rose-500/35 bg-rose-500/8"
              : node.isActive
                ? "border-cyan-400/40 bg-cyan-500/8 shadow-[0_0_16px_rgba(34,211,238,0.12)]"
                : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-white">{node.titleRu}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                node.isBlocked ? "text-rose-300" : node.isActive ? "text-cyan-300" : "text-slate-500"
              }`}
            >
              {node.statusRu}
            </span>
          </div>
          {node.dependsOnRu.length > 0 ? (
            <p className="mt-2 text-[11px] text-slate-500">
              Зависит от: {node.dependsOnRu.join(", ")}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
