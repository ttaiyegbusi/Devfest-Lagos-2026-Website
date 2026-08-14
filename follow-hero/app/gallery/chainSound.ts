// The ribbon's chain sound, synthesised rather than sampled.
//
// A chain link's click is a burst of noise squeezed into a narrow frequency
// band with a very fast decay, plus a little low-end body — which is cheap to
// build with an oscillator and a filter, costs no download, and can be tuned
// (brighter, duller, tighter) by changing the numbers below rather than
// re-recording anything.
//
// Nothing is created until the user actually switches the sound on: browsers
// refuse to start audio without a gesture, and constructing an AudioContext
// on load leaves a suspended one hanging around on every visit.

/** Centre frequency of the click, Hz. Higher = thinner, more metallic. */
const TONE = 2300;
/** How sharply the click is filtered. Higher = more pitched, bell-like. */
const TONE_Q = 5.5;
/** Seconds. Beyond ~80ms it stops reading as a click and becomes a hiss. */
const CLICK_DECAY = 0.055;
/** Low thump under the click, Hz — gives the chain weight. */
const BODY = 130;
const BODY_DECAY = 0.07;

export interface ChainSound {
  setEnabled(on: boolean): void;
  /** `pan` -1..1, `intensity` 0..1 scales level and brightness. */
  tick(pan?: number, intensity?: number): void;
  dispose(): void;
}

export function createChainSound(): ChainSound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let on = false;

  const ensure = () => {
    if (ctx) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // One short buffer of white noise, reused by every click.
    const len = Math.floor(ctx.sampleRate * 0.25);
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  };

  return {
    setEnabled(next) {
      on = next;
      if (next) {
        ensure();
        void ctx!.resume();
        master!.gain.setTargetAtTime(0.5, ctx!.currentTime, 0.04);
      } else if (ctx && master) {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      }
    },

    tick(pan = 0, intensity = 1) {
      if (!on || !ctx || !master || !noise) return;
      const t = ctx.currentTime;
      const amt = Math.max(0.15, Math.min(1, intensity));

      const out = ctx.createStereoPanner();
      out.pan.value = Math.max(-1, Math.min(1, pan));
      out.connect(master);

      // --- click: filtered noise burst ---
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      // Detuned per hit, or a steady rate reads as a metronome.
      bp.frequency.value = TONE * (0.9 + Math.random() * 0.2) * (0.85 + amt * 0.3);
      bp.Q.value = TONE_Q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.9 * amt, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0005, t + CLICK_DECAY);
      src.connect(bp).connect(g).connect(out);
      src.start(t);
      src.stop(t + CLICK_DECAY + 0.02);

      // --- body: short low thump ---
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(BODY * (0.95 + Math.random() * 0.1), t);
      osc.frequency.exponentialRampToValueAtTime(BODY * 0.6, t + BODY_DECAY);
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0, t);
      bg.gain.linearRampToValueAtTime(0.35 * amt, t + 0.004);
      bg.gain.exponentialRampToValueAtTime(0.0005, t + BODY_DECAY);
      osc.connect(bg).connect(out);
      osc.start(t);
      osc.stop(t + BODY_DECAY + 0.02);
    },

    dispose() {
      void ctx?.close();
      ctx = null;
      master = null;
      noise = null;
    },
  };
}
