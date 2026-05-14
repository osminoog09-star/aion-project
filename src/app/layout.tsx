import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/SiteShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AION — экосистема для профессионального водителя",
  description:
    "AION.COM: портал экосистемы, флагман AION Driver, roadmap и релизы. Управляемые данные из репозитория до облачной синхронизации.",
  openGraph: {
    title: "AION Ecosystem",
    description: "AI operating system for drivers — portal, driver app, cloud roadmap.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full text-slate-100">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
