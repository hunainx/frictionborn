// Original — Frictionborn Motion ScrollShowcase demo
"use client";

import React, { useState } from "react";
import { ScrollShowcase, type ScrollShowcaseSpec } from "./scroll-showcase";
import type { StoryStep } from "@/components/ui/sticky-scroll-story";

interface StepMediaCardProps {
  subsystem: string;
  name: string;
  children: React.ReactNode;
}

function StepMediaCard({ subsystem, name, children }: StepMediaCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "320px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "linear-gradient(135deg, #15181d 0%, #1e232b 100%)",
        color: "#e9ebf0",
        borderRadius: "12px",
        border: "1px solid #262b33",
        boxSizing: "border-box",
      }}
    >
      {children}
      <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
        <span
          style={{
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono, monospace)",
            color: "#fb923c",
            textTransform: "uppercase",
          }}
        >
          {subsystem}
        </span>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem", fontWeight: 500 }}>
          {name}
        </p>
      </div>
    </div>
  );
}

const DEMO_STEPS: StoryStep[] = [
  {
    id: "enclosure",
    title: "Source You Can Read",
    description:
      "Each component arrives through the shadcn CLI as source code in your project. Nothing is hidden inside a package, so you can read it and change it.",
    media: {
      content: (
        <StepMediaCard subsystem="Craft step 01" name="Installed as Source">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <rect x="20" y="16" width="80" height="88" rx="8" stroke="#fb923c" strokeWidth="2.5" />
            <circle cx="60" cy="46" r="18" stroke="#e9ebf0" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="60" cy="80" r="12" stroke="#9aa1af" strokeWidth="1.5" />
            <path d="M36 28h48M36 34h48" stroke="#5b6272" strokeWidth="1" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Abstract sketch of a framed block with two rings inside it",
    },
  },
  {
    id: "transducer",
    title: "Measured on a Test Bench",
    description:
      "Every component runs on a test bench in real browsers. What the docs say about it comes from those runs, so you are never asked to take it on trust.",
    media: {
      content: (
        <StepMediaCard subsystem="Craft step 02" name="Tested in Real Browsers First">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="44" stroke="#fb923c" strokeWidth="2" />
            <circle cx="60" cy="60" r="30" stroke="#e9ebf0" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="14" fill="#fb923c" fillOpacity="0.25" stroke="#fb923c" strokeWidth="1.5" />
            <line x1="60" y1="16" x2="60" y2="104" stroke="#5b6272" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Abstract sketch of three rings around a centre, cut by a dashed line",
    },
  },
  {
    id: "crossover",
    title: "Ready for Reduced Motion",
    description:
      "Every component respects the reduced motion setting, and each WebGL background comes with a CSS poster. A skill file tells AI coding agents which component fits each job on the page.",
    media: {
      content: (
        <StepMediaCard subsystem="Craft step 03" name="Still When Asked to Be Still">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <path d="M20 60h24l12-24 16 48 12-32 8 16 8-8h20" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="44" cy="60" r="3" fill="#e9ebf0" />
            <circle cx="72" cy="84" r="3" fill="#e9ebf0" />
            <circle cx="92" cy="68" r="3" fill="#e9ebf0" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Abstract sketch of a jagged line that rises, falls and then levels out",
    },
  },
];

const DEMO_STUDIOS = [
  "noise-field · WebGL hero background",
  "mesh-gradient · Colour drift",
  "particle-field · Ember dust",
  "distortion-image · Ripples",
  "text-reveal · Word by word",
  "magnetic-button · Gentle pull",
];

const DEMO_SPECS: ScrollShowcaseSpec[] = [
  {
    metric: "In Browsers",
    label: "Bench Measurement",
    detail: "Each component runs on a test bench in real browsers, and the docs report what it measured.",
  },
  {
    metric: "Reduced Motion",
    label: "Setting Respected",
    detail: "When a visitor asks for less motion, every component respects it and the page stays calm.",
  },
  {
    metric: "For AI Agents",
    label: "Skill File Included",
    detail: "A skill file tells AI coding agents which component to pick, so they use each one correctly.",
  },
];

export default function ScrollShowcaseDemo() {
  const [showMarquee, setShowMarquee] = useState(true);

  return (
    <div style={{ width: "100%", background: "#0d0f12", position: "relative" }}>
      {/* ScrollShowcase starts at an h2 (the host page owns the h1): give the demo page its own */}
      <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        Scroll showcase demo
      </h1>

      {/* Demo Controls with lighter chrome */}
      <div
        style={{
          position: "sticky",
          top: "1rem",
          zIndex: 40,
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 1.5rem",
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          onClick={() => setShowMarquee((m) => !m)}
          style={{
            pointerEvents: "auto",
            padding: "0.35rem 0.75rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono, monospace)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "6px",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
          }}
        >
          {showMarquee ? "Hide Marquee" : "Show Marquee"}
        </button>
      </div>

      <ScrollShowcase
        headline="Three habits behind every component."
        description="A motion component should add nothing it does not need: code you can read, a bench that checks it, and a calm reduced-motion state."
        eyebrow="How it is made"
        steps={DEMO_STEPS}
        specs={DEMO_SPECS}
        specsHeading="What we check for"
        specsEyebrow="Workshop notes"
        showMarquee={showMarquee}
        marqueeItems={DEMO_STUDIOS}
        marqueeLabel="Components in Frictionborn Motion"
        smoothScroll={false}
      />
    </div>
  );
}
