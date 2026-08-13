import { useEffect, useRef, useState } from "react";
import { PerspectiveGallery } from "./gallery/PerspectiveGallery";
import "./Hero.css";

// The Melius bowtie mark.
function MeliusMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13 9 1.6 1.2A1 1 0 0 0 0 2v14a1 1 0 0 0 1.6.8L13 9Z" />
      <path d="M15 9 26.4 1.2A1 1 0 0 1 28 2v14a1 1 0 0 1-1.6.8L15 9Z" />
    </svg>
  );
}

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
        <span className="announce__text">Seedance 2.5 is live on Melius</span>
        <a className="announce__link" href="#seedance">
          Try it now&nbsp;→
        </a>
      </div>

      <header className="header">
        <div className="brand">
          <MeliusMark className="brand__mark" />
          <span className="brand__name">Melius</span>
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
