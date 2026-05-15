import type { ValidationMatrixRu } from "@/lib/operations/owner-command-center";
import type { ProjectHealthSnapshot } from "@/lib/operations/owner-command-center";

export function ValidationDeployCenter({
  matrix,
  health,
}: {
  matrix: ValidationMatrixRu;
  health: ProjectHealthSnapshot;
}) {
  const rows = [
    { label: "Проверка типов", value: matrix.typecheck },
    { label: "Сборка приложения", value: matrix.build },
    { label: "Production-деплой", value: matrix.deploy },
    { label: "Маршруты сайта", value: matrix.routes },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Матрица проверок AI
        </h3>
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2"
            >
              <span className="text-sm text-slate-400">{row.label}</span>
              <span
                className={`text-xs font-medium ${
                  row.value.includes("успешно")
                    ? "text-emerald-300"
                    : row.value.includes("проблема") || row.value.includes("СБОЙ")
                      ? "text-rose-300"
                      : row.value.includes("выполняется")
                        ? "text-cyan-300"
                        : "text-slate-500"
                }`}
              >
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400/90">
          Состояние production
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          <li>🌐 {health.productionRu}</li>
          <li>🚀 {health.deploymentRu}</li>
          <li>⚙️ {health.runtimeRu}</li>
          <li>🤖 {health.aiExecutionRu}</li>
          <li>✅ {health.validationRu}</li>
        </ul>
      </div>
    </div>
  );
}
