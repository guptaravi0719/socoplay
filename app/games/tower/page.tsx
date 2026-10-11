"use client";

import Link from "next/link";

export default function TowerStack() {
  return (
    <main className="tower-game-page">
      <header className="tower-nav">
        <Link className="tower-brand" href="/"><span>◆</span> SocoPlay</Link>
        <Link className="tower-back" href="/">← All games</Link>
      </header>
      <section className="tower-stage">
        <div className="tower-intro"><p>ARCADE STACKER</p><h1>Tower Stack</h1><span>Tap the screen when the swinging block lines up with your tower.</span></div>
        <div className="tower-frame-wrap">
          <iframe className="tower-frame" src="/tower-game/index.html" title="Tower Stack game" allow="autoplay" />
        </div>
      </section>
    </main>
  );
}
