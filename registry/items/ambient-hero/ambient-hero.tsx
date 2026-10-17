// Original — Frictionborn Motion AmbientHero composition
"use client";

import React, { useState, useEffect } from "react";
import { useCapability, usePaused, resumeAll, type PaletteName } from "@frictionborn/runtime";
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

export interface AmbientHeroProps extends React.HTMLAttributes<HTMLElement> {
  /** Primary headline rendered with TextReveal as an h1 (required in TypeScript). */
  headline: string;
  /** Descriptive body copy under the headline (required in TypeScript). */
  body: string;
  /** Primary call-to-action button/link with magnetic pull (required in TypeScript). */
  primaryCta: AmbientHeroCta;
  /** Ambient background generator variant (exactly 1 WebGL context). */
  variant?: AmbientHeroVariant;
  /** Colours of the background variant from a palette (DESIGN.md A8): `fire` | `ice` | `neon` | `mono` | `custom`. Leave it out to keep the host's tokens. */
  palette?: PaletteName;
  /** Custom background slot overriding variant if provided. */
  background?: React.ReactNode;
  /** Eyebrow label above the primary headline. */
  eyebrow?: string;
  /** Secondary call-to-action button/link. */
  secondaryCta?: AmbientHeroCta;
  /** Show WCAG 2.2.2 compliant pause button for ambient animation. */
  showPauseButton?: boolean;
  /** Universal paused prop. */
  paused?: boolean;
  /** CSP nonce, forwarded to the `<style>` element of the headline reveal. */
  nonce?: string;
}

export const AmbientHero = React.forwardRef<HTMLElement, AmbientHeroProps>(
  function AmbientHero(
    {
      headline,
      body,
      primaryCta,
      secondaryCta,
      eyebrow,
      variant = "mesh",
      palette,
      background,
      showPauseButton = true,
      paused: propPaused = false,
      nonce,
      className,
      style,
      ...rest
    },
    ref
  ) {
    const cap = useCapability(); // @frictionborn-guard
    const isGlobalPaused = usePaused();
    const [internalPaused, setInternalPaused] = useState(false);
    const [leaseReady, setLeaseReady] = useState(false);

    // Defer GL lease until after initial paint / LCP so typography renders first without GPU contention
    useEffect(() => {
      if (typeof window === "undefined") return;

      let activated = false;
      const activate = () => {
        if (activated) return;
        activated = true;
        setLeaseReady(true);
      };

      // If the page already finished loading (client-side navigation, a re-mount), activate immediately
      if (document.readyState === "complete") {
        activate();
        return;
      }

      let po: PerformanceObserver | null = null;
      try {
        if (
          typeof PerformanceObserver !== "undefined" &&
          PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")
        ) {
          po = new PerformanceObserver(() => {
            if ("requestIdleCallback" in window) {
              (window as unknown as { requestIdleCallback: (cb: () => void, opt: { timeout: number }) => number }).requestIdleCallback(
                activate,
                { timeout: 600 }
              );
            } else {
              setTimeout(activate, 100);
            }
          });
          po.observe({ type: "largest-contentful-paint", buffered: true });
        }
      } catch {
        // Fallback if PO throws
      }

      const fallbackTimer = setTimeout(activate, 1500);

      return () => {
        po?.disconnect();
        clearTimeout(fallbackTimer);
      };
    }, []);

    const paused = isGlobalPaused || internalPaused || propPaused;

    // The button stops the hero's own background (the `paused` prop of the variant). It used to call the global pauseAll(),
    // which stops the shared frame loop for the whole page, including SmoothScroll's Lenis stepping.
    const togglePause = () => {
      if (paused) {
        if (isGlobalPaused) resumeAll();
        setInternalPaused(false);
      } else {
        setInternalPaused(true);
      }
    };

    const renderBackground = () => {
      if (background) return background;
      if (!leaseReady) return null;

      // Only one background component is ever rendered (at most 1 WebGL context)
      if (variant === "noise") {
        return (
          <NoiseField
            speed={0.4}
            scale={1.8}
            paused={paused}
            palette={palette}
            style={{ width: "100%", height: "100%" }}
          />
        );
      }
      if (variant === "particles") {
        return (
          <ParticleField
            count={2500}
            speed={0.4}
            paused={paused}
            palette={palette}
            style={{ width: "100%", height: "100%" }}
          />
        );
      }
      // Default: "mesh"
      return (
        <MeshGradient
          speed={0.85}
          paused={paused}
          palette={palette}
          style={{ width: "100%", height: "100%" }}
        />
      );
    };

    return (
      <header
        ref={ref}
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
          background: "var(--background, Canvas)",
          color: "var(--foreground, CanvasText)",
          ...style,
        }}
        {...rest}
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

        {/* 2. Contrast Scrim (ensures contrast >= 4.5:1 across dark and light without over-muting background) */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--background, Canvas) 32%, transparent) 0%, color-mix(in srgb, var(--background, Canvas) 72%, transparent) 100%)",
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
              color: "var(--foreground, currentColor)",
              background: "color-mix(in srgb, var(--background, Canvas) 65%, transparent)",
              border: "1px solid var(--border, color-mix(in srgb, currentColor 20%, transparent))",
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
                background: paused ? "var(--muted-foreground, GrayText)" : "var(--primary, Highlight)",
                boxShadow: paused ? "0 0 6px var(--muted-foreground, GrayText)" : "0 0 6px var(--primary, Highlight)",
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
                color: "var(--primary, currentColor)",
                background: "color-mix(in srgb, var(--background, Canvas) 82%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary, currentColor) 28%, transparent)",
              }}
            >
              {eyebrow}
            </div>
          )}

          <TextReveal
            as="h1"
            by="word"
            nonce={nonce}
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.75rem)",
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--foreground, currentColor)",
              textShadow: "0 2px 20px color-mix(in srgb, var(--background, Canvas) 60%, transparent)",
            }}
          >
            {headline}
          </TextReveal>

          {body && (
            <p
              style={{
                margin: 0,
                maxWidth: "600px",
                fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
                lineHeight: 1.6,
                // Full foreground, not muted: over a live canvas the muted token measured 3.3-3.9:1 in the light theme (mesh, noise)
                color: "var(--foreground, CanvasText)",
                textShadow: "0 1px 8px color-mix(in srgb, var(--background, Canvas) 50%, transparent)",
              }}
            >
              {body}
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
              <MagneticButton pullDistance={18}>
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
                    color: "var(--primary-foreground, HighlightText)",
                    background: "var(--primary, Highlight)",
                    boxShadow: "0 4px 14px color-mix(in srgb, var(--background, Canvas) 35%, transparent)",
                    transition: "background 150ms ease, transform 150ms ease",
                  }}
                >
                  {primaryCta.label}
                </a>
              </MagneticButton>
            )}

            {secondaryCta && (
              <MagneticButton pullDistance={14}>
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
                    color: "var(--foreground, CanvasText)",
                    background: "var(--secondary, color-mix(in srgb, currentColor 8%, transparent))",
                    border: "1px solid var(--border, color-mix(in srgb, currentColor 22%, transparent))",
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
);

AmbientHero.displayName = "AmbientHero";

export default AmbientHero;

