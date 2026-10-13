// Original — Frictionborn Motion SmoothScroll Demo
"use client";

import React, { useState } from "react";
import { SmoothScroll } from "./smooth-scroll";
import { useReducedMotion, useCapability } from "@frictionborn/runtime";

export default function SmoothScrollDemo() {
  const [enabled, setEnabled] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const capability = useCapability();

  const isCoarse = capability.pointer === "coarse";
  const isEffectivelyActive = enabled && !prefersReduced && !isCoarse;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "800px",
        borderRadius: "8px",
        border: "1px solid var(--border, #262B33)",
        backgroundColor: "var(--background, #0D0F12)",
        color: "var(--foreground, #E9EBF0)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Sticky Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          background: "var(--card, #15181D)",
          borderBottom: "1px solid var(--border, #262B33)",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isEffectivelyActive
                ? "var(--pass, #4ADE80)"
                : "var(--muted-foreground, #9AA1AF)",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Frictionborn Studio · Field Notes
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            aria-pressed={enabled}
            onClick={() => setEnabled((e) => !e)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid var(--border, #262B33)",
              background: enabled ? "var(--primary, #FB923C)" : "transparent",
              color: enabled ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {enabled ? "Smooth scroll: on" : "Smooth scroll: off"}
          </button>
        </div>
      </header>

      {/* Main Content Area Wrapped with SmoothScroll */}
      <SmoothScroll enabled={enabled}>
        <div
          style={{
            position: "relative",
            padding: "2.5rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "3rem",
            maxWidth: "840px",
            margin: "0 auto",
          }}
        >
          {/* Article Header */}
          <section>
            <span
              className="mono"
              style={{
                fontSize: "0.8rem",
                color: "var(--primary, #FB923C)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Field notes · Brand story
            </span>
            <h2
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                margin: "0 0 1rem 0",
              }}
            >
              How friction becomes a working fire
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.6,
                color: "var(--muted-foreground, #9AA1AF)",
                margin: 0,
              }}
            >
              How friction makes heat, heat makes a spark, and the spark becomes a fire,
              written for people who like to read the whole story.
            </p>

            {/* Quick Section Anchor Nav */}
            <nav
              aria-label="Table of Contents"
              style={{
                marginTop: "1.5rem",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "1. Friction and Heat", href: "#sec-baseline" },
                { label: "2. The First Spark", href: "#sec-resonator" },
                { label: "3. Feeding the Fire", href: "#sec-seismic" },
                { label: "4. Bench Log", href: "#sec-buffer" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "0.375rem 0.625rem",
                    fontSize: "0.75rem",
                    borderRadius: "4px",
                    border: "1px solid var(--border, #262B33)",
                    color: "var(--foreground, #E9EBF0)",
                    textDecoration: "none",
                    background: "rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </section>

          {/* Section 1: Friction and the First Heat */}
          <section id="sec-baseline" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              1. Friction and the First Heat
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1rem" }}>
              Good motion starts with friction: the small resistance that tells a hand something is really there.
              We look for places where a page can push back gently, such as a button that leans to the pointer
              or a headline that settles.
            </p>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)" }}>
              That resistance makes heat. Heat is attention, and we spend it with care, one effect at a time,
              so the content stays the brightest thing on the page and the motion stays behind it.
            </p>
          </section>

          {/* Section 2: Baffle Damping and Transient Response */}
          <section id="sec-resonator" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              2. The Spark and the Moment It Settles
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1.25rem" }}>
              A spark is brief. Each effect arrives, does its work and settles quickly, so the
              page is calm again before you look away.
            </p>

            {/* SVG Frequency Stability Curve */}
            <div
              style={{
                padding: "1.25rem",
                backgroundColor: "var(--card, #15181D)",
                borderRadius: "8px",
                border: "1px solid var(--border, #262B33)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--primary, #FB923C)",
                  marginBottom: "0.75rem",
                }}
              >
                Figure 2.1 · A spark that flares, then settles (illustration)
              </div>
              <svg viewBox="0 0 600 160" width="100%" height="160" aria-label="Illustration of a spark that flares and settles over time">
                <line x1="40" y1="20" x2="40" y2="130" stroke="var(--border, #262B33)" strokeWidth="1" />
                <line x1="40" y1="130" x2="580" y2="130" stroke="var(--border, #262B33)" strokeWidth="1" />
                <path
                  d="M 50 40 Q 150 90, 280 115 T 570 95"
                  fill="none"
                  stroke="var(--primary, #FB923C)"
                  strokeWidth="2"
                />
                <circle cx="280" cy="115" r="4" fill="var(--primary, #FB923C)" />
                <text x="290" y="110" fill="var(--foreground, #E9EBF0)" fontSize="10" fontFamily="monospace">
                  Settled
                </text>
                <text x="40" y="145" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
                  start
                </text>
                <text x="280" y="145" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
                  time
                </text>
                <text x="540" y="145" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
                  later
                </text>
              </svg>
            </div>
          </section>

          {/* Section 3: Seismic Rejection & Inertial Decoupling */}
          <section id="sec-seismic" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              3. Feeding the Fire
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1rem" }}>
              A fire needs tending. Every component is measured on a test bench in real browsers
              and each one respects reduced motion.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid var(--border, #262B33)",
                background: "transparent",
                color: "var(--foreground, #E9EBF0)",
                fontSize: "0.85rem",
                cursor: "pointer",
                minHeight: "40px",
              }}
            >
              Read the workshop note
            </button>
          </section>

          {/* Section 4: Nested Test Log Buffer */}
          <section id="sec-buffer" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              4. The Bench Log
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1rem" }}>
              A running list of bench notes. This nested container keeps its own native scroll,
              unaffected by the page-level SmoothScroll provider.
            </p>

            <div
              data-lenis-prevent="true"
              tabIndex={0}
              aria-label="The bench log"
              style={{
                height: "220px",
                overflowY: "auto",
                backgroundColor: "var(--card, #15181D)",
                borderRadius: "6px",
                border: "1px solid var(--border, #262B33)",
                padding: "1rem",
                fontFamily: "monospace",
                fontSize: "11px",
                lineHeight: "1.8",
                color: "var(--foreground, #E9EBF0)",
              }}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ color: "var(--primary, #FB923C)", marginRight: "1rem" }}>
                    [Step {(i + 1).toString().padStart(2, "0")}]
                  </span>
                  <span>Bench observation {i + 1} · note recorded</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </SmoothScroll>

      {/* Modal Dialog (proving allowNestedScroll & modal native handling) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-dialog-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--card, #15181D)",
              border: "1px solid var(--border, #262B33)",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2 id="cert-dialog-title" style={{ fontSize: "1.25rem", margin: "0 0 1rem 0" }}>
              Workshop note
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground, #9AA1AF)", lineHeight: 1.6 }}>
              Each Frictionborn component is run on the same test bench before it leaves the workshop.
              This text is sample copy for the demo.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: "1.5rem",
                padding: "0.5rem 1rem",
                minHeight: "44px",
                minWidth: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "var(--primary, #FB923C)",
                color: "var(--background, #0D0F12)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
