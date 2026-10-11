"use client";

import { useEffect, useRef } from "react";

const hilltopBannerUrl = "https://unfoldedtrade.com/bBXEVbs.dGGVli0SY/Wic_/keDm/9yumZXUnlMkOP/T/c/1/MRDsg_2nMVDUEQt/N/zYUuw-OHDrY/wpNpQK";

export function HilltopBanner({ placement }: { placement: "home" | "game" }) {
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = slot.current;
    if (!host || host.dataset.loaded) return;

    const script = document.createElement("script");
    (script as HTMLScriptElement & { settings: Record<string, unknown> }).settings = {};
    script.src = hilltopBannerUrl;
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";
    host.dataset.loaded = "true";
    host.appendChild(script);

    return () => {
      script.remove();
      delete host.dataset.loaded;
    };
  }, []);

  return <aside className={`hilltop-banner hilltop-banner--${placement}`} aria-label="Sponsored content"><span>Sponsored</span><div className="hilltop-banner-slot" ref={slot} /></aside>;
}
