// Gallery card sources.
//
// Each card is either a CSS-painted "creative art" panel (`background`) or a
// real image (`image`). The reference hero mixes photographic outcomes with
// pure gradient/abstract panels; these vibrant CSS panels stand in for the
// photographic set. To use real photography instead, drop files into
// `src/assets/gallery/` and swap a card to `{ image: new URL("./…", import.meta.url).href }`.

export interface CardSource {
  id: string;
  /** CSS background shorthand painted onto the card face. */
  background?: string;
  /** Optional real image URL; takes precedence over `background`. */
  image?: string;
}

// A deliberately varied, saturated set — warm/cool, organic/graphic — so the
// travelling ribbon never reads as a repeating tile even with a small pool.
export const CARDS: CardSource[] = [
  {
    id: "crimson-bloom",
    background:
      "radial-gradient(120% 90% at 50% 30%, #ff5a5f 0%, #d61f3a 38%, #7a0b26 100%)",
  },
  {
    id: "cobalt-porcelain",
    background:
      "linear-gradient(150deg, #1b3fb0 0%, #2f6be0 45%, #9fc6ff 100%)",
  },
  {
    id: "ember-portrait",
    background:
      "radial-gradient(90% 120% at 70% 40%, #ff9d4d 0%, #e0561d 40%, #2a0f0a 100%)",
  },
  {
    id: "iridescent-wave",
    background:
      "conic-gradient(from 200deg at 40% 50%, #b7f5e6, #a5c8ff, #d9b3ff, #ffc7e0, #ffe7b3, #b7f5e6)",
  },
  {
    id: "meadow-sky",
    background:
      "linear-gradient(180deg, #6fb7ff 0%, #bfe3ff 34%, #7ec850 60%, #2f8f3e 100%)",
  },
  {
    id: "chartreuse-liquid",
    background:
      "radial-gradient(100% 80% at 30% 20%, #eaff6b 0%, #7bd12a 40%, #123d0d 100%)",
  },
  {
    // Kept off pure black: a near-black card reads as a hole punched in the
    // dark centre band rather than as part of the ribbon.
    id: "violet-molecule",
    background:
      "radial-gradient(40% 40% at 35% 35%, #e0bcff 0%, #9d57ff 38%, transparent 62%), radial-gradient(45% 45% at 70% 68%, #c98bff 0%, #7433d8 42%, transparent 66%), #2c1a52",
  },
  {
    id: "amber-motion",
    background:
      "repeating-linear-gradient(105deg, #ffd23f 0px, #ff8a1e 14px, #c85a12 26px, #ffb23f 40px)",
  },
  {
    id: "night-tunnel",
    background:
      "radial-gradient(60% 90% at 50% 55%, #4fa39b 0%, #1d5a61 45%, #10262c 100%)",
  },
  {
    id: "molten-orange",
    background:
      "radial-gradient(70% 70% at 45% 40%, #ffd08a 0%, #ff7a1a 42%, #b83500 100%)",
  },
  {
    id: "warm-skin",
    background:
      "radial-gradient(80% 100% at 60% 45%, #ffd9b0 0%, #d98a5a 40%, #3a1c12 100%)",
  },
  {
    id: "electric-teal",
    background:
      "linear-gradient(135deg, #00e0c6 0%, #0a83c7 50%, #062a5a 100%)",
  },
];
