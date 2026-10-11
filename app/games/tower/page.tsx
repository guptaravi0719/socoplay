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
        <h1 className="sr-only">Tower Stack</h1>
        <div className="tower-frame-wrap">
          <iframe className="tower-frame" src="/tower-game/index.html" title="Tower Stack game" allow="autoplay" />
        </div>
      </section>
    </main>
  );
}
