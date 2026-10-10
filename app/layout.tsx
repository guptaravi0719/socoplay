import type { Metadata } from "next";
import Script from "next/script";
import { JsonLd } from "./components/json-ld";
import { siteSchema } from "./lib/seo";
import "./globals.css";
import "./seo.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://socoplay.com"),
  title: {
    default: "SocoPlay | Free Online Mini Games",
    template: "%s | SocoPlay",
  },
  description:
    "Play original free online mini games, including Solitaire, puzzle, memory, and word games. No download or account needed; progress saves on your device.",
  applicationName: "SocoPlay",
  category: "Games",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "SocoPlay",
    title: "SocoPlay | Free Online Mini Games",
    description: "Tiny games for satisfying breaks: play Solitaire, puzzles, memory, and word games in your browser.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "SocoPlay — Tiny games. Big breaks.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SocoPlay | Free Online Mini Games",
    description: "Tiny games for satisfying breaks: play Solitaire, puzzles, memory, and word games in your browser.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <JsonLd data={siteSchema} />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5695136510723463"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
