"use client";

export default function TowerStack() {
  return (
    <main className="tower-game-page">
      <header className="tower-nav">
        <a className="tower-exit" href="/"><span aria-hidden="true">🚪</span> Exit game</a>
      </header>
      <section className="tower-stage">
        <h1 className="sr-only">Tower Stack</h1>
        <div className="tower-frame-wrap">
          <iframe className="tower-frame" src="/tower-game/" title="Tower Stack game" allow="autoplay; fullscreen" allowFullScreen />
        </div>
      </section>
    </main>
  );
}
