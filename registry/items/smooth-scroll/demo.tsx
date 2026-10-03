// Original — Frictionborn Motion SmoothScroll Demo
"use client";

import React, { useState } from "react";
import { SmoothScroll } from "./smooth-scroll";
import { useReducedMotion, useCapability } from "@frictionborn/runtime";

export default function SmoothScrollDemo() {
  const [enabled, setEnabled] = useState(true);
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
        border: "1px solid var(--line, #262B33)",
        backgroundColor: "var(--bg, #0D0F12)",
        color: "var(--ink, #E9EBF0)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Engineering Control Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          background: "var(--surface, #15181D)",
          borderBottom: "1px solid var(--line, #262B33)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              backgroundColor: isEffectivelyActive
                ? "var(--pass, #4ADE80)"
                : "var(--muted, #9AA1AF)",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "12px",
              letterSpacing: "0.05em",
            }}
          >
            SmoothScroll Root
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            aria-pressed={enabled}
            onClick={() => setEnabled((e) => !e)}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: enabled ? "var(--signal, #FB923C)" : "transparent",
              color: enabled ? "var(--bg, #0D0F12)" : "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "28px",
            }}
          >
            {enabled ? "Provider: Enabled" : "Provider: Disabled"}
          </button>
        </div>
      </header>

      {/* Main Content Area Wrapped with SmoothScroll */}
      <SmoothScroll enabled={enabled}>
        <div
          id="demo-mount-point"
          style={{
            position: "relative",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
            maxWidth: "800px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Hero Intro */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Unified Inertial Scroll Pipeline
            </h1>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--muted, #9AA1AF)",
                margin: 0,
              }}
            >
              Lenis stepped strictly via Frictionborn’s unified useFrame loop. Native keyboard navigation, anchors, and nested scroll areas are fully preserved.
            </p>
          </div>

          {/* Quick Anchor Jump Links */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              padding: "1rem",
              backgroundColor: "var(--surface, #15181D)",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
            }}
          >
            <span className="mono" style={{ fontSize: "11px", color: "var(--muted, #9AA1AF)", alignSelf: "center", marginRight: "0.5rem" }}>
              Native Anchors:
            </span>
            <a
              href="#section-1"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--signal, #FB923C)",
                textDecoration: "none",
              }}
            >
              #section-1
            </a>
            <a
              href="#section-2"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--signal, #FB923C)",
                textDecoration: "none",
              }}
            >
              #section-2
            </a>
            <a
              href="#section-3"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--signal, #FB923C)",
                textDecoration: "none",
              }}
            >
              #section-3
            </a>
          </div>

          {/* Section 1 */}
          <div
            id="section-1"
            style={{
              padding: "1.5rem",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0" }}>01. Shared Frame Scheduling</h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted, #9AA1AF)", margin: 0 }}>
              With autoRaf disabled, Lenis never schedules its own separate animation callbacks. All scroll interpolation occurs synchronously in the single root useFrame cycle.
            </p>
          </div>

          {/* Section 2: Nested Scroll Preservation Test Container */}
          <div
            id="section-2"
            style={{
              padding: "1.5rem",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0" }}>02. Nested Scroll Container (data-lenis-prevent)</h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted, #9AA1AF)", margin: "0 0 1rem 0" }}>
              The inner box below contains independent vertical scrolling. Lenis detects nested scroll boundaries and respects native touch/wheel propagation.
            </p>

            <div
              data-lenis-prevent
              tabIndex={0}
              aria-label="Nested scroll log"
              style={{
                height: "140px",
                overflowY: "auto",
                padding: "1rem",
                borderRadius: "4px",
                backgroundColor: "var(--surface, #15181D)",
                border: "1px solid var(--line, #262B33)",
                fontSize: "12px",
                lineHeight: 1.8,
              }}
            >
              <div style={{ color: "var(--signal, #FB923C)" }}>[Nested Scroll Entry 1] Log item at timestamp 00:01</div>
              <div>[Nested Scroll Entry 2] Verifying overflow boundary containment</div>
              <div>[Nested Scroll Entry 3] Native wheel delta stays within container</div>
              <div>[Nested Scroll Entry 4] Keyboard navigation with arrow keys supported</div>
              <div>[Nested Scroll Entry 5] Page scroll does not trap inside container</div>
              <div>[Nested Scroll Entry 6] Log item at timestamp 00:06</div>
              <div>[Nested Scroll Entry 7] End of scrollable log feed</div>
            </div>
          </div>

          {/* Section 3 */}
          <div
            id="section-3"
            style={{
              padding: "1.5rem",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0" }}>03. Defensive Mobile Fallback</h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted, #9AA1AF)", margin: 0 }}>
              On touchscreens and phones with coarse pointers, SmoothScroll automatically powers down to allow 100% native hardware-composited momentum scrolling with zero jank or rubber-band interference.
            </p>
          </div>
        </div>
      </SmoothScroll>

      {/* Footer Diagnostic */}
      <footer
        className="mono"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 30,
          display: "flex",
          justifyContent: "space-between",
          padding: "0.5rem 1.25rem",
          fontSize: "11px",
          color: "var(--muted, #9AA1AF)",
          borderTop: "1px solid var(--line, #262B33)",
          background: "var(--surface, #15181D)",
        }}
      >
        <span>Engine: Lenis 1.3.26 (autoRaf: false)</span>
        <span>
          Status:{" "}
          {isEffectivelyActive
            ? "Active (stepped by useFrame)"
            : prefersReduced
            ? "Bypassed (prefers-reduced-motion)"
            : isCoarse
            ? "Bypassed (coarse touch pointer)"
            : "Off"}
        </span>
      </footer>
    </div>
  );
}
