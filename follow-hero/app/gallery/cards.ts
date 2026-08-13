// Gallery card sources — photography from past DevFest Lagos events.
//
// All 34 photographs are used, and none is repeated. Only 12 cards exist in
// the DOM at once, so a card picks up the next source in this list each time it
// is reborn at the centre — the ribbon walks the whole set before any image
// comes round again. Fewer sources than card slots would put the entire set on
// screen simultaneously and the repeat would be obvious.
//
// Ordered so neighbours contrast: several cards are visible at a time, and
// consecutive frames of similar tone or subject read as one smear. The trailing
// comment on each line is the kind of shot it is.
//
// The originals are ~2400x3600 DSLR frames; the copies in `public/gallery` are
// WebP resampled so the *shorter* edge is 900px. That edge is the one `cover`
// crops against, so it sets the effective resolution, and 900 covers the
// largest card (~540 CSS px tall) on a high-density display.

export interface CardSource {
  id: string;
  /** Image URL, served from `public/`. */
  image?: string;
  /** CSS background shorthand, used only when `image` is absent. */
  background?: string;
}

export const CARDS: CardSource[] = [
  { id: "dsc01284", image: "/gallery/dsc01284.webp" }, // bold
  { id: "dsc05086", image: "/gallery/dsc05086.webp" }, // speaker
  { id: "img_5604", image: "/gallery/img_5604.webp" }, // attendees
  { id: "dsc01429", image: "/gallery/dsc01429.webp" }, // stage
  { id: "dsc05258", image: "/gallery/dsc05258.webp" }, // speaker
  { id: "dsc02541", image: "/gallery/dsc02541.webp" }, // panel
  { id: "img_7880", image: "/gallery/img_7880.webp" }, // bold
  { id: "dsc03124", image: "/gallery/dsc03124.webp" }, // speaker
  { id: "dsc02074", image: "/gallery/dsc02074.webp" }, // crowd
  { id: "dsc09889", image: "/gallery/dsc09889.webp" }, // speaker
  { id: "dsc07082", image: "/gallery/dsc07082.webp" }, // attendees
  { id: "dsc06046", image: "/gallery/dsc06046.webp" }, // stage
  { id: "img_3187", image: "/gallery/img_3187.webp" }, // bold
  { id: "dsc05516", image: "/gallery/dsc05516.webp" }, // speaker
  { id: "dsc03079", image: "/gallery/dsc03079.webp" }, // attendees
  { id: "dsc01861", image: "/gallery/dsc01861.webp" }, // stage
  { id: "dsc04788", image: "/gallery/dsc04788.webp" }, // speaker
  { id: "dsc02566", image: "/gallery/dsc02566.webp" }, // panel
  { id: "img_8544", image: "/gallery/img_8544.webp" }, // bold
  { id: "dsc06329", image: "/gallery/dsc06329.webp" }, // speaker
  { id: "dsc02464", image: "/gallery/dsc02464.webp" }, // crowd
  { id: "dsc09679", image: "/gallery/dsc09679.webp" }, // stage
  { id: "dsc07110", image: "/gallery/dsc07110.webp" }, // attendees
  { id: "dsc05638", image: "/gallery/dsc05638.webp" }, // speaker
  { id: "img_8506", image: "/gallery/img_8506.webp" }, // bold
  { id: "dsc04249", image: "/gallery/dsc04249.webp" }, // speaker
  { id: "img_5611", image: "/gallery/img_5611.webp" }, // attendees
  { id: "dsc03316", image: "/gallery/dsc03316.webp" }, // venue
  { id: "dsc08967", image: "/gallery/dsc08967.webp" }, // speaker
  { id: "img_2419", image: "/gallery/img_2419.webp" }, // brand
  { id: "dsc05793", image: "/gallery/dsc05793.webp" }, // speaker
  { id: "dsc02739", image: "/gallery/dsc02739.webp" }, // panel
  { id: "dsc09208-1", image: "/gallery/dsc09208-1.webp" }, // speaker
  { id: "dsc02868", image: "/gallery/dsc02868.webp" }, // stage
];
