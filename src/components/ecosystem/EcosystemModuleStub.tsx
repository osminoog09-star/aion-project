import type { Metadata } from "next";
import Link from "next/link";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";

type StubProps = {
  title: string;
  description: string;
  path: string;
  body: string;
};

type StubMeta = Pick<StubProps, "title" | "description" | "path">;

export function ecosystemModuleMetadata({ title, description, path }: StubMeta): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
  };
}

export function EcosystemModuleStub({ title, path, body }: StubProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Ecosystem module</p>
      <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">{body}</p>
      <p className="mt-8 text-xs text-slate-600">
        Канонический URL: <span className="font-mono text-slate-500">{path}</span> ·{" "}
        <Link href={ecosystemRoutes.home} className="text-cyan-500/90 hover:underline">
          На главную
        </Link>{" "}
        ·{" "}
        <Link href={ecosystemRoutes.aionProject} className="text-cyan-500/90 hover:underline">
          AION Driver
        </Link>
      </p>
    </div>
  );
}
