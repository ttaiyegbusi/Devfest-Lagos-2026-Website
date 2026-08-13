import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font, so the display serif is available on first paint —
// the headline resolves as part of the opening choreography and a swap
// mid-animation would be obvious.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevFest Lagos 2026 — One ecosystem. Endless opportunities.",
  description:
    "DevFest Lagos 2026. One ecosystem. Endless opportunities. The largest annual tech conference in Africa, hosted by Google Developer Group Lagos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
