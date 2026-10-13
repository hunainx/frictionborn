// Original — Frictionborn Motion ScrollReveal demo
"use client";

import React, { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

interface InstrumentCard {
  serial: string;
  subsystem: string;
  summary: string;
  specs: string;
}

const INSTRUMENTS: InstrumentCard[] = [
  {
    serial: "Source",
    subsystem: "Source Code You Own and Change",
    summary:
      "Each component installs with the shadcn CLI as plain source files, so you can read every line and shape it to fit your own product.",
    specs: "Install: shadcn CLI · Stack: React and Next.js · Code: Yours to change",
  },
  {
    serial: "Tested",
    subsystem: "Measured in Real Browsers on a Test Bench",
    summary:
      "Every component runs on a test bench in real browsers, with reduced motion on and off, so the docs show what it really does on a page.",
    specs: "Bench: Real browsers · Scope: Every component · Reduced motion: Respected",
  },
  {
    serial: "Agents",
    subsystem: "Easy for AI Coding Agents to Pick Well",
    summary:
      "A skill file tells AI coding agents which component fits the job, so the motion they add is the motion the page actually needs.",
    specs: "Guide: Skill file · Reader: AI coding agents · Purpose: Choosing the component",
  },
];

export default function ScrollRevealDemo() {
  const [animationMode, setAnimationMode] = useState<"fade-up" | "fade" | "scale-up">("fade-up");

  return (
    <div
      style={{
        padding: "2.5rem 1.25rem",
        maxWidth: 900,
        margin: "0 auto",
        color: "var(--foreground, #E9EBF0)",
      }}
    >
      <header
        style={{
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border, #262B33)",
          paddingBottom: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span
            className="mono"
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--primary, #FB923C)",
              display: "block",
              marginBottom: "0.35rem",
            }}
          >
            Frictionborn Motion · How It Works
          </span>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            What Every Component Gets
          </h2>
        </div>

        <fieldset
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            gap: "0.375rem",
          }}
        >
          <legend className="sr-only">Scroll reveal transition variant</legend>
          {(["fade-up", "fade", "scale-up"] as const).map((m) => (
            <label
              key={m}
              style={{
                padding: "0.5rem 0.875rem",
                borderRadius: "4px",
                border: "1px solid var(--border, #262B33)",
                background: animationMode === m ? "var(--primary, #FB923C)" : "transparent",
                color: animationMode === m ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                type="radio"
                name="scroll-mode"
                value={m}
                checked={animationMode === m}
                onChange={() => setAnimationMode(m)}
                style={{ display: "none" }}
              />
              {m}
            </label>
          ))}
        </fieldset>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {INSTRUMENTS.map((inst, idx) => (
          <ScrollReveal
            key={`${animationMode}-${inst.serial}`}
            animation={animationMode}
            distance={20}
            duration={400}
          >
            <article
              style={{
                border: "1px solid var(--border, #262B33)",
                borderRadius: "8px",
                padding: "1.5rem",
                backgroundColor: "var(--card, rgba(21, 24, 29, 0.6))",
                color: "var(--card-foreground, #E9EBF0)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--primary, #FB923C)",
                  }}
                >
                  {inst.serial}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--muted-foreground, #9AA1AF)",
                  }}
                >
                  Part {idx + 1} of {INSTRUMENTS.length}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  margin: "0 0 0.5rem 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {inst.subsystem}
              </h2>

              <p
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  color: "var(--muted-foreground, #9AA1AF)",
                }}
              >
                {inst.summary}
              </p>

              <div
                className="mono"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "4px",
                  border: "1px solid var(--border, #262B33)",
                  color: "var(--foreground, #E9EBF0)",
                }}
              >
                {inst.specs}
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
