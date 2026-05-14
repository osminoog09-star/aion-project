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
    default: "AION — экосистема для профессионального водителя",
    template: "%s · AION",
  },
  description:
    "AION.COM: публичный портал экосистемы — AION Driver, roadmap, релизы и control center. Данные из репозитория; облако подключается на следующих этапах.",
  applicationName: "AION",
  keywords: ["AION", "AION Driver", "roadmap", "releases", "OTA", "APK", "ecosystem"],
  authors: [{ name: "AION" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: site,
    siteName: "AION",
    title: "AION — ecosystem platform",
    description:
      "Public portal: flagship driver app, release center, roadmap, and operations foundation.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AION — ecosystem platform",
    description: "Public ecosystem portal — driver, releases, roadmap, control.",
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
