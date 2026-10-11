"use client";

import Script from "next/script";
import { useState } from "react";

const hilltopScript = "https://unfolded-uncle.com/dKm/FEz.dhGvNPv_Z/GXUJ/Te_m/9/uAZpUglpk/PVT-cL1gMwDtga1hNozjcAt/Nyz/UlwROUDmUI4SMCQt";

export function HilltopAdsGate() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Script src={hilltopScript} strategy="afterInteractive" data-hilltopads="game-interstitial" />
      {open && (
        <section className="ad-play-gate" role="dialog" aria-modal="true" aria-labelledby="ad-play-gate-title">
          <div className="ad-play-gate-card">
            <p>SPONSORED BREAK</p>
            <h2 id="ad-play-gate-title">Your game is ready</h2>
            <span>Continue when you are ready to play.</span>
            <button type="button" onClick={() => setOpen(false)}>Continue to game <b>→</b></button>
          </div>
        </section>
      )}
    </>
  );
}
