// Shared mutable state so the two canvas layers (back half / front half of
// the drum) animate in perfect sync: the front layer's ribbon instance is
// the "driver" that advances this state each frame; the back layer only
// reads it.
export const carouselState = {
  spin: 0,
  spinWithScroll: 0,
  tiltX: 0.16,
  tiltZ: 0.3,
  posY: -0.15,
};
