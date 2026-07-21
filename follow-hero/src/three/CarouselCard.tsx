import { useMemo } from "react";
import * as THREE from "three";
import { useCardTexture, getCardBackTexture } from "./useCardTexture";
import type { CardData } from "./cardData";

interface Props {
  data: CardData;
  radius: number;
  height: number;
  thetaStart: number;
  arc: number;
}

// One card = one open cylinder segment, so the curvature is geometric (the
// card genuinely wraps the carousel drum) rather than shader-faked. Two
// meshes share the geometry: a textured outside face, and a near-black
// inside face (multiplying the same texture by a dark color keeps the
// rounded-corner alpha) so cards on the far side of the drum read as backs.
export function CarouselCard({ data, radius, height, thetaStart, arc }: Props) {
  const texture = useCardTexture(data);

  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(radius, radius, height, 32, 1, true, thetaStart, arc),
    [radius, height, thetaStart, arc]
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={texture}
          transparent
          side={THREE.FrontSide}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          map={getCardBackTexture()}
          transparent
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
