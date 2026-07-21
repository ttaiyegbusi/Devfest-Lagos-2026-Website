import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { CarouselCard } from "./CarouselCard";
import { CARD_ASPECT } from "./useCardTexture";
import { CARDS } from "./cardData";
import { scrollState } from "./scrollState";
import { carouselState } from "./carouselState";

const CARD_HEIGHT = 2.6;
// Large radius relative to card width = gentle wrap, so 4-5 cards face the
// camera at once as in the reference, instead of a tight over-curved drum.
const RADIUS = 2.9;
const SPIN_SPEED = 0.22; // rad/s — slow continuous carousel rotation
// Push the whole drum back so the front cards (local z ≈ +RADIUS) land near
// the world z=0 clip plane. Each big front card then straddles the plane —
// its top (tilted away) renders on the back canvas behind the wordmark, its
// bottom (tilted toward the viewer) on the front canvas — so cards visibly
// thread through the letters.
const DRUM_Z = -RADIUS;

// Rendered once per canvas layer. The front layer passes driver=true and
// advances the shared carouselState; the back layer just mirrors it.
export function CardRibbon({ driver = false }: { driver?: boolean }) {
  const tiltRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const cardArc = (CARD_HEIGHT * CARD_ASPECT) / RADIUS;
  const step = (Math.PI * 2) / CARDS.length;

  useFrame((_, delta) => {
    if (driver) {
      const progress = scrollState.progress;
      const lerpSpeed = 1 - Math.pow(0.001, delta);

      // the drum never stops turning; scroll adds extra turn on top.
      // spin decreases so the front cards travel down-and-left along the
      // right-rising ribbon (downhill), matching the reference's flow.
      carouselState.spin -= delta * SPIN_SPEED;
      carouselState.spinWithScroll = carouselState.spin - progress * 1.5;

      // fixed base pose: tipped toward the viewer, rolled so the ribbon
      // rises to the right (as in the reference); scroll tips it further
      const targetX = 0.16 + progress * 0.15;
      carouselState.tiltX += (targetX - carouselState.tiltX) * lerpSpeed;
      carouselState.tiltZ = 0.3;
      carouselState.posY = -0.15 - progress * 1.2;
    }

    if (spinRef.current) {
      spinRef.current.rotation.y = carouselState.spinWithScroll;
    }
    if (tiltRef.current) {
      tiltRef.current.rotation.x = carouselState.tiltX;
      tiltRef.current.rotation.z = carouselState.tiltZ;
      tiltRef.current.position.y = carouselState.posY;
      tiltRef.current.position.z = DRUM_Z;
    }
  });

  // drum is pushed back to DRUM_Z (front cards near z=0), so it sits further
  // from the camera than before — scale up to keep the cards large
  const scale = Math.min(viewport.width / 8.5, 1.2);

  return (
    <group ref={tiltRef} scale={scale} position={[0, -0.15, DRUM_Z]} rotation={[0.16, 0, 0.3]}>
      <group ref={spinRef}>
        {CARDS.map((data, i) => (
          <CarouselCard
            key={data.name}
            data={data}
            radius={RADIUS}
            height={CARD_HEIGHT}
            thetaStart={i * step + (step - cardArc) / 2}
            arc={cardArc}
          />
        ))}
      </group>
    </group>
  );
}
