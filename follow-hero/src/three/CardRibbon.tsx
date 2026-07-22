import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { CarouselCard } from "./CarouselCard";
import { CARD_ASPECT } from "./useCardTexture";
import { CARDS } from "./cardData";
import { scrollState } from "./scrollState";
import { carouselState } from "./carouselState";

const CARD_HEIGHT = 2.35;
// Big radius relative to card width = gentle wrap, so the cards read as
// clean flat portraits (not a tightly over-curved, bulging drum) with 3–4
// facing the camera at once, as in the reference.
const RADIUS = 4.4;
const SPIN_SPEED = 0.2; // rad/s — slow continuous carousel rotation

// Rendered once per canvas layer. The front layer passes driver=true and
// advances the shared carouselState; the back layer just mirrors it.
export function CardRibbon({ driver = false }: { driver?: boolean }) {
  const tiltRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const cardArc = (CARD_HEIGHT * CARD_ASPECT) / RADIUS;
  const step = (Math.PI * 2) / CARDS.length;

  // Keep the cards a moderate fraction of the viewport (not filling it).
  const scale = Math.min(viewport.width / 12, 1.0);
  // Push the drum back so the *scaled* front cards (world z ≈ scale·RADIUS
  // from the group origin) land on the world z=0 clip plane. Each front card
  // then straddles the plane — its top (tilted away) renders on the back
  // canvas behind the wordmark, its bottom on the front canvas — so cards
  // visibly thread through the letters.
  const drumZ = -RADIUS * scale;

  useFrame((_, rawDelta) => {
    // clamp so a slow first frame or resume-after-pause can't jump the drum
    const delta = Math.min(rawDelta, 0.05);
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
      const targetX = 0.14 + progress * 0.15;
      carouselState.tiltX += (targetX - carouselState.tiltX) * lerpSpeed;
      carouselState.tiltZ = 0.28;
      carouselState.posY = 0.35 - progress * 1.2;
    }

    if (spinRef.current) {
      spinRef.current.rotation.y = carouselState.spinWithScroll;
    }
    if (tiltRef.current) {
      tiltRef.current.rotation.x = carouselState.tiltX;
      tiltRef.current.rotation.z = carouselState.tiltZ;
      tiltRef.current.position.y = carouselState.posY;
      tiltRef.current.position.z = drumZ;
    }
  });

  return (
    <group ref={tiltRef} scale={scale} position={[0, 0.35, drumZ]} rotation={[0.14, 0, 0.28]}>
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
