// Original — Frictionborn Motion StickyScrollStory
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReducedMotion, useCapability, useHydrated } from "@frictionborn/runtime";

export interface StoryStep {
  id: string;
  title: string;
  description: string;
  badge?: string;
  media: {
    type?: "image" | "custom";
    src?: string;
    alt?: string;
    content?: React.ReactNode;
  };
}

export interface StickyScrollStoryProps {
  steps: StoryStep[];
  className?: string;
  style?: React.CSSProperties;
  mediaPosition?: "left" | "right";
  onStepChange?: (stepId: string) => void;
}

export function StickyScrollStory({
  steps,
  className = "",
  style,
  mediaPosition = "right",
  onStepChange,
}: StickyScrollStoryProps) {
  const [activeStep, setActiveStep] = useState(0);
  const hydrated = useHydrated(); // @frictionborn-guard
  const prefersReduced = useReducedMotion(); // @frictionborn-guard
  const capability = useCapability(); // @frictionborn-guard
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  // Zero window scroll listeners: use IntersectionObserver to detect active step in viewport
  useEffect(() => {
    if (!hydrated || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const indexStr = entry.target.getAttribute("data-step-index");
            if (indexStr !== null) {
              const idx = parseInt(indexStr, 10);
              if (!isNaN(idx)) {
                setActiveStep(idx);
                if (onStepChangeRef.current && steps[idx]) {
                  onStepChangeRef.current(steps[idx].id);
                }
              }
            }
          }
        }
      },
      {
        root: null,
        rootMargin: "-30% 0px -30% 0px", // active in center 40% band of screen
        threshold: 0.1,
      }
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [hydrated, steps.length]);

  return (
    <div
      data-frictionborn-item="sticky-scroll-story"
      data-tier={capability.tier}
      className={`fb-sticky-scroll-story ${className}`}
      style={{
        position: "relative",
        width: "100%",
        ...style,
      }}
    >
      <style>{`
        .fb-sss-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          position: relative;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .fb-sss-media-col {
          position: sticky;
          top: 15vh;
          height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          overflow: hidden;
        }

        .fb-sss-media-slot {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 250ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Hidden-before-reveal only under data-motion=ok (AGENTS rule 1); reduced motion never gets data-motion=ok,
           so once hydrated it hides inactive media too (instant swap). Server HTML stays unhidden. */
        html[data-motion="ok"] .fb-sss-media-slot[data-active="false"],
        .fb-sss-container[data-hydrated="true"][data-reduced="true"] .fb-sss-media-slot[data-active="false"] {
          opacity: 0;
          pointer-events: none;
        }

        .fb-sss-media-slot[data-active="true"] {
          opacity: 1;
          pointer-events: auto;
          z-index: 2;
        }

        .fb-sss-step-card {
          min-height: 75vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem 0;
          transition: opacity 200ms ease;
        }

        .fb-sss-mobile-media {
          display: none;
        }

        @media (max-width: 768px) {
          .fb-sss-container {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
          }

          .fb-sss-media-col {
            display: none !important;
          }

          .fb-sss-step-card {
            min-height: auto;
            padding: 1.5rem 0;
          }

          .fb-sss-mobile-media {
            display: block;
            margin-top: 1.25rem;
            width: 100%;
            border-radius: 6px;
            overflow: hidden;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fb-sss-media-slot {
            transition: none !important;
          }
        }
      `}</style>

      <div
        className="fb-sss-container"
        data-hydrated={hydrated ? "true" : "false"}
        data-reduced={prefersReduced ? "true" : "false"}
        style={{
          direction: mediaPosition === "left" ? "rtl" : "ltr",
        }}
      >
        {/* Narrative Scrolling Column (DOM order preserved in reading order) */}
        <div
          className="fb-sss-steps-col"
          style={{
            direction: "ltr",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div
                key={step.id}
                ref={(el) => {
                  stepRefs.current[idx] = el;
                }}
                data-step-index={idx}
                aria-current={isActive ? "step" : undefined}
                className="fb-sss-step-card"
                style={{
                  opacity: 1,
                  borderLeft: isActive ? "3px solid var(--primary, currentColor)" : "3px solid transparent",
                  paddingLeft: "1.25rem",
                  transition: prefersReduced ? "none" : "border-color 200ms ease",
                }}
              >
                {step.badge && (
                  <span
                    className="mono"
                    style={{
                      display: "inline-block",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: isActive ? "var(--primary, currentColor)" : "var(--muted-foreground, color-mix(in srgb, currentColor 72%, transparent))",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {step.badge}
                  </span>
                )}
                <h2
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    margin: "0 0 1rem 0",
                  }}
                >
                  {step.title}
                </h2>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.6,
                    color: "var(--muted-foreground, color-mix(in srgb, currentColor 72%, transparent))",
                    margin: 0,
                    maxWidth: "520px",
                  }}
                >
                  {step.description}
                </p>

                {/* Mobile Inline Media (Rendered below narrative on phones without sticky position jumps) */}
                <div className="fb-sss-mobile-media">
                  {step.media.type === "image" && step.media.src ? (
                    <img
                      src={step.media.src}
                      alt={step.media.alt || step.title}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: "16/10",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: "6px",
                      }}
                    />
                  ) : (
                    step.media.content
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Sticky Media Column (Pure CSS sticky layout) */}
        <div
          className="fb-sss-media-col"
          style={{
            direction: "ltr",
            border: "1px solid var(--border, color-mix(in srgb, currentColor 20%, transparent))",
            backgroundColor: "var(--card, transparent)",
          }}
        >
          {steps.map((step, idx) => {
            const isVisible = activeStep === idx;
            return (
              <div
                key={step.id}
                className="fb-sss-media-slot"
                data-active={isVisible ? "true" : "false"}
                style={{
                  zIndex: isVisible ? 2 : 1,
                }}
              >
                {step.media.type === "image" && step.media.src ? (
                  <img
                    src={step.media.src}
                    alt={step.media.alt || step.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  step.media.content
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
