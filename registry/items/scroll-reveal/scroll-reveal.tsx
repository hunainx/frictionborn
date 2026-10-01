// Original — Frictionborn Motion ScrollReveal
"use client";

import React, { useRef, useState, useEffect } from "react";
import { useInView, useReducedMotion, useCapability, useHydrated } from "@frictionborn/runtime";

export interface ScrollRevealProps {
  children: React.ReactNode;
  as?: React.ElementType;
  animation?: "fade-up" | "fade" | "scale-up";
  distance?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
  maxTier?: number;
}

export function ScrollReveal({
  children,
  as: Component = "div",
  animation = "fade-up",
  distance = 24,
  duration = 400,
  className = "",
  style,
  once = true,
  maxTier = 3,
}: ScrollRevealProps) {
  const elemRef = useRef<HTMLElement>(null);
  const isClientHydrated = useHydrated();
  const reducedMotionActive = useReducedMotion();
  const capabilityInfo = useCapability();
  const resolvedTier = Math.min(capabilityInfo.tier, maxTier);

  // Fallback intersection observer for browsers without animation-timeline: view()
  const inView = useInView(elemRef as React.RefObject<HTMLElement>, {
    rootMargin: "0px 0px -10% 0px",
    once,
  });

  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    if (inView) {
      setHasEntered(true);
    }
  }, [inView]);

  // Support check for animation-timeline: view()
  const [supportsViewTimeline, setSupportsViewTimeline] = useState(false);
  useEffect(() => {
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
      setSupportsViewTimeline(CSS.supports("animation-timeline", "view()"));
    }
  }, []);

  const effectiveDistance = resolvedTier <= 1 ? Math.min(distance, 12) : distance;
  const isRevealed = reducedMotionActive || resolvedTier === 0 || (once ? hasEntered : inView);

  // Transform styles based on animation variant
  let initialTransform = `translateY(${effectiveDistance}px)`;
  if (animation === "fade") {
    initialTransform = "none";
  } else if (animation === "scale-up") {
    initialTransform = `scale(0.96) translateY(${effectiveDistance / 2}px)`;
  }

  return (
    <Component
      ref={elemRef as any}
      data-frictionborn-item="scroll-reveal"
      data-tier={resolvedTier}
      className={`fb-scroll-reveal ${className}`}
      style={{
        display: "block",
        position: "relative",
        ...style,
      }}
    >
      <style>{`
        [data-motion="ok"] .fb-sr-hidden {
          opacity: 0;
          transform: var(--fb-sr-initial-transform, translateY(24px));
          transition: opacity var(--fb-sr-duration, 400ms) cubic-bezier(0.22, 1, 0.36, 1),
                      transform var(--fb-sr-duration, 400ms) cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }

        [data-motion="ok"] .fb-sr-hidden.is-visible {
          opacity: 1;
          transform: none;
          will-change: auto;
        }

        /* Focus guard: anything with focus is forced visible */
        [data-motion="ok"] .fb-sr-hidden:focus-within,
        [data-motion="ok"] .fb-sr-hidden:has(:focus) {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
          [data-motion="ok"] .fb-sr-hidden {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <div
        className={
          isClientHydrated && !reducedMotionActive && resolvedTier > 0
            ? `fb-sr-hidden ${isRevealed ? "is-visible" : ""}`
            : ""
        }
        style={
          {
            "--fb-sr-initial-transform": initialTransform,
            "--fb-sr-duration": `${duration}ms`,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </Component>
  );
}

export default ScrollReveal;
