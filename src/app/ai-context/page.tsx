import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "AI context — машиночитаемая экосистема AION",
  description:
    "Ссылки на JSON API экосистемы, roadmap, релизов и облака для ассистентов и CI. Schema X-AION-AI-Schema 1.1.0.",
  robots: { index: true, follow: true },
};

export default function AiContextPage() {
  const base = getSiteUrl().replace(/\/$/, "");
  const apis = [
    { path: "/api/aion/context", note: "полный документ (рекомендуется для одного запроса)" },
    { path: "/api/ecosystem-status", note: "подсистемы, readiness, техдолг, summary" },
    { path: "/api/roadmap", note: "vision, execution, epics, milestones, фазы" },
    { path: "/api/releases", note: "каналы, apk meta, история" },
    { path: "/api/runtime", note: "manifest APK, каналы OTA, rollout" },
    { path: "/api/cloud-health", note: "Supabase probe, health rows, deviceRegistry (public)" },
    { path: "/api/operations", note: "operations hub + summary + техдолг" },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400/90">AI · devtools</p>
      <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">Контекст для ИИ и агентов</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        Эта страница не дублирует данные — она указывает на стабильные JSON endpoints. Ответы содержат поле{" "}
        <span className="font-mono text-slate-500">meta.schemaVersion</span> и заголовок{" "}
        <span className="font-mono text-slate-500">X-AION-AI-Schema: 1.1.0</span>. Источник правды тот же, что у
        портала: репозиторный JSON + опционально Supabase <span className="font-mono">ecosystem_public_snapshots</span>.
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        {apis.map((a) => (
          <li key={a.path} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <a href={`${base}${a.path}`} className="font-mono text-cyan-300 hover:underline">
              {base}
              {a.path}
            </a>
            <p className="mt-1 text-xs text-slate-500">{a.note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-xs text-slate-600">
        Человеческий хаб:{" "}
        <Link href={ecosystemRoutes.control} className="text-cyan-500 hover:underline">
          /control
        </Link>{" "}
        · статус:{" "}
        <Link href={ecosystemRoutes.status} className="text-cyan-500 hover:underline">
          /status
        </Link>
      </p>
    </div>
  );
}
