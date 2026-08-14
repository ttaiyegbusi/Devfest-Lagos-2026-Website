"use client";

import { useEffect, useMemo, useRef } from "react";
import { CARDS } from "./cards";
import type { ChainSound } from "./chainSound";
import {
  BAND_H,
  BAND_HALF,
  BAND_Z,
  BASE_W,
  CARD_W,
  BOWTIE_MAX_HALF,
  PERSPECTIVE,
  bowtiePath,
  bowtieShape,
  cardTransform,
  easeInQuad,
  easeOutQuad,
  easeOutQuart,
  lerp,
  N_PER_SIDE,
  phase,
  type OpeningAnim,
} from "./transforms";

// Two mirrored streams diverge from the centre seam, born as pairs. Each
// card's phase lp ∈ [0,1) advances linearly in time while its distance from
// centre grows super-linearly (see transforms.ts), so centre cards creep and
// edge cards accelerate offscreen. On wrap the card is reborn at the centre —
// by lp=1 it is fully clear of the viewport, so the swap is never seen.
const PER_SIDE = N_PER_SIDE;
const TOTAL = PER_SIDE * 2;
/** Seconds for one card to travel centre → offscreen. */
const TRAVERSE = 9.5;
const PHASE_SPEED = 1 / TRAVERSE;

// --- Drag-to-spin ----------------------------------------------------------
// Dragging suspends the outward drift and turns the ribbon into a carousel:
// every card walks the same way round, through the centre and out the far
// side, wrapping edge to edge so it never runs out. Position is untouched by
// the switch — only each card's *direction* changes — so it is seamless in and
// out. Releasing lets the spin decay, and the outward drift fades back in.
/** Pixels of drag equal to one full centre→edge traverse. */
const DRAG_PX_PER_PHASE = 520;
/** Per-second velocity retained after release. */
const SPIN_FRICTION = 0.055;
/** Below this the spin is over and the ribbon is back to its own drift. */
const SPIN_MIN = PHASE_SPEED * 0.05;
/** Chain clicks spread across the opening unfold. */
const OPEN_TICKS = 18;

