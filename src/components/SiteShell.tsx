import Link from "next/link";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

const primaryNav = [
  { href: ecosystemRoutes.home, label: "Экосистема" },
  { href: ecosystemRoutes.ecosystem, label: "Live" },
  { href: ecosystemRoutes.operations, label: "Ops" },
  { href: ecosystemRoutes.aionProject, label: "Project" },
  { href: ecosystemRoutes.status, label: "Статус" },
  { href: ecosystemRoutes.roadmap, label: "Roadmap" },
  { href: ecosystemRoutes.releases, label: "Релизы" },
  { href: ecosystemRoutes.control, label: "Hub" },
] as const;

const moduleNav = [
  { href: ecosystemRoutes.downloads, label: "Downloads" },
  { href: ecosystemRoutes.ai, label: "AI" },
  { href: ecosystemRoutes.core, label: "Core" },
  { href: ecosystemRoutes.studio, label: "Studio" },
  { href: ecosystemRoutes.link, label: "Link" },
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
          Платформа: <span className="font-mono text-slate-500">www.aion.com</span> · продукт Driver:{" "}
          <span className="font-mono text-slate-500">{ecosystemRoutes.aionProject}</span> · roadmap/релизы: JSON +
          публичные снимки Supabase.
        </p>
      </footer>
    </div>
  );
}
