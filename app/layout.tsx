import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] }); const display = Fraunces({ variable: "--font-display", subsets: ["latin"] });
export const metadata: Metadata = { title: "SocoPlay — mini games that save on your device", description: "Original pick-up-and-play browser games. Resume Solitaire, puzzles, word games, and memory games on the same device." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className={`${sans.variable} ${display.variable}`}><Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5695136510723463" crossOrigin="anonymous" strategy="beforeInteractive" />{children}</body></html>; }
