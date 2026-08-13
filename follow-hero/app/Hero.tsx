"use client";

import { useEffect, useRef, useState } from "react";
import { PerspectiveGallery } from "./gallery/PerspectiveGallery";
import { DevFestLogo } from "./DevFestLogo";
import "./Hero.css";

// Rotating prompt suggestions, matching the reference's cycling placeholder.
const PROMPTS = [
  "Design a product launch campaign for a new sneaker drop…",
  "Storyboard a 30-second trailer for a sci-fi short film…",
  "Write a release teaser for an indie synth-pop single…",
  "Art-direct a spring editorial around bold florals…",
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);

  // Only run the ribbon loop while the hero is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.02 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cycle the prompt text (low-frequency; not part of the rAF loop).
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setPromptIndex((i) => (i + 1) % PROMPTS.length),
      4200
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="hero" ref={sectionRef}>
      <div className="dotgrid" aria-hidden="true" />

      <div className="announce">
        <span className="announce__text">
          DevFest Lagos 2026 &middot; Tickets are live
        </span>
        <a className="announce__link" href="#tickets">
          Get yours&nbsp;→
        </a>
      </div>

      <header className="header">
        <div className="brand">
          <DevFestLogo className="brand__logo" />
          <span className="brand__menu" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
        <nav className="auth">
          <a className="auth__signin" href="#signin">
            Sign In
          </a>
          <a className="auth__start" href="#start">
            Start for Free
          </a>
        </nav>
      </header>

      <PerspectiveGallery rootRef={sectionRef} active={active} />

      <h1 className="headline">
        One ecosystem.
        <br />
        Endless opportunities.
      </h1>

      <div className="lower">
        <p className="paragraph">
          Be the creative director. Let agents be your team. Brief our agent
          Mel, watch the work assemble, and steer any prompt until the output
          lands exactly as you imagined.
        </p>

        <div className="prompt">
          <span className="prompt__icon" aria-hidden="true">
            <svg viewBox="0 0 40 16" fill="none">
              <path
                d="M2 8c3-6 7-6 10 0s7 6 10 0 7-6 10 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="prompt__field" key={promptIndex}>
            {PROMPTS[promptIndex]}
          </span>
          <button className="prompt__send" aria-label="Send prompt">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h13M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
