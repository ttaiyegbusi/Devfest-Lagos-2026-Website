import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { CardRibbon } from "./three/CardRibbon";
import { DevFestLogo } from "./DevFestLogo";
import "./Hero.css";

// One canvas per drum half, clipped at the world z=0 plane. The back half
// renders BEHIND the giant wordmark, the front half ABOVE it — so the
// carousel appears to thread through the letters, matching the reference
// site (which likewise layers two full-viewport WebGL canvases around the
// DOM headline).
function CarouselLayer({
  half,
  active,
}: {
  half: "front" | "back";
  active: boolean;
}) {
  const normal = half === "front" ? 1 : -1;
  return (
    <Canvas
      // Pause rendering entirely when the hero is offscreen; drive frames
      // continuously while it's visible.
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 8], fov: 35 }}
      dpr={[1, 1.8]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, normal), 0)];

        // Recover from GPU context loss (common with two full-viewport WebGL
        // contexts on constrained devices): swallow the lost event so the
        // browser attempts restoration, then let three re-upload resources.
        const canvas = gl.domElement;
        canvas.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false
        );
      }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 2, 6]} intensity={1.6} />
      <CardRibbon driver={half === "front"} />
    </Canvas>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);

  // Only run the render loops while the hero is actually on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="hero" ref={sectionRef}>
      <nav className="hero__nav">
        <div className="hero__brand">
          <DevFestLogo className="hero__brand-logo" />
        </div>
        <ul className="hero__links">
          <li>About</li>
          <li>Community Board</li>
          <li>Pricing</li>
          <li>FAQ</li>
        </ul>
        <a className="hero__nav-cta" href="#tickets">
          Buy Ticket
        </a>
      </nav>

      <div className="hero__canvas hero__canvas--back">
        <CarouselLayer half="back" active={active} />
      </div>

      <h1 className="hero__wordmark" aria-hidden="true">
        DEVFEST LAGOS
      </h1>

      <div className="hero__canvas hero__canvas--front">
        <CarouselLayer half="front" active={active} />
      </div>

      <p className="hero__tagline">
        Join the largest annual tech conference in Africa, hosted by Google
        Developer Group Lagos (GDG Lagos)
      </p>

      <a className="hero__ticket-cta" href="#tickets">
        <span>Buy Ticket</span>
        <span className="hero__ticket-arrow">→</span>
      </a>
    </section>
  );
}
