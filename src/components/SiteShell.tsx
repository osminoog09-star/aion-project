import Link from "next/link";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

const primaryNav = [
  { href: ecosystemRoutes.home, label: "Платформа" },
  { href: ecosystemRoutes.ecosystem, label: "Экосистема" },
  { href: ecosystemRoutes.roadmap, label: "Roadmap" },
  { href: ecosystemRoutes.operations, label: "Операции" },
  { href: ecosystemRoutes.status, label: "Статус" },
  { href: ecosystemRoutes.releases, label: "Релизы" },
  { href: ecosystemRoutes.control, label: "Control" },
] as const;

const moduleNav = [
  { href: ecosystemRoutes.aionProject, label: "Driver" },
  { href: ecosystemRoutes.link, label: "Link" },
  { href: ecosystemRoutes.core, label: "Core" },
  { href: ecosystemRoutes.downloads, label: "Downloads" },
  { href: ecosystemRoutes.ai, label: "AI" },
  { href: ecosystemRoutes.aiContext, label: "AI ctx" },
  { href: ecosystemRoutes.studio, label: "Studio" },
] as const;

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="aion-root flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-cyan-500/15 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="font-semibold tracking-[0.35em] text-cyan-300/95">
            AION
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 text-sm md:gap-3">
            {primaryNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-2 py-1.5 text-slate-400 transition hover:bg-white/5 hover:text-cyan-200 md:px-3"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/5 bg-slate-950/90 px-4 py-8 text-center md:px-6">
        <nav className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
          {moduleNav.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-cyan-400/90">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mx-auto mt-4 max-w-2xl text-xs text-slate-600">
          Экосистемная AI-платформа <span className="font-mono text-slate-500">www.aion.com</span> · модуль Driver:{" "}
          <span className="font-mono text-slate-500">{ecosystemRoutes.aionProject}</span> · roadmap/релизы: JSON +
          публичные снимки Supabase.
        </p>
      </footer>
    </div>
  );
}
