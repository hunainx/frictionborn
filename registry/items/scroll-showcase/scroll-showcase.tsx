// Original — Frictionborn Motion ScrollShowcase composition
"use client";

import React from "react";
import { useCapability } from "@frictionborn/runtime";
import { StickyScrollStory, type StoryStep } from "@/components/ui/sticky-scroll-story";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Marquee } from "@/components/ui/marquee";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

export interface ScrollShowcaseSpec {
  metric: string;
  label: string;
  detail: string;
}

export interface ScrollShowcaseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary headline rendered as an h2 (required in TypeScript). */
  headline: string;
  /** Descriptive section narrative under the headline (required in TypeScript). */
  description: string;
  /** Narrative steps for StickyScrollStory (required in TypeScript). */
  steps: StoryStep[];
  /** Optional eyebrow text above the headline. */
  eyebrow?: string;
  /** Optional specifications / highlights grid. */
  specs?: ScrollShowcaseSpec[];
  /** Optional specifications section heading. */
  specsHeading?: string;
  /** Optional specifications eyebrow. */
  specsEyebrow?: string;
  /** Include the reference marquee strip (default: true if marqueeItems provided). */
  showMarquee?: boolean;
  /** Items to display in the marquee strip. */
  marqueeItems?: React.ReactNode[];
  /** Eyebrow label for the marquee strip. */
  marqueeLabel?: string;
  /** Enable SmoothScroll provider (off by default per PRD 6.12). */
  smoothScroll?: boolean;
  /** Universal paused prop. */
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollShowcase = React.forwardRef<HTMLDivElement, ScrollShowcaseProps>(
  function ScrollShowcase(
    {
      headline,
      description,
      steps,
      eyebrow,
      specs,
      specsHeading = "Laboratory verification standards",
      specsEyebrow = "Measured Tolerances",
      showMarquee = true,
      marqueeItems,
      marqueeLabel = "Reference deployments in critical listening rooms",
      smoothScroll = false,
      paused = false,
      className,
      style,
      ...rest
    },
    ref
  ) {
    const cap = useCapability(); // @frictionborn-guard

    const content = (
      <div
        ref={ref}
        data-frictionborn-item="scroll-showcase"
        data-tier={cap.tier}
        className={className}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "var(--background, Canvas)",
          color: "var(--foreground, CanvasText)",
          ...style,
        }}
        {...rest}
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
          {eyebrow && (
            <span
              style={{
                display: "inline-block",
                fontSize: "0.8rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--primary, currentColor)",
                marginBottom: "0.75rem",
              }}
            >
              {eyebrow}
            </span>
          )}
          <ScrollReveal paused={paused}>
            <h2
              id="architecture-heading"
              style={{
                margin: "0 0 1rem 0",
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "var(--foreground, currentColor)",
              }}
            >
              {headline}
            </h2>
          </ScrollReveal>
          <ScrollReveal paused={paused}>
            <p
              style={{
                margin: "0 auto",
                maxWidth: "680px",
                fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
                lineHeight: 1.65,
                color: "var(--muted-foreground, color-mix(in srgb, currentColor 80%, transparent))",
              }}
            >
              {description}
            </p>
          </ScrollReveal>
        </section>

        {/* 2. Sticky Scroll Story */}
        <section
          aria-label="Interactive architecture deep-dive"
          style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <StickyScrollStory steps={steps} paused={paused} />
        </section>

        {/* 3. Feature Specifications Grid with ScrollReveal (if provided) */}
        {specs && specs.length > 0 && (
          <section
            aria-labelledby="performance-heading"
            style={{
              maxWidth: "1000px",
              margin: "4rem auto 0 auto",
              padding: "4rem 1.5rem",
              boxSizing: "border-box",
              borderTop: "1px solid var(--border, color-mix(in srgb, currentColor 18%, transparent))",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              {specsEyebrow && (
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "var(--primary, currentColor)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {specsEyebrow}
                </span>
              )}
              <ScrollReveal paused={paused}>
                <h3
                  id="performance-heading"
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontWeight: 600,
                    lineHeight: 1.25,
                    letterSpacing: "-0.02em",
                    color: "var(--foreground, currentColor)",
                  }}
                >
                  {specsHeading}
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
              {specs.map((spec) => (
                <ScrollReveal key={spec.label} paused={paused}>
                  <div
                    style={{
                      padding: "2rem",
                      borderRadius: "10px",
                      background: "var(--card, color-mix(in srgb, currentColor 5%, transparent))",
                      border: "1px solid var(--border, color-mix(in srgb, currentColor 18%, transparent))",
                      height: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono, monospace)",
                        color: "var(--primary, currentColor)",
                      }}
                    >
                      {spec.metric}
                    </div>
                    <h4
                      style={{
                        margin: "0.75rem 0 0.5rem 0",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        color: "var(--foreground, currentColor)",
                      }}
                    >
                      {spec.label}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: "var(--muted-foreground, color-mix(in srgb, currentColor 75%, transparent))",
                      }}
                    >
                      {spec.detail}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* 4. Client / Reference Marquee (if items provided and enabled) */}
        {showMarquee && marqueeItems && marqueeItems.length > 0 && (
          <section
            aria-label="Reference deployments"
            style={{
              padding: "3rem 0 5rem 0",
              borderTop: "1px solid var(--border, color-mix(in srgb, currentColor 18%, transparent))",
              overflow: "hidden",
            }}
          >
            {marqueeLabel && (
              <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "0 1.5rem" }}>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "var(--muted-foreground, color-mix(in srgb, currentColor 75%, transparent))",
                  }}
                >
                  {marqueeLabel}
                </span>
              </div>
            )}
            <Marquee pixelsPerSecond={32} paused={paused} pauseOnHover={true} pauseOnFocus={true}>
              {marqueeItems.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 2rem",
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--muted-foreground, color-mix(in srgb, currentColor 75%, transparent))",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item}
                </span>
              ))}
            </Marquee>
          </section>
        )}
      </div>
    );

    if (smoothScroll) {
      return <SmoothScroll paused={paused}>{content}</SmoothScroll>;
    }

    return content;
  }
);

ScrollShowcase.displayName = "ScrollShowcase";

export default ScrollShowcase;
