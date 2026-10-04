// Original — Frictionborn Motion ScrollShowcase composition
"use client";

import React from "react";
import { useCapability } from "@frictionborn/runtime";
import { StickyScrollStory, type StoryStep } from "@/components/ui/sticky-scroll-story";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Marquee } from "@/components/ui/marquee";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

export interface ScrollShowcaseProps {
  /** Optional custom steps for the StickyScrollStory. */
  steps?: StoryStep[];
  /** Include the client/studio reference marquee strip. */
  showMarquee?: boolean;
  /** Enable SmoothScroll provider (off by default per PRD 6.12). */
  smoothScroll?: boolean;
  /** Additional CSS class names. */
  className?: string;
  /** Custom inline styles. */
  style?: React.CSSProperties;
}

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

const DEFAULT_STEPS: StoryStep[] = [
  {
    id: "enclosure",
    title: "Monolithic Enclosure",
    description:
      "Milled from a single 45 kg block of aerospace-grade 6061-T6 aluminum. CNC-carved internal chambers eliminate internal parallel surfaces and cabinet wall resonance, yielding an inert acoustic platform.",
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
      "A 28 mm pure beryllium dome driven by a dual-neodymium motor assembly and copper shorting ring. The first structural breakup mode occurs beyond 42 kHz, preserving pristine phase linearity across all audible octaves.",
    media: {
      content: (
        <StepMediaCard subsystem="Subsystem 02" name="Beryllium High-Frequency Driver">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="44" stroke="#fb923c" strokeWidth="2" />
            <circle cx="60" cy="60" r="30" stroke="#e9ebf0" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="14" fill="#fb923c" fillOpacity="0.25" stroke="#fb923c" strokeWidth="1.5" />
            <line x1="16" y1="60" x2="104" y2="60" stroke="#5b6272" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="60" y1="16" x2="60" y2="104" stroke="#5b6272" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Schematic view of the vapor-deposited beryllium dome transducer",
    },
  },
  {
    id: "crossover",
    title: "Phase-Linear Passive Crossover",
    description:
      "Hand-tuned 4th-order Linkwitz-Riley network constructed with point-to-point wiring, air-core OFC inductors, and custom metallized polypropylene capacitors. Pair-matched to within ±0.15 dB for seamless stereo imaging.",
    media: {
      content: (
        <StepMediaCard subsystem="Subsystem 03" name="4th-Order Linkwitz-Riley Filter">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <path d="M20 75 Q45 75 60 60 T100 45" stroke="#fb923c" strokeWidth="2.5" />
            <path d="M20 45 Q45 45 60 60 T100 75" stroke="#9aa1af" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="60" cy="60" r="4" fill="#fb923c" />
            <line x1="20" y1="90" x2="100" y2="90" stroke="#5b6272" strokeWidth="1" />
          </svg>
        </StepMediaCard>
      ),
      alt: "Acoustic transfer curve of the phase-linear passive crossover",
    },
  },
];

const STUDIOS = [
  "Abbey Road Studio 3",
  "Electric Lady Studios",
  "Hansa Tonstudio",
  "Metropolis Mastering",
  "Sunset Sound",
  "Real World Studios",
  "AIR Studios",
  "Capitol Studios",
];

const SPEC_HIGHLIGHTS = [
  {
    metric: "±0.8 dB",
    label: "Frequency Linearity",
    detail: "Measured in a certified anechoic room from 48 Hz to 24 kHz without DSP compensation or phase inversion.",
  },
  {
    metric: "< 0.04%",
    label: "Harmonic Distortion",
    detail: "Total harmonic distortion at reference 90 dB SPL output across all operational pass-bands.",
  },
  {
    metric: "0.2 ms",
    label: "Group Delay",
    detail: "Acoustic center alignment preserves transient wave-front integrity without temporal blurring.",
  },
];

export function ScrollShowcase({
  steps = DEFAULT_STEPS,
  showMarquee = true,
  smoothScroll = false,
  className,
  style,
}: ScrollShowcaseProps) {
  const cap = useCapability(); // @frictionborn-guard

  const content = (
    <div
      data-frictionborn-item="scroll-showcase"
      data-tier={cap.tier}
      className={className}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: "var(--background, #0d0f12)",
        color: "var(--foreground, #e9ebf0)",
        ...style,
      }}
    >
      {/* 1. Header Section */}
      <section
        aria-labelledby="architecture-heading"
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "5rem 1.5rem 3rem 1.5rem",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--primary, #c2410c)",
            marginBottom: "0.75rem",
          }}
        >
          Engineering Architecture
        </span>
        <ScrollReveal>
          <h2
            id="architecture-heading"
            style={{
              margin: "0 0 1rem 0",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            Three systems, perfectly aligned in time and phase.
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p
            style={{
              margin: "0 auto",
              maxWidth: "680px",
              fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
              lineHeight: 1.65,
              color: "var(--muted-foreground, rgba(233, 235, 240, 0.8))",
            }}
          >
            Near-field monitoring requires zero cabinet coloration, instantaneous transient recovery, and steep crossover slopes that remain coherent off-axis.
          </p>
        </ScrollReveal>
      </section>

      {/* 2. Sticky Scroll Story */}
      <section aria-label="Interactive architecture deep-dive" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem" }}>
        <StickyScrollStory steps={steps} />
      </section>

      {/* 3. Feature Specifications Grid with ScrollReveal */}
      <section
        aria-labelledby="performance-heading"
        style={{
          maxWidth: "1000px",
          margin: "4rem auto 0 auto",
          padding: "4rem 1.5rem",
          boxSizing: "border-box",
          borderTop: "1px solid #262b33",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--primary, #c2410c)",
              marginBottom: "0.5rem",
            }}
          >
            Measured Tolerances
          </span>
          <ScrollReveal>
            <h3
              id="performance-heading"
              style={{
                margin: 0,
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 600,
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
              }}
            >
              Laboratory verification standards
            </h3>
          </ScrollReveal>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
            gap: "1.5rem",
          }}
        >
          {SPEC_HIGHLIGHTS.map((spec) => (
            <ScrollReveal key={spec.label}>
              <div
                style={{
                  padding: "2rem",
                  borderRadius: "10px",
                  background: "#15181d",
                  border: "1px solid #262b33",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono, monospace)",
                    color: "#fb923c",
                  }}
                >
                  {spec.metric}
                </div>
                <h4 style={{ margin: "0.75rem 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 600 }}>
                  {spec.label}
                </h4>
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6, color: "#9aa1af" }}>
                  {spec.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 4. Client / Studio Marquee */}
      {showMarquee && (
        <section
          aria-label="Studio reference deployments"
          style={{
            padding: "3rem 0 5rem 0",
            borderTop: "1px solid #262b33",
            overflow: "hidden",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "0 1.5rem" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--muted-foreground, #9aa1af)",
              }}
            >
              Reference deployments in critical listening rooms
            </span>
          </div>
          <Marquee speed={32} pauseOnHover={true} pauseOnFocus={true}>
            {STUDIOS.map((studio) => (
              <span
                key={studio}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 2rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "var(--muted-foreground, rgba(233, 235, 240, 0.75))",
                  letterSpacing: "-0.01em",
                }}
              >
                {studio}
              </span>
            ))}
          </Marquee>
        </section>
      )}
    </div>
  );

  if (smoothScroll) {
    return <SmoothScroll>{content}</SmoothScroll>;
  }

  return content;
}
export default ScrollShowcase;
