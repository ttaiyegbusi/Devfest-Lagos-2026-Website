// Ribbon geometry.
//
// All numbers below are authored against a 1440px-wide viewport (BASE_W) and
// multiplied by `vpScale` elsewhere, so the ribbon keeps identical proportions
// at any size. They were measured off the reference recording (1728×1040
// frames, converted to 1440 units) — steady-state card heights read
//   95, 95, 95, 95, 145, 230, 358, 520, 725  (px, centre → edge)
// i.e. a flat plateau of small cards inside the dark centre band, then
// roughly ×1.5 growth per card, with rotateY climbing to ~70° at the edges.
//
// A card's phase `lp ∈ [0,1)` runs from birth at the centre seam to fully
// offscreen past its edge. Position is the running sum of the cards' own
// apparent widths, so the ribbon is packed edge-to-edge by construction and
// the gaps widen automatically as the cards grow and turn.

export const BASE_W = 1440;
/** Card face size in base units (aspect ≈ 0.95, as measured). */
export const CARD_W = 270;
export const CARD_H = 284;

/** Cards per side. Must match PER_SIDE in PerspectiveGallery. */
export const N_PER_SIDE = 6;

// Cards are born small and grow continuously from the moment they appear —
// there is no flat plateau. A plateau freezes a newborn at full size for its
// first whole slot (~1.6s), which reads as "the images aren't growing".
const S0 = 0.225; // scale at birth → ~64px tall
const GROW_STEP = 1.53; // size ratio between adjacent cards
/**
 * Slight overlap. Cards must never show background between them — a gap makes
 * them read as separate tiles laid side by side; overlapping makes each one
 * visibly tuck behind its neighbour.
 */
const GAP = 0.97;
/** Half-width of the black seam the newborn pair straddles. */
const SEAM_HALF = 8;
// Measured rotation by card index: 0, 0, 20, 40, 57, 68, 75 degrees. The ramp
// is expressed per-card so it survives a change in N_PER_SIDE.
// Rotation is what makes the ribbon read as a *stack* rather than a filmstrip:
// the outer cards must turn hard enough to compress into narrow, steeply
// leaning slats that tuck behind one another. Measured off the reference by
// card index: 0, 0, ~10, 48, 64, 72 degrees — a late but very steep ramp.
const ROT_MAX = 90; // deg, asymptote
const ROT_RATE = 2.55 * (6 / N_PER_SIDE); // ramp rate, held constant per card
const ROT_START = 0.2; // lp before which cards stay front-facing
// Depth range kept mild: card size is set explicitly by `scaleAt`, so z is
// only there for subtle parallax — a deep range would fight the measured
// sizes via perspective foreshortening.
export const FAR_Z = -70;
export const NEAR_Z = 45;
/** The dark band sits just behind the deepest (centre) cards. */
export const BAND_Z = FAR_Z - 25;
/**
 * Must match `perspective` on .gallery in Hero.css. Measured off the
 * reference: its cards keystone by only ~8–11% between inner and outer edge,
 * which works out to a viewing distance of roughly 2000 base px. A tighter
 * perspective (we previously used 1000) trebles that distortion and makes each
 * card read as a wedge thrown at the viewer instead of a panel tucked behind
 * its neighbour.
 */
export const PERSPECTIVE = 2000;

// Geometric growth: a short plateau of equal-sized cards inside the dark band,
// then a constant size ratio between neighbours. Reproduces the measured
// heights 79, 79, 121, 192, 298, 433, 604 to within a few percent.
const GROW_K = Math.log(GROW_STEP) * N_PER_SIDE;
export const scaleAt = (lp: number) => S0 * Math.exp(GROW_K * lp);
export const ryAt = (lp: number) =>
  ROT_MAX * (1 - Math.exp(-ROT_RATE * Math.max(0, lp - ROT_START)));

const apparentW = (lp: number) =>
  CARD_W * scaleAt(lp) * Math.cos((ryAt(lp) * Math.PI) / 180);

