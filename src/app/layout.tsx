import type { Metadata, Viewport } from "next";
import { grotesk, inter, mono } from "@/lib/fonts";
import { portfolio } from "@/content/portfolio";
import { SEO_DESCRIPTION, SEO_KEYWORDS, SEO_TITLE, SITE_URL, jsonLd } from "@/lib/seo";
import "./globals.css";

const [first, ...rest] = portfolio.name.split(" ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  applicationName: portfolio.name,
  authors: [{ name: portfolio.name, url: SITE_URL }],
  creator: portfolio.name,
  keywords: SEO_KEYWORDS,
  category: "technology",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: portfolio.name,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    locale: "en_US",
    firstName: first,
    lastName: rest.join(" "),
    username: portfolio.handle,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#06080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable} ${inter.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
