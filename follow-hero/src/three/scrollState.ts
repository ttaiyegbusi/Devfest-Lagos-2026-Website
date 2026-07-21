// Mutable, non-reactive store: Lenis writes to it on every scroll tick,
// R3F reads it inside useFrame. Avoids re-rendering React on scroll.
export const scrollState = { progress: 0 };
