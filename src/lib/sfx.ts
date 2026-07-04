// Tiny WebAudio synth for tactile feedback. No assets, fails silently.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, delay = 0, type: OscillatorType = "sine", gain = 0.06) {
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    /* ignore */
  }
}

export const sfx = {
  tap: () => tone(520, 0.05, 0, "triangle", 0.035),
  correct: () => {
    tone(523.25, 0.1);
    tone(783.99, 0.16, 0.07);
  },
  wrong: () => tone(174.6, 0.22, 0, "square", 0.03),
  combo: () => {
    tone(659.25, 0.08);
    tone(880, 0.1, 0.06);
    tone(1174.66, 0.14, 0.12);
  },
  fanfare: () => {
    tone(523.25, 0.12);
    tone(659.25, 0.12, 0.1);
    tone(783.99, 0.12, 0.2);
    tone(1046.5, 0.3, 0.3);
  },
};
