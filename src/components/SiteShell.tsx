import Link from "next/link";
import { t } from "@/i18n";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

const primaryNav = [
  { href: ecosystemRoutes.home, label: "Обзор" },
  { href: ecosystemRoutes.aionProject, label: "Driver" },
  { href: ecosystemRoutes.roadmap, label: "Прогресс" },
  { href: ecosystemRoutes.operations, label: "Операции" },
  { href: ecosystemRoutes.releases, label: "Релизы" },
] as const;

const moduleNav = [
  { href: ecosystemRoutes.aionProject, label: t("nav.driver") },
  { href: ecosystemRoutes.roadmapExecution, label: t("nav.execute") },
  { href: ecosystemRoutes.operationsContext, label: t("nav.opsCtx") },
  { href: ecosystemRoutes.operationsTimeline, label: t("nav.timeline") },
  { href: ecosystemRoutes.link, label: t("nav.link") },
  { href: ecosystemRoutes.core, label: t("nav.core") },
  { href: ecosystemRoutes.downloads, label: t("nav.downloads") },
  { href: ecosystemRoutes.ai, label: t("nav.ai") },
  { href: ecosystemRoutes.aiContext, label: t("nav.aiCtx") },
  { href: ecosystemRoutes.studio, label: t("nav.studio") },
] as const;

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="aion-root flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b0d]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-[0.2em] text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            AION
          </Link>
          <nav className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] md:gap-2">
            {primaryNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-md px-2 py-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white md:px-3"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 bg-[#090b0d] px-4 py-8 text-center md:px-6">
        <nav className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
          {moduleNav.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-cyan-400/90">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mx-auto mt-4 max-w-2xl text-xs text-slate-400">
          AION Project · Driver, операции, прогресс и релизы. Данные обновляются автоматически.
        </p>
      </footer>
    </div>
  );
}