// Precomputed cumulative-width profile: XS[i] = the inner edge of the card at
// lp = i/(SAMPLES-1). Built once; the shape never changes (only vpScale does).
//
// The integrand is shifted back half a slot. Cards tile when the run of the
// profile across one slot equals *that card's own* width; integrating the
// unshifted width instead advances by the slot's mean width, which for
// exponentially growing cards overshoots by ~GROW_K/(2·N) — about 20% of a
// card — and opens a visible gap between every pair of neighbours.
const HALF_SLOT = 0.5 / N_PER_SIDE;
const SAMPLES = 257;
const XS = new Float64Array(SAMPLES);
{
  const step = 1 / (SAMPLES - 1);
  const wShift = (s: number) => apparentW(Math.max(0, s - HALF_SLOT));
  let acc = 0;
  for (let i = 1; i < SAMPLES; i++) {
    const a = (i - 1) * step;
    const b = i * step;
    acc += 0.5 * (wShift(a) + wShift(b)) * N_PER_SIDE * GAP * step;
    XS[i] = acc;
  }
}

/**
 * Distance from the centre to a card's *centre*. XS accumulates the cards'
 * outer edges, so a card's centre is half its own width further out. That
 * half-width offset is what lets the two newborn cards sit side by side
 * against the centre line instead of on top of each other.
 */
export function xAt(lp: number): number {
  const c = Math.min(0.999999, Math.max(0, lp));
  const f = c * (SAMPLES - 1);
  const i = f | 0;
  const edge = XS[i] + (XS[i + 1] - XS[i]) * (f - i);
  return SEAM_HALF + edge + apparentW(c) / 2;
}

/** Smallest card height in base units. */
export const CENTRE_H = S0 * CARD_H;
/** Settled dark band, measured off the reference (346 × 86 in base units). */
export const BAND_HALF = 173;
export const BAND_H = 86;

// --- Bowtie seed -----------------------------------------------------------
// Proportions taken from the reference's seed frame: the silhouette is ~5.1×
// as wide as its end caps, and the ends are ~1.9× the waist. Both ratios
// relax as the shape grows into the flat strip.
export const BOWTIE_MAX_HALF = 381; // base px, half-width at hand-off
const THICK_RATIO = [5.12, 4.46]; // width ÷ end height
const PINCH_RATIO = [1.89, 1.37]; // end height ÷ waist height

/**
 * Both streams share the same phases (cards are born in mirrored pairs), so
 * during the opening a card at phase `lp` tiles the slot starting at lp — its
 * centre sits half a slot further out. The outermost card's centre is here.
 */
export const STRIP_MID = 0.5 / N_PER_SIDE;
const LP_MAX = (N_PER_SIDE - 1) / N_PER_SIDE + STRIP_MID;

/** Silhouette geometry for a given half-width and 0→1 relax amount. */
export function bowtieShape(bandHalfW: number, relax: number) {
  const endH = (bandHalfW * 2) / lerp(THICK_RATIO[0], THICK_RATIO[1], relax);
  const waistH = endH / lerp(PINCH_RATIO[0], PINCH_RATIO[1], relax);
  // Place the outermost card so its outer edge meets the silhouette's end cap.
  const cardHalf = (CARD_W * (endH / CARD_H)) / 2;
  const stripHalf = Math.max(0, (bandHalfW - cardHalf) / LP_MAX);
  return { endH, waistH, stripHalf };
}

/**
 * The dog-bone path: flat end caps with small rounded corners, joined by
 * quadratic curves that sweep in to the pinched waist. Drawn in base units
 * centred on the origin. When `waistH === endH` the curves degenerate to
 * straight lines, so the same path also renders the settled flat band.
 */
