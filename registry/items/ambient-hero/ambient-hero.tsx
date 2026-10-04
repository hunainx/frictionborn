// Original — Frictionborn Motion AmbientHero composition
"use client";

import React, { useState } from "react";
import { useCapability, usePaused, pauseAll, resumeAll } from "@frictionborn/runtime";
import { NoiseField } from "@/components/ui/noise-field";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { ParticleField } from "@/components/ui/particle-field";
import { TextReveal } from "@/components/ui/text-reveal";
import { MagneticButton } from "@/components/ui/magnetic-button";

export type AmbientHeroVariant = "mesh" | "noise" | "particles";

export interface AmbientHeroCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface AmbientHeroProps {
  /** Ambient background generator variant (exactly 1 WebGL context). */
  variant?: AmbientHeroVariant;
  /** Eyebrow label above the primary headline. */
  eyebrow?: string;
  /** Primary headline rendered with TextReveal as an h1. */
  title?: string;
  /** Descriptive body copy under the headline. */
  description?: string;
  /** Primary call-to-action button/link with magnetic pull. */
  primaryCta?: AmbientHeroCta;
  /** Secondary call-to-action button/link. */
  secondaryCta?: AmbientHeroCta;
  /** Show WCAG 2.2.2 compliant pause button for ambient animation. */
  showPauseButton?: boolean;
  /** Additional CSS class names. */
  className?: string;
  /** Custom inline styles. */
  style?: React.CSSProperties;
}

export function AmbientHero({
  variant = "mesh",
  eyebrow = "Studio Series · Gen 3",
  title = "Acoustic precision, sculpted in aluminum.",
  description = "Near-field studio monitors engineered for uncoloured listening environments. Solid billet enclosure, balanced beryllium drivers, and pure passive filtration.",
  primaryCta = { label: "Explore engineering", href: "#engineering" },
  secondaryCta = { label: "Technical specifications", href: "#specifications" },
  showPauseButton = true,
  className,
  style,
}: AmbientHeroProps) {
  const cap = useCapability(); // @frictionborn-guard
  const isPaused = usePaused();
  const [internalPaused, setInternalPaused] = useState(false);

  const paused = isPaused || internalPaused;

  const togglePause = () => {
    if (paused) {
      resumeAll();
      setInternalPaused(false);
    } else {
      pauseAll();
      setInternalPaused(true);
    }
  };

  const renderBackground = () => {
    // Only one background component is ever rendered (at most 1 WebGL context)
    if (variant === "noise") {
      return (
        <NoiseField
          speed={0.4}
          scale={1.8}
          style={{ width: "100%", height: "100%" }}
        />
      );
    }
    if (variant === "particles") {
      return (
        <ParticleField
          count={2500}
          speed={0.4}
          style={{ width: "100%", height: "100%" }}
        />
      );
    }
    // Default: "mesh"
    return (
      <MeshGradient
        speed={0.3}
        style={{ width: "100%", height: "100%" }}
      />
    );
  };

  return (
    <header
      data-frictionborn-item="ambient-hero"
      data-tier={cap.tier}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "560px",
        height: "calc(100vh - 4rem)",
        maxHeight: "840px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        boxSizing: "border-box",
        background: "var(--background, #0d0f12)",
        color: "var(--foreground, #e9ebf0)",
        ...style,
      }}
    >
      {/* 1. Ambient Background (at most 1 WebGL context above the fold) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        {renderBackground()}
      </div>

      {/* 2. Contrast Scrim (ensures contrast >= 4.5:1 across dark and light) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(13, 15, 18, 0.45) 0%, rgba(13, 15, 18, 0.85) 100%), linear-gradient(to bottom, rgba(13, 15, 18, 0.6) 0%, rgba(13, 15, 18, 0.3) 40%, rgba(13, 15, 18, 0.8) 100%)",
          backdropFilter: "blur(0.5px)",
        }}
      />

      {/* 3. WCAG 2.2.2 Accessible Pause Control */}
      {showPauseButton && (
        <button
          type="button"
          onClick={togglePause}
          aria-label={paused ? "Resume ambient background motion" : "Pause ambient background motion"}
          aria-pressed={paused}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            zIndex: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.75rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono, monospace)",
            color: "rgba(255, 255, 255, 0.9)",
            background: "rgba(13, 15, 18, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "999px",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: paused ? "#f59e0b" : "#10b981",
              boxShadow: paused ? "0 0 6px #f59e0b" : "0 0 6px #10b981",
            }}
          />
          <span>{paused ? "Paused" : "Motion"}</span>
        </button>
      )}

      {/* 4. Semantic Content (Single <h1>, fully accessible, keyboard reachable) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "800px",
          width: "100%",
          margin: "0 auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        {eyebrow && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.3rem 0.85rem",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono, monospace)",
              color: "#fb923c",
              background: "rgba(251, 146, 60, 0.12)",
              border: "1px solid rgba(251, 146, 60, 0.28)",
            }}
          >
            {eyebrow}
          </div>
        )}

        <TextReveal
          as="h1"
          by="word"
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 5vw, 3.75rem)",
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            textShadow: "0 2px 20px rgba(0, 0, 0, 0.6)",
          }}
        >
          {title}
        </TextReveal>

        {description && (
          <p
            style={{
              margin: 0,
              maxWidth: "600px",
              fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
              lineHeight: 1.6,
              color: "rgba(233, 235, 240, 0.92)",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            {description}
          </p>
        )}

        {/* Action CTAs with MagneticButton */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "0.75rem",
          }}
        >
          {primaryCta && (
            <MagneticButton strength={18}>
              <a
                href={primaryCta.href || "#"}
                onClick={primaryCta.onClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "44px",
                  padding: "0 1.5rem",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: "#0d0f12",
                  background: "#ffffff",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
                  transition: "background 150ms ease, transform 150ms ease",
                }}
              >
                {primaryCta.label}
              </a>
            </MagneticButton>
          )}

          {secondaryCta && (
            <MagneticButton strength={14}>
              <a
                href={secondaryCta.href || "#"}
                onClick={secondaryCta.onClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "44px",
                  padding: "0 1.35rem",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: "#ffffff",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  backdropFilter: "blur(6px)",
                  transition: "background 150ms ease, border-color 150ms ease",
                }}
              >
                {secondaryCta.label}
              </a>
            </MagneticButton>
          )}
        </div>
      </div>
    </header>
  );
}
export default AmbientHero;
