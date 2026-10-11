(() => {
  const theme = document.body.dataset.socoTheme || "arcade";
  const tracks = {
    chess: { notes: [196, 247, 294, 247], wave: "triangle", tempo: 112, fx: 392 },
    asteroids: { notes: [55, 73, 82, 110], wave: "sawtooth", tempo: 132, fx: 180 },
    pacman: { notes: [523, 659, 784, 659, 587, 740], wave: "square", tempo: 168, fx: 880 },
    sudoku: { notes: [262, 330, 392, 330], wave: "sine", tempo: 76, fx: 660 },
    checkers: { notes: [147, 175, 220, 175], wave: "triangle", tempo: 96, fx: 294 },
    arcade: { notes: [220, 277, 330, 277], wave: "triangle", tempo: 110, fx: 440 },
  };
  const track = tracks[theme] || tracks.arcade;
  let context, master, started = false, muted = false, beat = 0, timer;

  function ensureAudio() {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      context = new Audio();
      master = context.createGain();
      master.gain.value = 0.055;
      master.connect(context.destination);
    }
    if (context.state === "suspended") context.resume();
    return true;
  }

  function note(frequency, duration, volume) {
    if (!context || muted) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = track.wave;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.03);
  }

  function start() {
    if (!ensureAudio() || started) return;
    started = true;
    const playBeat = () => {
      note(track.notes[beat % track.notes.length], 0.26, theme === "pacman" ? 0.17 : 0.11);
      beat += 1;
    };
    playBeat();
    timer = window.setInterval(playBeat, Math.round(60000 / track.tempo));
  }

  function effect() {
    if (!started || muted) return;
    note(track.fx * (1 + (beat % 3) * 0.12), 0.09, 0.16);
  }

  function mountButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "soco-sound-toggle";
    button.setAttribute("aria-label", "Mute game sound");
    button.title = "Mute game sound";
    button.textContent = "🔊";
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!ensureAudio()) return;
      start();
      muted = !muted;
      master.gain.setTargetAtTime(muted ? 0.0001 : 0.055, context.currentTime, 0.03);
      button.textContent = muted ? "🔇" : "🔊";
      button.setAttribute("aria-label", muted ? "Unmute game sound" : "Mute game sound");
      button.title = muted ? "Unmute game sound" : "Mute game sound";
    });
    document.body.appendChild(button);
  }

  document.addEventListener("pointerdown", (event) => {
    const source = event.target instanceof Element ? event.target : null;
    if (!source || source.closest(".soco-sound-toggle")) return;
    const target = source.closest("button, canvas, .square, .cell, .board, .num-btn");
    if (!target) return;
    start();
    effect();
  }, { capture: true });
  document.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter", "w", "a", "s", "d"].includes(event.key)) {
      start();
      effect();
    }
  });
  window.addEventListener("beforeunload", () => window.clearInterval(timer));
  mountButton();
})();
