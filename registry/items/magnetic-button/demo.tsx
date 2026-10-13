// Original — Frictionborn Motion MagneticButton demo
"use client";

import React, { useState } from "react";
import { MagneticButton } from "./magnetic-button";

export default function MagneticButtonDemo() {
  const [magneticRadius, setMagneticRadius] = useState(16);

  return (
    <section
      aria-label="Frictionborn Magnetic Button Controls"
      style={{
        padding: "3.5rem 1.5rem",
        textAlign: "center",
        maxWidth: 860,
        margin: "0 auto",
        color: "var(--foreground, #E9EBF0)",
      }}
    >
      <header style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--primary, #FB923C)",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted-foreground, #9AA1AF)",
            }}
          >
            Frictionborn Motion · Pointer Response Controls
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: "0 0 0.75rem 0",
            color: "var(--foreground, #E9EBF0)",
          }}
        >
          Magnetic Pull on Primary Actions
        </h1>
        <p
          style={{
            margin: "0 auto",
            maxWidth: "600px",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            color: "var(--muted-foreground, #9AA1AF)",
          }}
        >
          Set how far each button leans toward the pointer. With reduced motion, it stays put.
        </p>
      </header>

      {/* Optical Alignment Target Reticle (SVG) */}
      <div
        style={{
          margin: "0 auto 2.5rem auto",
          width: "200px",
          height: "200px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 200 200"
          width="200"
          height="200"
          style={{ position: "absolute", inset: 0, opacity: 0.8 }}
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--border, #262B33)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="var(--border, #262B33)"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="100"
            r="30"
            fill="none"
            stroke="var(--primary, #FB923C)"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <line
            x1="10"
            y1="100"
            x2="190"
            y2="100"
            stroke="var(--border, #262B33)"
            strokeWidth="1"
          />
          <line
            x1="100"
            y1="10"
            x2="100"
            y2="190"
            stroke="var(--border, #262B33)"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="100"
            r="3"
            fill="var(--primary, #FB923C)"
          />
        </svg>

        <span
          className="mono"
          style={{
            fontSize: "11px",
            color: "var(--muted-foreground, #9AA1AF)",
            backgroundColor: "var(--background, #0D0F12)",
            padding: "2px 6px",
            borderRadius: "4px",
            border: "1px solid var(--border, #262B33)",
            position: "relative",
            zIndex: 2,
          }}
        >
          Pointer target: centre
        </span>
      </div>

      {/* Magnetic Action Buttons */}
      <div
        style={{
          display: "inline-flex",
          gap: "1.25rem",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <MagneticButton pullDistance={magneticRadius}>
          <button
            type="button"
            style={{
              padding: "0.875rem 2rem",
              borderRadius: "6px",
              background: "var(--primary, #FB923C)",
              color: "var(--background, #0D0F12)",
              fontSize: "0.95rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Feel the pull
          </button>
        </MagneticButton>

        <MagneticButton pullDistance={Math.round(magneticRadius * 0.6)}>
          <button
            type="button"
            style={{
              padding: "0.875rem 1.75rem",
              borderRadius: "6px",
              border: "1px solid var(--border, #262B33)",
              background: "transparent",
              color: "var(--foreground, #E9EBF0)",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: "pointer",
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            A softer pull
          </button>
        </MagneticButton>
      </div>

      {/* Sensitivity Switcher */}
      <div
        style={{
          marginTop: "2.5rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "0.8rem",
            color: "var(--muted-foreground, #9AA1AF)",
            marginRight: "0.5rem",
          }}
        >
          Magnetic Attraction Radius:
        </span>
        {[10, 16, 24].map((rad) => (
          <button
            key={rad}
            type="button"
            onClick={() => setMagneticRadius(rad)}
            aria-pressed={magneticRadius === rad}
            style={{
              padding: "0.375rem 0.75rem",
              fontSize: "0.85rem",
              borderRadius: "4px",
              border: "1px solid var(--border, #262B33)",
              background: magneticRadius === rad ? "var(--primary, #FB923C)" : "transparent",
              color: magneticRadius === rad ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "44px",
              minWidth: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {rad}px
          </button>
        ))}
      </div>
    </section>
  );
}
