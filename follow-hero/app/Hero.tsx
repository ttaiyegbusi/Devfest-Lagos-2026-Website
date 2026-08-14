"use client";

import { useEffect, useRef, useState } from "react";
import { PerspectiveGallery } from "./gallery/PerspectiveGallery";
import { createChainSound, type ChainSound } from "./gallery/chainSound";
import { DevFestLogo } from "./DevFestLogo";
import "./Hero.css";

// Rotating placeholders for the search pill, cycling through what you can
// look up — tracks, sessions, speakers, workshops.
const SEARCHES = [
  "Find a session on generative AI…",
  "Explore the Android engineering track…",
  "Meet the speakers building for Africa…",
  "Browse workshops for first-time builders…",
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  // Off by default: browsers block audio until a gesture anyway, and a hero
  // that makes noise unprompted is the kind of thing people leave.
  const [sound, setSound] = useState(false);
  const soundRef = useRef<ChainSound | null>(null);

  useEffect(() => {
    soundRef.current = createChainSound();
    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    soundRef.current?.setEnabled(sound);
  }, [sound]);

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

  // Cycle the placeholder (low-frequency; not part of the rAF loop).
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setPromptIndex((i) => (i + 1) % SEARCHES.length),
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
          <a className="auth__start" href="#tickets">
            Get Tickets
          </a>
        </nav>
      </header>

      <PerspectiveGallery
        rootRef={sectionRef}
        active={active}
        soundRef={soundRef}
      />

      <button
        type="button"
        className="soundtoggle"
        aria-pressed={sound}
        aria-label={sound ? "Mute the ribbon" : "Unmute the ribbon"}
        onClick={() => setSound((s) => !s)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 9.5h3l4-3.5v12l-4-3.5H5z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {sound ? (
            <>
              <path
                d="M16 9.2a4 4 0 0 1 0 5.6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M18.6 6.8a7.5 7.5 0 0 1 0 10.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </>
          ) : (
            <path
              d="m16.5 9.5 5 5m0-5-5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      <h1 className="headline">
        One ecosystem.
        <br />
        Endless opportunities.
      </h1>

      <div className="lower">
        <p className="paragraph">
          The largest annual tech conference in Africa, hosted by Google
          Developer Group Lagos. Two days of talks, workshops and hallway
          conversations with the people building what&rsquo;s next.
        </p>

        <div className="prompt">
          <span className="prompt__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="6.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m16 16 4.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="prompt__field" key={promptIndex}>
            {SEARCHES[promptIndex]}
          </span>
          <button className="prompt__send" aria-label="Search the programme">
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
