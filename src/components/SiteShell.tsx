import Link from "next/link";

const links = [
  { href: "/", label: "Экосистема" },
  { href: "/driver", label: "AION Driver" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/releases", label: "Релизы" },
  { href: "/control", label: "Control" },
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
            {links.map((l) => (
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
      <footer className="border-t border-white/5 bg-slate-950/90 py-8 text-center text-xs text-slate-600">
        Данные roadmap и релизов — из репозитория (JSON), до облачной синхронизации.
      </footer>
    </div>
  );
}
