// Gallery card sources — photography from past DevFest Lagos events.
//
// The originals are ~2400x3600 DSLR frames; the copies in `public/gallery` are
// resampled so the *shorter* edge is 900px. That edge is the one `cover` crops
// against, so it sets the effective resolution, and 900 covers the largest
// card (~540 CSS px tall) on a high-density display.
//
// A card may instead supply `background` — a CSS paint used as a stand-in when
// no photograph is available.

export interface CardSource {
  id: string;
  /** Image URL, served from `public/`. */
  image?: string;
  /** CSS background shorthand, used only when `image` is absent. */
  background?: string;
}

// Ordered so neighbours contrast: the ribbon shows several cards at once and
// consecutive frames of similar colour read as one smear.
export const CARDS: CardSource[] = [
  { id: "stage-lights", image: "/gallery/stage-lights.jpg" },
  { id: "sponsor-wall", image: "/gallery/sponsor-wall.jpg" },
  { id: "speaker-orange", image: "/gallery/speaker-orange.jpg" },
  { id: "afterparty", image: "/gallery/afterparty.jpg" },
  { id: "keynote-stage", image: "/gallery/keynote-stage.jpg" },
  { id: "talk-gdg", image: "/gallery/talk-gdg.jpg" },
  { id: "audience", image: "/gallery/audience.jpg" },
  { id: "devfest-tee", image: "/gallery/devfest-tee.jpg" },
  { id: "speaker-white", image: "/gallery/speaker-white.jpg" },
  { id: "speaker-slides", image: "/gallery/speaker-slides.jpg" },
  { id: "attendees", image: "/gallery/attendees.jpg" },
  { id: "podium", image: "/gallery/podium.jpg" },
];
