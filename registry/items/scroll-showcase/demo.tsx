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
    title: "Monolithic Enclosure",
    description:
      "Milled from a single block of 6061-T6 aluminum. The internal chambers have no parallel surfaces, so the cabinet walls add very little sound of their own.",
    media: {
      content: (
        <StepMediaCard subsystem="Subsystem 01" name="CNC Aluminum Unibody">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <rect x="20" y="16" width="80" height="88" rx="8" stroke="#fb923c" strokeWidth="2.5" />
            <circle cx="60" cy="46" r="18" stroke="#e9ebf0" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="60" cy="80" r="12" stroke="#9aa1af" strokeWidth="1.5" />
            <path d="M36 28h48M36 34h48" stroke="#5b6272" strokeWidth="1" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Schematic view of the CNC-milled aluminum unibody enclosure",
    },
  },
  {
    id: "transducer",
    title: "Vapor-Deposited Beryllium",
    description:
      "A pure beryllium dome driven by a neodymium motor and a copper shorting ring. The dome stays stiff across the audible range, so it moves as one piece.",
    media: {
      content: (
        <StepMediaCard subsystem="Subsystem 02" name="Beryllium High-Frequency Driver">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="44" stroke="#fb923c" strokeWidth="2" />
            <circle cx="60" cy="60" r="30" stroke="#e9ebf0" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="14" fill="#fb923c" fillOpacity="0.25" stroke="#fb923c" strokeWidth="1.5" />
            <line x1="60" y1="16" x2="60" y2="104" stroke="#5b6272" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Sectional diagram of the vapor-deposited beryllium high frequency driver",
    },
  },
  {
    id: "crossover",
    title: "Point-to-Point Topology",
    description:
      "Fourth-order acoustic Linkwitz-Riley crossover hand-wired point-to-point with solid OFC copper buss wire. Custom foil inductors and silver-metallized polypropylene capacitors eliminate phase smearing.",
    media: {
      content: (
        <StepMediaCard subsystem="Subsystem 03" name="Direct-Coupled Passive Filter">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <path d="M20 60h24l12-24 16 48 12-32 8 16 8-8h20" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="44" cy="60" r="3" fill="#e9ebf0" />
            <circle cx="72" cy="84" r="3" fill="#e9ebf0" />
            <circle cx="92" cy="68" r="3" fill="#e9ebf0" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Circuit topology schematic of the direct-coupled passive crossover filter",
    },
  },
];

const DEMO_STUDIOS = [
  "Studio A · Near-Field Control Room",
  "Studio B · Mastering Suite",
  "Room C · Anechoic Chamber",
  "Room D · Diffuse Field Lab",
  "Suite E · Mix Verification",
  "Suite F · Reference Listening",
];

const DEMO_SPECS: ScrollShowcaseSpec[] = [
  {
    metric: "Full Range",
    label: "Frequency Coverage",
    detail: "Linear dispersion tuned for near-field listening environments and control room acoustics.",
  },
  {
    metric: "Low Distortion",
    label: "Harmonic Purity",
    detail: "Underhung motor topology minimizes voice coil flux modulation across the audio band.",
  },
  {
    metric: "Phase Aligned",
    label: "Transducer Integration",
    detail: "Acoustic center alignment preserves transient wave-front integrity without temporal blurring.",
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
        headline="Three parts, built to work as one."
        description="A near-field monitor should add nothing of its own: a quiet cabinet, a clean start and stop, and a crossover that behaves off-axis too."
        eyebrow="How it is made"
        steps={DEMO_STEPS}
        specs={DEMO_SPECS}
        specsHeading="What we listen for"
        specsEyebrow="Listening notes"
        showMarquee={showMarquee}
        marqueeItems={DEMO_STUDIOS}
        marqueeLabel="Rooms these monitors are designed for"
        smoothScroll={false}
      />
    </div>
  );
}
