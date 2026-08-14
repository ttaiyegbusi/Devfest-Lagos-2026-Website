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

// Declared first: the profile below is built at module load and calls it.
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const BASE_W = 1440;
/** Card face size in base units (aspect ≈ 0.95, as measured). */
export const CARD_W = 270;
export const CARD_H = 284;

/**
 * Cards per side. Must match PER_SIDE in PerspectiveGallery.
 *
 * Nine rather than six: cards are born as slivers and grow, so the innermost
 * few are tiny and sit inside the dark band. They exist to keep the centre
 * continuously covered — with too few, the gap a departing pair leaves behind
 * is not filled until the next pair spawns, and the centre visibly blanks.
 */
export const N_PER_SIDE = 10;

// Cards are born small and grow continuously from the moment they appear —
// there is no flat plateau. A plateau freezes a newborn at full size for its
// first whole slot (~1.6s), which reads as "the images aren't growing".
const S0 = 0.0493; // scale at birth → ~14px tall, a sliver
const GROW_STEP = 1.53; // size ratio between adjacent cards
/**
 * Spacing as a fraction of a card's own width. Below 1 the cards overlap, and
 * they must: any background showing between them makes the ribbon read as
 * separate tiles laid side by side rather than a stack.
 *
 * The innermost slots overlap hard. Only one card occupies the first slot at a
 * time, so as it travels outward it uncovers the centre and nothing fills the
 * space until the next pair spawns — the centre visibly blanks between births.
 * Piling the first couple of slots on top of each other keeps a photograph
 * spanning the centre at every instant.
 */
const GAP_CENTRE = 0.4;
const GAP_OUTER = 0.97;
const gapAt = (lp: number) =>
  lerp(GAP_CENTRE, GAP_OUTER, Math.min(1, lp / (3.5 / N_PER_SIDE)));
/**
 * Negative, so the innermost card's inner edge sits *past* the centre line and
 * the mirrored pair always overlaps there. Zero would leave the pair meeting
 * exactly, and any drift between births reopens a sliver of blank centre.
 */
const SEAM_HALF = -8;

// Rotation as a function of distance from centre, rather than of card index —
// so it is unaffected by how many cards per side we run. Fitted to the
// reference, whose cards read 0° at x=51 and x=127, then 20°, 40°, 57°, 68° at
// x = 227, 344, 482, 626 (base units).
const ROT_MAX = 90; // deg, asymptote
const ROT_K = 0.00288; // per base px
const ROT_X0 = 140; // px from centre before a card starts to turn
const ryAtX = (absX: number) =>
  ROT_MAX * (1 - Math.exp(-ROT_K * Math.max(0, absX - ROT_X0)));

/** The dark band sits just behind the centre cards, which rest at z = 0. */
export const BAND_Z = -80;
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

// Precomputed cumulative-width profile: XS[i] = the inner edge of the card at
// lp = i/(SAMPLES-1). Built once; the shape never changes (only vpScale does).
//
// The integrand is shifted back half a slot. Cards tile when the run of the
// profile across one slot equals *that card's own* width; integrating the
// unshifted width instead advances by the slot's mean width, which for
// exponentially growing cards overshoots by ~GROW_K/(2·N) — about 20% of a
// card — and opens a visible gap between every pair of neighbours.
// Rotation depends on distance from centre, and distance is the running sum of
// the (rotation-narrowed) widths — so the two are solved together, marching
// outward and reading rotation from the position reached so far.
const HALF_SLOT = 0.5 / N_PER_SIDE;
const SAMPLES = 513;
const XS = new Float64Array(SAMPLES); // inner edge of the card at this phase
const RYS = new Float64Array(SAMPLES); // its rotation, in degrees
{
  const step = 1 / (SAMPLES - 1);
  const scaleShift = (s: number) => scaleAt(Math.max(0, s - HALF_SLOT));
  const widthAt = (sc: number, ry: number) =>
    CARD_W * sc * Math.cos((ry * Math.PI) / 180);

  let edge = 0;
  RYS[0] = ryAtX(widthAt(scaleShift(0), 0) / 2);
  for (let i = 1; i < SAMPLES; i++) {
    const wA = widthAt(scaleShift((i - 1) * step), RYS[i - 1]);
    // Rotation for this sample, taken at the card's centre.
    const ryB = ryAtX(edge + wA / 2);
    const wB = widthAt(scaleShift(i * step), ryB);
    edge += 0.5 * (wA + wB) * N_PER_SIDE * gapAt(i * step) * step;
    XS[i] = edge;
    RYS[i] = ryB;
  }
}

const sample = (arr: Float64Array, lp: number) => {
  const f = Math.min(0.999999, Math.max(0, lp)) * (SAMPLES - 1);
  const i = f | 0;
  return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
};

export const ryAt = (lp: number) => sample(RYS, lp);

const apparentW = (lp: number) =>
  CARD_W * scaleAt(lp) * Math.cos((ryAt(lp) * Math.PI) / 180);

/**
 * Distance from the centre to a card's *centre*. XS accumulates the cards'
 * outer edges, so a card's centre is half its own width further out. That
 * half-width offset is what lets the two newborn cards sit side by side
 * against the centre line instead of on top of each other.
 */
export function xAt(lp: number): number {
  return SEAM_HALF + sample(XS, lp) + apparentW(lp) / 2;
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
  x: number; // px, horizontal translate from centre (pre-perspective)
  z: number; // px, depth translate (CSS 3D)
  ry: number; // deg, rotateY
  scale: number; // CSS scale (pre-perspective)
  /** Height the card actually occupies on screen, for offscreen tests. */
  screenScale: number;
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

  // FINAL — these are the sizes and positions we want *on screen*.
  const t = anim.unfold;
  const screenScale = lerp(stripScale, scaleAt(lp), t);
  const screenX = lerp(stripX, side * xAt(lp), t);
  const ry = lerp(0, -side * ryAt(lp), t);

  // Depth is what makes the ribbon stack. A card's growth outward is delivered
  // by moving it *toward the camera* rather than by scaling it up: every card
  // keeps the same size in 3D and perspective does the enlarging. Because each
  // card outward is genuinely nearer, it occludes the one inside it — which is
  // the stacking order the reference shows. Scaling cards up in place instead
  // leaves them coplanar, and then each card's own lean decides the order,
  // which puts the *inner* card in front — backwards.
  //
  // `gain` is the perspective magnification P/(P−z). It runs from 1 while the
  // ribbon is still a flat strip to scale/S0 once unfolded, so the opening
  // stays flat and the depth arrives with the unfold.
  const gain = lerp(1, scaleAt(lp) / S0, t);
  return {
    x: screenX / gain,
    z: PERSPECTIVE * (1 - 1 / gain),
    ry,
    // Divided out, so screen size is scale × gain === screenScale.
    scale: screenScale / gain,
    screenScale,
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