export function bowtiePath(
  halfW: number,
  endH: number,
  waistH: number
): string {
  const eh = endH / 2;
  const r = Math.max(0, Math.min(endH * 0.1, halfW * 0.4, eh * 0.9));
  // Control point placing the curve's midpoint exactly on the waist.
  const ycTop = eh - waistH;
  const ycBot = waistH - eh;
  const n = (v: number) => v.toFixed(2);
  return [
    `M${n(-halfW + r)},${n(-eh)}`,
    `Q0,${n(ycTop)} ${n(halfW - r)},${n(-eh)}`,
    `A${n(r)},${n(r)} 0 0 1 ${n(halfW)},${n(-eh + r)}`,
    `L${n(halfW)},${n(eh - r)}`,
    `A${n(r)},${n(r)} 0 0 1 ${n(halfW - r)},${n(eh)}`,
    `Q0,${n(ycBot)} ${n(-halfW + r)},${n(eh)}`,
    `A${n(r)},${n(r)} 0 0 1 ${n(-halfW)},${n(eh - r)}`,
    `L${n(-halfW)},${n(-eh + r)}`,
    `A${n(r)},${n(r)} 0 0 1 ${n(-halfW + r)},${n(-eh)}`,
    "Z",
  ].join("");
}

export interface CardTransform {
  x: number; // px, horizontal translate from centre
  z: number; // px, depth translate (CSS 3D)
  ry: number; // deg, rotateY
  scale: number;
}

export interface OpeningAnim {
  /** px (base units) — half-width of the drawn silhouette. */
  bandHalfW: number;
  /** px (base units) — silhouette height at the flat end caps. */
  endH: number;
  /** px (base units) — silhouette height at the pinched waist. */
  waistH: number;
  /** px (base units) — half-width of the card packing (inside the ends). */
  stripHalf: number;
  /** 0→1, strip unfolding into the final perspective field. */
  unfold: number;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Height of the bowtie silhouette at a distance `absX` from the centre.
 * A parabola: flat through the middle, bending up toward the ends — which is
 * exactly a quadratic Bézier, so the drawn path and this function agree.
 */
export function bowtieH(absX: number, a: OpeningAnim): number {
  if (a.bandHalfW <= 0) return 0;
  const u = Math.min(1, absX / a.bandHalfW);
  return a.waistH + (a.endH - a.waistH) * u * u;
}

/**
 * Blend of two layouts:
 *  • STRIP — the opening's flat ribbon. Each card is sized to the bowtie
 *    silhouette so it fits *entirely inside* the drawn path: we evaluate the
 *    profile at the card's inner edge, which (since the profile grows with
 *    |x|) is the lowest point across the card's span. No corner can ever poke
 *    through the smooth outline; the path alone defines the silhouette.
 *  • FINAL — the measured perspective field described above.
 */
export function cardTransform(
  lp: number,
  side: 1 | -1,
  anim: OpeningAnim
): CardTransform {
  // STRIP — each card tiles the slot beginning at `lp`, so its centre is half
  // a slot further out; the innermost pair then straddles the centre line.
  const stripX = side * anim.stripHalf * (lp + STRIP_MID);
  const absX = Math.abs(stripX);
  // Two passes: estimate the height at the centre, use it to find the card's
  // half-width, then re-evaluate at the inner edge.
  const half1 = (CARD_W * (bowtieH(absX, anim) / CARD_H)) / 2;
  const stripScale = bowtieH(Math.max(0, absX - half1), anim) / CARD_H;

  // FINAL
  const scale = scaleAt(lp);
  const finalX = side * xAt(lp);
  const finalRy = -side * ryAt(lp);
  const finalZ = lerp(FAR_Z, NEAR_Z, clamp01((lp - 0.25) / 0.75));

  // No depth bias for newborns: nudging them back puts them *behind* the dark
  // band, which hides them and leaves a black hole at the centre of the
  // ribbon. Cards are born small and tile exactly, so nothing pops anyway.
  const t = anim.unfold;
  return {
    x: lerp(stripX, finalX, t),
    z: lerp(0, finalZ, t),
    ry: lerp(0, finalRy, t),
    scale: lerp(stripScale, scale, t),
  };
}

// Easings — decisive ease-outs, no bounce (cubic-bezier(.16,1,.3,1) family).
export const easeOutQuad = (t: number) => 1 - Math.pow(1 - clamp01(t), 2);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
export const easeInQuad = (t: number) => clamp01(t) * clamp01(t);
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Map an absolute time (s) and a [start,end] window to eased 0→1 progress. */
export function phase(t: number, start: number, end: number): number {
  return clamp01((t - start) / (end - start));
}
