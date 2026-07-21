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
function CarouselLayer({ half }: { half: "front" | "back" }) {
  const normal = half === "front" ? 1 : -1;
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 35 }}
      dpr={[1, 1.8]}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, normal), 0)];
      }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 2, 6]} intensity={1.6} />
      <CardRibbon driver={half === "front"} />
    </Canvas>
  );
}

export function Hero() {
  return (
    <section className="hero">
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
        <CarouselLayer half="back" />
      </div>

      <h1 className="hero__wordmark" aria-hidden="true">
        DEVFEST LAGOS
      </h1>

      <div className="hero__canvas hero__canvas--front">
        <CarouselLayer half="front" />
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
