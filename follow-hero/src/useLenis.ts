import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { scrollState } from "./three/scrollState";

// Sets up smooth scrolling for the whole page and mirrors normalized scroll
// progress (0 at top, 1 at the bottom of the scrollable area) into
// `scrollState`, matching the reference site's Lenis-driven scroll.
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      scrollState.progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
    });

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);
}
