// Original — Frictionborn Motion combined stress and composition test page
"use client";

import React from "react";
import { SmoothScroll } from "../../../../registry/items/smooth-scroll/smooth-scroll";
import { StickyScrollStory } from "../../../../registry/items/sticky-scroll-story/sticky-scroll-story";
import { NoiseField } from "../../../../registry/items/noise-field/noise-field";
import { Marquee } from "../../../../registry/items/marquee/marquee";

const COMBINED_STEPS = [
  {
    id: "step-1",
    badge: "Combined 01",
    title: "Unified Single-Loop Scheduling",
    description: "Multiple complex motion primitives run together on the same screen without spawning competing requestAnimationFrame loops.",
    media: {
      type: "custom" as const,
      content: (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--signal, #FB923C)" }}>
          <h3>Single Engine Loop</h3>
          <p style={{ color: "var(--muted, #9AA1AF)" }}>Shared rAF loop tick across GL and DOM</p>
        </div>
      ),
    },
  },
  {
    id: "step-2",
    badge: "Combined 02",
    title: "Interlocked Context Leases",
    description: "WebGL context budget is strictly enforced so background shaders never starve subsequent visual moments.",
    media: {
      type: "custom" as const,
      content: (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--pass, #4ADE80)" }}>
          <h3>Context Budget &le; 4</h3>
          <p style={{ color: "var(--muted, #9AA1AF)" }}>Active leases tracked in memory</p>
        </div>
      ),
    },
  },
];

export default function CombinedTestPage() {
  return (
    <SmoothScroll>
      <div
        data-testid="combined-container"
        style={{
          minHeight: "2200px",
          position: "relative",
          backgroundColor: "var(--bg, #0D0F12)",
          color: "var(--ink, #E9EBF0)",
        }}
      >
        {/* 1. Hero with NoiseField Background */}
        <section
          style={{
            position: "relative",
            height: "70vh",
            minHeight: "480px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <NoiseField
            colors={["#0D0F12", "#FB923C", "#3B82F6"]}
            style={{ position: "absolute", inset: 0 }}
          >
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "2rem" }}>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, margin: 0 }}>
                Combined Architectural Stress Page
              </h1>
              <p style={{ color: "var(--muted, #9AA1AF)", marginTop: "1rem" }}>
                SmoothScroll + StickyScrollStory + NoiseField + Marquee
              </p>
            </div>
          </NoiseField>
        </section>

        {/* 2. Marquee Social Proof Strip */}
        <section style={{ padding: "2rem 0", borderTop: "1px solid var(--line, #262B33)", borderBottom: "1px solid var(--line, #262B33)" }}>
          <Marquee speed={40} pauseOnHover={true}>
            <span style={{ margin: "0 2rem", fontWeight: 600 }}>01 ZERO SLOP</span>
            <span style={{ margin: "0 2rem", fontWeight: 600 }}>02 SINGLE RAF LOOP</span>
            <span style={{ margin: "0 2rem", fontWeight: 600 }}>03 DEFENSIVE TIERS</span>
            <span style={{ margin: "0 2rem", fontWeight: 600 }}>04 ZERO IDLE FRAMES</span>
          </Marquee>
        </section>

        {/* 3. StickyScrollStory Editorial Section */}
        <section style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <StickyScrollStory steps={COMBINED_STEPS} />
        </section>
      </div>
    </SmoothScroll>
  );
}
