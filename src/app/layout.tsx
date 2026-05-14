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
    "AION.COM (www.aion.com): публичная платформа экосистемы — операции, roadmap, релизы; продукт AION Driver описан в разделе /aionproject. Облако подключается опционально.",
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
      "Public ecosystem platform at www.aion.com — operations, roadmap, releases; flagship Driver product hub at /aionproject.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AION — ecosystem platform",
    description: "Public ecosystem portal — /aionproject, releases, roadmap, control.",
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