interface Card {
  /** Which half of the ribbon it is on. Flips when it crosses the centre. */
  side: 1 | -1;
  /** 0 at the centre seam, 1 fully offscreen past its edge. */
  lp: number;
  src: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The 3D image ribbon. Owns the master hero clock: it advances the diverging
 * streams and writes the opening-timeline progress (headline / paragraph /
 * prompt) as CSS custom properties onto `rootRef`, so the static DOM content
 * animates through CSS without per-frame React renders.
 */
export function PerspectiveGallery({
  rootRef,
  active,
  soundRef,
  replayRef,
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  active: boolean;
  /** Chain sound, owned by Hero so the toggle can reach it too. */
  soundRef: React.RefObject<ChainSound | null>;
  /**
   * Bumped to replay the opening. The rattle belongs to the unfold, which has
   * already run by the time anyone can switch the sound on — browsers refuse
   * audio before a gesture — so enabling it rewinds the hero to let you hear.
   */
  replayRef: React.RefObject<number>;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const faceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maskRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Stable card set: two mirrored streams, evenly phased centre→edge, the
  // right stream staggered half a step so the sides interleave at the seam.
  const cards = useMemo<Card[]>(
    () =>
      Array.from({ length: TOTAL }, (_, i) => {
        const j = i % PER_SIDE;
        // Both streams share the same phases, so cards are born as mirrored
        // pairs: two appear at the centre together, grow together, then part.
        return {
          side: (i < PER_SIDE ? -1 : 1) as 1 | -1,
          lp: j / PER_SIDE,
          src: i % CARDS.length,
        };
      }),
    []
  );

  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = prefersReducedMotion();
    // Calibration aid: ?t=0.75 freezes the opening clock at that second.
    const freezeParam = new URLSearchParams(window.location.search).get("t");
    const freezeT = freezeParam !== null ? parseFloat(freezeParam) : null;

    let nextSrc = TOTAL;
    let raf = 0;
    let start = 0;
    let last = 0;
    // Spin state. `spinV` is phase per second; positive drives cards rightward.
    let spinV = 0;
    let dragging = false;
    // Chain-rattle bookkeeping across the opening unfold.
    let prevUnfold = 0;
    let unfoldTicks = 0;
    let openTick = 0;
    let replaySeen = replayRef.current;

    const applyFace = (i: number, src: number) => {
      const face = faceRefs.current[i];
      if (!face) return;
      const card = CARDS[src];
      // Clear the shorthand *before* setting the longhand: `background = ""`
      // drops every background longhand from the inline style, so doing it
      // afterwards would wipe the image we just assigned.
      if (card.image) {
        face.style.background = "";
        face.style.backgroundImage = `url("${card.image}")`;
      } else {
        face.style.backgroundImage = "";
        face.style.background = card.background ?? "";
      }
    };

    // Viewport scale: the whole ribbon is authored at BASE_W and scaled.
    const vpScale = () =>
      Math.min(1.45, Math.max(0.42, window.innerWidth / BASE_W));

    // maskT drives the per-card black dissolve, centre cards first — matching
    // the reference, where at ~0.75s the middle images have resolved while the
    // wings are still solid black.
    const writeCards = (anim: OpeningAnim, maskT: number) => {
      const vs = vpScale();
      const halfW = window.innerWidth / 2;
      // Depth is scaled with everything else, so the viewing distance has to
      // scale too — otherwise the perspective magnification the geometry
      // assumed stops matching what the browser applies.
      if (stageRef.current)
        stageRef.current.style.perspective = `${(PERSPECTIVE * vs).toFixed(
          0
        )}px`;

      for (let i = 0; i < cards.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const c = cards[i];
        const t = cardTransform(c.lp, c.side, anim);
        // Perspective magnification this card's depth will apply.
        const gain = t.screenScale / t.scale;
        const x = t.x * vs;
        const scale = t.scale * vs;
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(
          1
        )}px, 0, ${(t.z * vs).toFixed(1)}px) rotateY(${t.ry.toFixed(
          2
        )}deg) scale(${scale.toFixed(4)})`;

        // Per-card black dissolve, centre cards first.
        const op = 1 - Math.min(1, Math.max(0, (maskT * 1.35 - c.lp) / 0.25));
        const mask = maskRefs.current[i];
        if (mask) mask.style.opacity = op.toFixed(3);

        // While a card is still fully masked it is pure black on a pure black
        // silhouette — invisible, but its edges and shadow would striate the
        // drawn path. Hide it until its image starts resolving, so the seed
        // reads as one clean shape.
        // Judged on what the card covers *on screen*. `t.x` and `t.scale` are
        // pre-perspective, so both are far smaller than the rendered result.
        const onX = t.x * gain * vs;
        const halfCard = (CARD_W / 2) * t.screenScale * vs + 20;
        const offscreen =
          Math.abs(onX) - halfCard > halfW || t.screenScale < 0.004;
        el.style.visibility =
          offscreen || op > 0.995 ? "hidden" : "visible";
      }

      // The drawn silhouette: the smooth bowtie during the opening, morphing
      // into the persistent dark strip behind the centre filmstrip. It sits
      // behind the deepest cards, so its rendered size is foreshortened by the
      // perspective — divide that back out so the on-screen size is exact.
      const band = bandRef.current;
      const path = pathRef.current;
      if (band && path) {
        const halfW = anim.bandHalfW;
        const endH = Math.max(anim.endH, 0.01);
        band.setAttribute(
          "viewBox",
          `${-halfW} ${-endH / 2} ${2 * halfW} ${endH}`
        );
        path.setAttribute("d", bowtiePath(halfW, endH, anim.waistH));
        // vs cancels: both the depth and the viewing distance scale with it.
        const unshrink = (PERSPECTIVE + Math.abs(BAND_Z)) / PERSPECTIVE;
        band.style.width = `${(2 * halfW * vs * unshrink).toFixed(1)}px`;
        band.style.height = `${(endH * vs * unshrink).toFixed(1)}px`;
        band.style.transform = `translate(-50%, -50%) translateZ(${(
          BAND_Z * vs
        ).toFixed(1)}px)`;
        band.style.opacity = halfW > 3 ? "1" : "0";
      }
    };

    const setVar = (name: string, v: number) =>
      root.style.setProperty(name, v.toFixed(4));

    const settled: OpeningAnim = {
      bandHalfW: BAND_HALF,
      endH: BAND_H,
      waistH: BAND_H,
      stripHalf: 0,
      unfold: 1,
    };

    // Reduced motion: render the settled field once, no travel, no masks.
    if (reduced) {
      setVar("--headline", 1);
      setVar("--para", 1);
      setVar("--prompt", 1);
      writeCards(settled, 2);
      return;
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!start) {
        start = now;
        last = now;
      }
      // Pause travel while offscreen, but keep the loop light.
      if (!activeRef.current) {
        last = now;
        return;
      }
      // Rewind and play the opening again.
      if (replayRef.current !== replaySeen) {
        replaySeen = replayRef.current;
        start = now;
        spinV = 0;
        prevUnfold = 0;
        unfoldTicks = 0;
        for (let i = 0; i < cards.length; i++) {
          cards[i].side = (i < PER_SIDE ? -1 : 1) as 1 | -1;
          cards[i].lp = (i % PER_SIDE) / PER_SIDE;
        }
      }
      const t = freezeT ?? (now - start) / 1000;
      const dt = freezeT !== null ? 0 : Math.min((now - last) / 1000, 0.05);
      last = now;

      // --- Opening timeline, calibrated against the reference recording
      // (measurements in base-1440 units):
      //   0.15s  bowtie 162 wide · waist 33px · ends 46px · solid black
      //   0.50s  392 wide · waist 52 · ends 79 · still black
      //   0.75s  520 wide · waist 62 · ends 92 · centre images resolving
      //   1.00s  762 wide · waist 125 · ends 171 · flat strip, colour resolved
      //   1.0–1.7s  strip unfolds into the perspective field
      //
      // The silhouette is driven by its half-width alone; thickness and pinch
      // follow from the measured proportions, relaxing as it becomes the strip.
      const unfold = easeOutQuart(phase(t, 1.0, 1.72));
      const seedHalf =
        BOWTIE_MAX_HALF *
        (0.8 * Math.sqrt(phase(t, 0.1, 1.0)) +
          0.2 * easeInQuad(phase(t, 0.65, 1.02)));
      const seed = bowtieShape(seedHalf, phase(t, 0.5, 1.0));
      // Once unfolding, the silhouette contracts to the settled centre strip.
      const finalHalf = BAND_HALF;
      const finalH = BAND_H;
      const anim: OpeningAnim = {
        bandHalfW: lerp(seedHalf, finalHalf, unfold),
        endH: lerp(seed.endH, finalH, unfold),
        waistH: lerp(seed.waistH, finalH, unfold),
        stripHalf: seed.stripHalf,
        unfold,
      };
      const maskT = phase(t, 0.55, 1.05);

      setVar("--headline", easeOutQuart(phase(t, 0.95, 1.6)));
      setVar("--para", easeOutQuart(phase(t, 1.15, 1.75)));
      setVar("--prompt", easeOutQuart(phase(t, 1.25, 1.85)));

      // --- Motion. Two rules over the same positions:
      //   drift — every card walks outward, away from the centre;
      //   spin  — every card walks the same way round, so cards cross the
      //           centre, shrink through the band and grow out the far side.
      // Only the direction differs, so switching between them never moves a
      // card; `w` crossfades from drift to spin as the spin outruns the drift.
      if (!dragging) {
        spinV *= Math.pow(SPIN_FRICTION, dt);
        if (Math.abs(spinV) < SPIN_MIN) spinV = 0;
      }
      // Drift is held back until the opening has unfolded; the ramp overlaps
      // its tail so the ribbon is already moving as it finishes opening.
      const drift = PHASE_SPEED * easeOutQuad(phase(t, 1.15, 1.9));
      const w = dragging ? 1 : Math.min(1, Math.abs(spinV) / PHASE_SPEED);

      // Every card advances by the same amount; only the sign differs, so the
      // distance travelled this frame is a single number.
      const travelled = Math.abs(lerp(drift, spinV, w)) * dt;

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        // Outward is +lp on both sides; rightward is +lp on the right half and
        // −lp on the left, which is what carries a card through the centre.
        c.lp += lerp(drift, c.side * spinV, w) * dt;

        if (c.lp < 0) {
          // Crossed the centre seam — same card, other half of the ribbon.
          c.side = (c.side === 1 ? -1 : 1) as 1 | -1;
          c.lp = -c.lp;
        } else if (c.lp >= 1) {
          if (w > 0.5) {
            // Spinning: off one edge, back on at the opposite one, still
            // travelling the same way — this is what makes it loop.
            c.side = (c.side === 1 ? -1 : 1) as 1 | -1;
            c.lp = 2 - c.lp;
          } else {
            c.lp -= 1; // Drifting: reborn at the centre on the same side.
          }
          c.src = nextSrc++ % CARDS.length;
          applyFace(i, c.src);
        }
      }

      // Chain rattle, only while the ribbon is unfolding — the stretch where
      // the images go from small to big. Clicks are spaced by equal steps of
      // *unfold progress* rather than by time, so they inherit the unfold's
      // ease-out: dense as it bursts open, thinning as it settles. That is what
      // a chain released under tension sounds like.
      if (unfold > 0 && unfold < 1) {
        unfoldTicks += unfold - prevUnfold;
        const step = 1 / OPEN_TICKS;
        while (unfoldTicks >= step) {
          unfoldTicks -= step;
          openTick++;
          soundRef.current?.tick(
            // Cards fly out both ways, so alternate ears.
            openTick % 2 ? 0.55 : -0.55,
            1 - unfold * 0.4
          );
        }
      }
      prevUnfold = unfold;

      writeCards(anim, maskT);
    };

    // Dev-only inspection hook for verifying the motion rules.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__ribbon = {
        cards,
        state: () => ({ spinV, dragging }),
      };
    }

    // --- Drag to spin ---
    const surface = dragRef.current;
    let lastX = 0;
    let lastMove = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      spinV = 0;
      lastX = e.clientX;
      lastMove = performance.now();
      surface?.setPointerCapture(e.pointerId);
      root.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dtMs = Math.max(8, now - lastMove);
      lastX = e.clientX;
      lastMove = now;
      // Pixels dragged → phase per second, scaled with the ribbon.
      const dPhase = dx / (DRAG_PX_PER_PHASE * vpScale());
      spinV = (dPhase / dtMs) * 1000;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      // A pause before release should let go of the ribbon, not fling it.
      if (performance.now() - lastMove > 120) spinV = 0;
      surface?.releasePointerCapture(e.pointerId);
      root.classList.remove("is-dragging");
    };

    surface?.addEventListener("pointerdown", onDown);
    surface?.addEventListener("pointermove", onMove);
    surface?.addEventListener("pointerup", onUp);
    surface?.addEventListener("pointercancel", onUp);

    // Keyboard equivalent, so the ribbon is not mouse-only.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      spinV = (e.key === "ArrowRight" ? 1 : -1) * PHASE_SPEED * 9;
    };
    window.addEventListener("keydown", onKey);

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      surface?.removeEventListener("pointerdown", onDown);
      surface?.removeEventListener("pointermove", onMove);
      surface?.removeEventListener("pointerup", onUp);
      surface?.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, cards]);

  // Initial faces are painted inline; the loop repaints them on rebirth.
  return (
    <div className="gallery" ref={stageRef} aria-hidden="true">
      {/* Transparent grab surface. Sits above the ribbon but below the
          headline and prompt, so those stay interactive. */}
      <div className="gallery__drag" ref={dragRef} />
      <div className="gallery__stage">
        <svg
          className="gallery__band"
          ref={bandRef}
          preserveAspectRatio="none"
        >
          <path ref={pathRef} d="" />
        </svg>
        {cards.map((c, i) => (
          <div
            key={i}
            className="gallery__card"
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
          >
            <div
              className="gallery__face"
              ref={(el) => {
                faceRefs.current[i] = el;
              }}
              style={
                CARDS[c.src].image
                  ? { backgroundImage: `url(${CARDS[c.src].image})` }
                  : { background: CARDS[c.src].background }
              }
            />
            <div
              className="gallery__mask"
              ref={(el) => {
                maskRefs.current[i] = el;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
