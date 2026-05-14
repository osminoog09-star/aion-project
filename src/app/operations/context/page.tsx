import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

export const metadata: Metadata = {
  title: "Operations context — архитектура и исполнение",
  description:
    "Карта ссылок для ops/agents: execution queue, AI context, control hub, API срезы экосистемы.",
};

export default function OperationsContextPage() {
  const base = getSiteUrl().replace(/\/$/, "");

  const links = [
    { href: ecosystemRoutes.roadmapExecution, label: "/roadmap/execution", note: "очередь, next-best-action, AI notes" },
    { href: ecosystemRoutes.aiContext, label: "/ai-context", note: "индекс JSON API для агентов" },
    { href: ecosystemRoutes.control, label: "/control", note: "Operations Hub (человек)" },
    { href: ecosystemRoutes.operations, label: "/operations", note: "исполнение, риски, DoD" },
    { href: ecosystemRoutes.operationsTimeline, label: "/operations/timeline", note: "лента внедрений и матрица валидации" },
  ] as const;

  const apis = [
    { path: "/api/roadmap/execution", note: "executionEngine + summary очереди" },
    { path: "/api/aion/context", note: "полный документ включая executionEngine" },
    { path: "/api/implementation-feed", note: "implementation items + validationMatrix" },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400/90">Operations · agents</p>
      <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">Контекст операций</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        Маршрут связывает человеческий control center с машиночитаемым слоем. Используйте ChatGPT для архитектурных
        решений и Cursor для реализации — оба читают одни и те же JSON SoT (
        <span className="font-mono text-slate-500">ecosystem-status</span>,{" "}
        <span className="font-mono text-slate-500">roadmap-subsystem-extensions</span>,{" "}
        <span className="font-mono text-slate-500">roadmap-execution</span>,{" "}
        <span className="font-mono text-slate-500">ecosystem-implementation-feed</span>).
      </p>

      <h2 className="mt-10 text-xs font-bold uppercase tracking-widest text-slate-500">Страницы</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-cyan-400 hover:underline">
              {l.label}
            </Link>
            <span className="text-slate-600"> — {l.note}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xs font-bold uppercase tracking-widest text-slate-500">API</h2>
      <ul className="mt-4 space-y-2 font-mono text-xs text-cyan-300/90">
        {apis.map((a) => (
          <li key={a.path}>
            <a href={`${base}${a.path}`} className="hover:underline">
              {base}
              {a.path}
            </a>
            <span className="text-slate-600"> — {a.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
