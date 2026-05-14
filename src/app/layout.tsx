import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EcosystemRealtimeBridge } from "@/components/EcosystemRealtimeBridge";
import { SiteShell } from "@/components/SiteShell";
import { getMetadataBase, getSiteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const site = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "AION — экосистемная AI-платформа и realtime-инфраструктура",
    template: "%s · AION",
  },
  description:
    "www.aion.com — публичный центр экосистемы AION: AI-слой, облачные операции, модульная архитектура, мультиустройство и realtime. Модуль AION Driver (транспортный кокпит) — в разделе /aionproject. Облако подключается опционально.",
  applicationName: "AION",
  keywords: [
    "AION",
    "AI platform",
    "realtime ecosystem",
    "cloud operations",
    "modular platform",
    "AION Driver",
    "roadmap",
    "releases",
    "OTA",
    "APK",
  ],
  authors: [{ name: "AION" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: site,
    siteName: "AION",
    title: "AION — AI ecosystem platform",
    description:
      "Modular realtime ecosystem: cloud ops, multi-device architecture, public portal at www.aion.com. AION Driver is one active module — /aionproject.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AION — AI ecosystem platform",
    description: "Ecosystem platform: operations, roadmap, releases; Driver module at /aionproject.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full text-slate-100">
        <SiteShell>
          <EcosystemRealtimeBridge />
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
