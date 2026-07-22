export interface CardData {
  name: string;
  role: string;
  location: string;
  accent: string; // Google-palette color for the photo panel + pill dot
  cta: "support" | "wallet-only"; // "support" shows the "See Talk" pill
}

// Google brand palette
const BLUE = "#4285F4";
const RED = "#EA4335";
const GREEN = "#34A853";
const YELLOW = "#F9AB00";

// Twelve fictional DevFest speaker/organizer cards spaced evenly around the
// carousel drum (more cards keep the gentler, larger-radius drum evenly
// filled without wide gaps).
export const CARDS: CardData[] = [
  { name: "GDG Lagos\nTeam", role: "Organizer", location: "Lagos, Nigeria", accent: YELLOW, cta: "wallet-only" },
  { name: "Ada Nwosu", role: "Keynote", location: "Lagos, Nigeria", accent: BLUE, cta: "support" },
  { name: "Tunde Bakare", role: "Speaker", location: "Android Track", accent: GREEN, cta: "support" },
  { name: "Chiamaka Obi", role: "Speaker", location: "AI & ML Track", accent: RED, cta: "support" },
  { name: "Femi Adeyemi", role: "Workshop Host", location: "Cloud Track", accent: BLUE, cta: "support" },
  { name: "Zainab Yusuf", role: "Speaker", location: "Web Track", accent: YELLOW, cta: "support" },
  { name: "Ibrahim Musa", role: "Speaker", location: "Flutter Track", accent: GREEN, cta: "support" },
  { name: "Ngozi Eze", role: "Panelist", location: "Startup Stage", accent: RED, cta: "support" },
  { name: "Kwame Mensah", role: "Speaker", location: "Kotlin Track", accent: BLUE, cta: "support" },
  { name: "Amara Okeke", role: "Speaker", location: "Firebase Track", accent: GREEN, cta: "support" },
  { name: "Bola Adewale", role: "Workshop Host", location: "DevOps Track", accent: YELLOW, cta: "support" },
  { name: "Yusuf Bello", role: "Panelist", location: "Community Stage", accent: RED, cta: "support" },
];
