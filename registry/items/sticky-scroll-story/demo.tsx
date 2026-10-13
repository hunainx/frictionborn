// Original — Frictionborn Motion StickyScrollStory Demo
"use client";

import React, { useState } from "react";
import { StickyScrollStory, StoryStep } from "./sticky-scroll-story";

function DiagramCard({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "1.25rem",
        backgroundColor: "var(--card, #15181D)",
        border: "1px solid var(--border, #262B33)",
        borderRadius: "8px",
        boxSizing: "border-box",
        margin: 0,
      }}
    >
      <figcaption
        className="mono"
        style={{
          fontSize: "11px",
          color: "var(--primary, #FB923C)",
          marginBottom: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {caption}
      </figcaption>
      {children}
    </figure>
  );
}

const STORY_STEPS: StoryStep[] = [
  {
    id: "step-billet",
    badge: "Phase 01 · Friction and Heat",
    title: "Friction Makes Heat",
    description:
      "Every component starts with a small friction: a hero that feels flat, a list that lands all at once. We work at it until it starts to give off heat.",
    media: {
      type: "custom",
      content: (
        <DiagramCard caption="Sketch · Two Surfaces Rubbing Together">
          <svg viewBox="0 0 260 160" width="100%" height="160" aria-label="Friction diagram">
            <rect x="20" y="20" width="220" height="120" rx="8" fill="none" stroke="var(--border, #262B33)" strokeWidth="1.5" />
            <line x1="5" y1="80" x2="255" y2="80" stroke="var(--primary, #FB923C)" strokeWidth="2" strokeDasharray="3 3" />
            <rect x="35" y="55" width="8" height="50" rx="2" fill="var(--muted-foreground, #9AA1AF)" />
            <rect x="217" y="55" width="8" height="50" rx="2" fill="var(--muted-foreground, #9AA1AF)" />
            {Array.from({ length: 9 }).map((_, i) => (
              <circle
                key={i}
                cx={70 + i * 15}
                cy={80}
                r="4"
                fill="var(--primary, #FB923C)"
                opacity={i % 2 === 0 ? "0.9" : "0.5"}
              />
            ))}
            <text x="75" y="115" fill="var(--foreground, #E9EBF0)" fontSize="10" fontFamily="monospace">
              Heat Builds Along the Line
            </text>
          </svg>
        </DiagramCard>
      ),
    },
  },
  {
    id: "step-driver",
    badge: "Phase 02 · The Spark Catches",
    title: "Heat Catches the First Spark",
    description:
      "The spark is a working prototype. It runs in real browsers on the test bench, with reduced motion both on and off, before it is allowed to grow.",
    media: {
      type: "custom",
      content: (
        <DiagramCard caption="Sketch · A Spark on the Test Bench">
          <svg viewBox="0 0 260 160" width="100%" height="160" aria-label="Test bench diagram">
            <rect x="25" y="25" width="210" height="110" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1" />
            <rect x="40" y="40" width="180" height="80" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1" strokeDasharray="4 2" />
            <rect x="65" y="60" width="130" height="40" rx="3" fill="rgba(251, 146, 60, 0.15)" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <line x1="50" y1="80" x2="210" y2="80" stroke="var(--foreground, #E9EBF0)" strokeWidth="1.5" />
            <circle cx="65" cy="80" r="3" fill="var(--primary, #FB923C)" />
            <circle cx="195" cy="80" r="3" fill="var(--primary, #FB923C)" />
            <text x="80" y="84" fill="var(--foreground, #E9EBF0)" fontSize="10" fontFamily="monospace">
              First Spark, Under Test
            </text>
          </svg>
        </DiagramCard>
      ),
    },
  },
  {
    id: "step-crossover",
    badge: "Phase 03 · Fire, Then Ash",
    title: "The Fire Settles Into Ash",
    description:
      "Once it ships, the motion is quiet and steady. A skill file tells AI coding agents which component to pick, so each one lands where it belongs.",
    media: {
      type: "custom",
      content: (
        <DiagramCard caption="Sketch · How a Flame Settles Into Calm Ash">
          <svg viewBox="0 0 260 160" width="100%" height="160" aria-label="Flame to ash flow diagram">
            <rect x="25" y="55" width="55" height="50" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1.5" />
            <text x="32" y="83" fill="var(--foreground, #E9EBF0)" fontSize="9" fontFamily="monospace">
              Kindling
            </text>
            <line x1="80" y1="80" x2="115" y2="80" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <rect x="115" y="65" width="40" height="30" rx="3" fill="rgba(251, 146, 60, 0.2)" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <text x="123" y="83" fill="var(--foreground, #E9EBF0)" fontSize="9" fontFamily="monospace">
              Embers
            </text>
            <line x1="155" y1="80" x2="190" y2="80" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <rect x="190" y="55" width="50" height="50" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1.5" />
            <text x="198" y="83" fill="var(--foreground, #E9EBF0)" fontSize="9" fontFamily="monospace">
              Cooled
            </text>
            <text x="65" y="130" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
              Cooled · Calm on the Page
            </text>
          </svg>
        </DiagramCard>
      ),
    },
  },
];

export default function StickyScrollStoryDemo() {
  const [activeStepId, setActiveStepId] = useState("step-billet");

  return (
    <section
      aria-label="Frictionborn Motion Component Craft Story"
      style={{
        padding: "1rem",
        color: "var(--foreground, #E9EBF0)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "1.25rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border, #262B33)",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "var(--primary, #FB923C)",
              display: "inline-block",
            }}
          />
          <span className="mono" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Frictionborn Motion · How We Build It
          </span>
        </div>
        <div className="mono" style={{ fontSize: "11px", color: "var(--muted-foreground, #9AA1AF)" }}>
          Active Stage: <strong style={{ color: "var(--primary, #FB923C)" }}>{activeStepId}</strong>
        </div>
      </header>

      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "1.25rem", textAlign: "left" }}>
          <span
            className="mono"
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--primary, #FB923C)",
              display: "block",
              marginBottom: "0.35rem",
            }}
          >
            From Friction to Ash
          </span>
          <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Crafting a Motion Component From Friction
          </h2>
        </div>

        <StickyScrollStory
          steps={STORY_STEPS}
          mediaPosition="right"
          onStepChange={(id) => setActiveStepId(id)}
        />
      </div>
    </section>
  );
}
