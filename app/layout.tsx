import type { Metadata } from "next";
import { JsonLd } from "./components/json-ld";
import { GameEnhancements } from "./components/game-enhancements";
import { siteSchema } from "./lib/seo";
import "./globals.css";
import "./seo.css";
import "./arcade.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://socoplay.com"),
  title: {
    default: "SocoPlay | Free Online Mini Games",
    template: "%s | SocoPlay",
  },
  description: "Play original free online mini games, including Solitaire, 2048, and Tower Stack. No download or account needed.",
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
    description: "Tiny games for satisfying breaks: play Solitaire, 2048, and Tower Stack online.",
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
    description: "Tiny games for satisfying breaks: play Solitaire, 2048, and Tower Stack online.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5695136510723463" crossOrigin="anonymous" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TXS9H43TXZ" />
        <script
          dangerouslySetInnerHTML={{
            __html: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-TXS9H43TXZ');",
          }}
        />
      </head>
      <body>
        <JsonLd data={siteSchema} />
        {children}
        <GameEnhancements />
      </body>
    </html>
  );
}
