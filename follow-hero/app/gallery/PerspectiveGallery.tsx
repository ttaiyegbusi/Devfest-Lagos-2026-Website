"use client";

import { useEffect, useMemo, useRef } from "react";
import { CARDS } from "./cards";
import {
  BAND_H,
  BAND_HALF,
  BAND_Z,
  BASE_W,
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

interface Card {
  side: 1 | -1;
  step: number; // fixed phase offset within its side
  prevLp: number;
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
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  active: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
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
        const step = j / PER_SIDE;
        return {
          side: (i < PER_SIDE ? -1 : 1) as 1 | -1,
          step,
          prevLp: step,
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
    let ph = 0; // global phase [0,1)

    const applyFace = (i: number, src: number) => {
      const face = faceRefs.current[i];
      if (!face) return;
      const card = CARDS[src];
      if (card.image) {
        face.style.backgroundImage = `url(${card.image})`;
        face.style.background = "";
      } else {
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

      for (let i = 0; i < cards.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const c = cards[i];
        const lp = (c.step + ph) % 1;
        if (lp < c.prevLp) {
          c.src = nextSrc++ % CARDS.length;
          applyFace(i, c.src);
        }
        c.prevLp = lp;

        const t = cardTransform(lp, c.side, anim);
        const x = t.x * vs;
        const scale = t.scale * vs;
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(
          1
        )}px, 0, ${(t.z * vs).toFixed(1)}px) rotateY(${t.ry.toFixed(
          2
        )}deg) scale(${scale.toFixed(4)})`;

        // Per-card black dissolve, centre cards first.
        const op = 1 - Math.min(1, Math.max(0, (maskT * 1.35 - lp) / 0.25));
        const mask = maskRefs.current[i];
        if (mask) mask.style.opacity = op.toFixed(3);

        // While a card is still fully masked it is pure black on a pure black
        // silhouette — invisible, but its edges and shadow would striate the
        // drawn path. Hide it until its image starts resolving, so the seed
        // reads as one clean shape.
        const halfCard = 130 * scale + 20;
        const offscreen = Math.abs(x) - halfCard > halfW || scale < 0.01;
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
        const unshrink = (PERSPECTIVE + Math.abs(BAND_Z * vs)) / PERSPECTIVE;
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

      // --- Divergent travel. The ramp overlaps the tail of the unfold so the
      // ribbon is already drifting as it finishes opening. Starting later — or
      // with a slow ease-in — leaves a dead beat that reads as a pause.
      ph = (ph + PHASE_SPEED * easeOutQuad(phase(t, 1.15, 1.9)) * dt) % 1;

      writeCards(anim, maskT);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, cards]);

  // Initial faces are painted inline; the loop repaints them on rebirth.
  return (
    <div className="gallery" ref={stageRef} aria-hidden="true">
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
