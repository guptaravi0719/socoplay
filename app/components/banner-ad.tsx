"use client";

import { useEffect, useRef } from "react";

const bannerScriptUrl = "https://unfoldedtrade.com/bjX/V/s/d.GvlA0rYIWXcZ/SeZm/9du/ZvUdlCkIP/TZch1_MrD/g/2kMDDQEwtNN/zKUGwmOJDKYdwINEQj";

export function BannerAd({ placement }: { placement: "home" | "game" }) {
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = slot.current;
    if (!host || host.dataset.loaded) return;

    const script = document.createElement("script");
    (script as HTMLScriptElement & { settings: Record<string, unknown> }).settings = {};
    script.src = bannerScriptUrl;
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";
    host.dataset.loaded = "true";
    host.appendChild(script);

    return () => {
      script.remove();
      delete host.dataset.loaded;
    };
  }, []);

  return <aside className={`banner-ad banner-ad--${placement}`} aria-label="Advertisement"><span>Advertisement</span><div className="banner-ad-slot" ref={slot} /></aside>;
}
