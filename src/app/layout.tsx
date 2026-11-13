import type { Metadata, Viewport } from "next";
import { grotesk, inter, mono } from "@/lib/fonts";
import { portfolio } from "@/content/portfolio";
import "./globals.css";

export const metadata: Metadata = {
  title: `${portfolio.name} — ${portfolio.role}`,
  description: portfolio.tagline,
};

export const viewport: Viewport = {
  themeColor: "#06080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
