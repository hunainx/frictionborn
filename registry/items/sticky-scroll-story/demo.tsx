// Original — Frictionborn Motion StickyScrollStory Demo
"use client";

import React, { useState } from "react";
import { StickyScrollStory, StoryStep } from "./sticky-scroll-story";
import { useReducedMotion } from "@frictionborn/runtime";

const SAMPLE_STEPS: StoryStep[] = [
  {
    id: "step-1",
    badge: "Phase 01 · Architecture",
    title: "Zero-Slop Kinetic Runtime",
    description:
      "All animations coordinate through a unified frame loop. Shared leases prevent GPU saturation while strict boundary guards maintain instant server-rendered fallbacks.",
    media: {
      type: "custom",
      content: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "2rem",
            backgroundColor: "rgba(251, 146, 60, 0.08)",
            border: "1px solid rgba(251, 146, 60, 0.2)",
            borderRadius: "6px",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: "12px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "var(--signal, #FB923C)",
              color: "var(--bg, #0D0F12)",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            ARCHITECTURE SPEC
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>Single-Loop Engine</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #9AA1AF)", maxWidth: "280px" }}>
            Max 1 shared animation tick across all components on screen.
          </p>
        </div>
      ),
    },
  },
  {
    id: "step-2",
    badge: "Phase 02 · Accessibility",
    title: "First-Class WCAG Integration",
    description:
      "Content reading order perfectly matches the visual narrative. Screen readers receive clean text without fragmentation, and reduced motion modes are honored instantly.",
    media: {
      type: "custom",
      content: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "2rem",
            backgroundColor: "rgba(74, 222, 128, 0.08)",
            border: "1px solid rgba(74, 222, 128, 0.2)",
            borderRadius: "6px",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: "12px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "var(--pass, #4ADE80)",
              color: "var(--bg, #0D0F12)",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            WCAG 2.2.2 COMPLIANT
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>aria-current Guidance</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #9AA1AF)", maxWidth: "280px" }}>
            Active steps convey state to assistive technology while text remains selectable.
          </p>
        </div>
      ),
    },
  },
  {
    id: "step-3",
    badge: "Phase 03 · Responsiveness",
    title: "Defensive Mobile Transitions",
    description:
      "Below 768px, layout cleanly stacks without position: sticky hacks. Dynamic browser address bars and gesture keyboards trigger zero layout shifts or stuttering.",
    media: {
      type: "custom",
      content: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "2rem",
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "6px",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: "12px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "var(--accent, #3B82F6)",
              color: "var(--bg, #0D0F12)",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            0 CLS GUARANTEE
          </div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>Stacked Mobile Flow</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #9AA1AF)", maxWidth: "280px" }}>
            Clean static narrative flow eliminating iOS Safari viewport jumping.
          </p>
        </div>
      ),
    },
  },
];

export default function StickyScrollStoryDemo() {
  const [position, setPosition] = useState<"right" | "left">("right");
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "750px",
        borderRadius: "8px",
        border: "1px solid var(--line, #262B33)",
        backgroundColor: "var(--bg, #0D0F12)",
        color: "var(--ink, #E9EBF0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Control Bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          backgroundColor: "var(--surface, #15181D)",
          borderBottom: "1px solid var(--line, #262B33)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              backgroundColor: "var(--pass, #4ADE80)",
              display: "inline-block",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            StickyScrollStory
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            aria-pressed={position === "left"}
            onClick={() => setPosition((p) => (p === "right" ? "left" : "right"))}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: "transparent",
              color: "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "28px",
            }}
          >
            Media Column: {position === "right" ? "Right" : "Left"}
          </button>
        </div>
      </div>

      {/* Main Component Mount */}
      <div id="demo-mount-point" style={{ padding: "2rem 1.5rem" }}>
        <StickyScrollStory steps={SAMPLE_STEPS} mediaPosition={position} />
      </div>

      {/* Footer Diagnostic Bar */}
      <div
        className="mono"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 20,
          display: "flex",
          justifyContent: "space-between",
          padding: "0.6rem 1rem",
          fontSize: "11px",
          color: "var(--muted, #9AA1AF)",
          borderTop: "1px solid var(--line, #262B33)",
          backgroundColor: "var(--surface, #15181D)",
        }}
      >
        <span>Layout: Pure CSS Sticky (Desktop) / Stacked (Mobile)</span>
        <span>
          Motion: {prefersReduced ? "Reduced (Instant Swaps)" : "Active (CSS Crossfade)"}
        </span>
      </div>
    </div>
  );
}
