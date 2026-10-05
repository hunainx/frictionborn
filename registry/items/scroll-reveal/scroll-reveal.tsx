// Original — Frictionborn Motion ScrollReveal
"use client";

import React, { useRef, useState, useImperativeHandle } from "react";
import { useInView, useReducedMotion, useCapability, useHydrated } from "@frictionborn/runtime";

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  animation?: "fade-up" | "fade" | "scale-up";
  distance?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
  maxTier?: number;
  /**
   * When true, halts animation and locks the component in its final, fully revealed state
   * (opacity: 1, transform: none) for clean static screenshots, debugging, or paused playback.
   */
  paused?: boolean;
  nonce?: string;
  ref?: React.Ref<HTMLElement | null>;
}

const SCROLL_REVEAL_STYLES = `
  @supports (animation-timeline: view()) {
    [data-motion="ok"] .fb-sr-track {
      animation-timeline: view();
      animation-range: entry 0% entry 100%;
      animation-fill-mode: both;
      will-change: transform, opacity;
    }
    [data-motion="ok"] .fb-sr-track[data-anim="fade"] {
      animation-name: fb-sr-v-fade;
    }
    [data-motion="ok"] .fb-sr-track[data-anim="fade-up"] {
      animation-name: fb-sr-v-fade-up;
    }
    [data-motion="ok"] .fb-sr-track[data-anim="scale-up"] {
      animation-name: fb-sr-v-scale-up;
    }
  }

  @keyframes fb-sr-v-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fb-sr-v-fade-up {
    from {
      opacity: 0;
      transform: translateY(var(--fb-sr-dist, 24px));
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes fb-sr-v-scale-up {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(calc(var(--fb-sr-dist, 24px) / 2));
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @supports not (animation-timeline: view()) {
    [data-motion="ok"] .fb-sr-track {
      opacity: 0;
      transform: var(--fb-sr-initial-transform, translateY(24px));
      transition: opacity var(--fb-sr-duration, 400ms) cubic-bezier(0.22, 1, 0.36, 1),
                  transform var(--fb-sr-duration, 400ms) cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }
    [data-motion="ok"] .fb-sr-track.is-visible {
      opacity: 1;
      transform: none;
      will-change: auto;
    }
  }

  /* Paused guard: locks into final revealed state */
  [data-motion="ok"] .fb-sr-track.is-paused {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }

  /* Focus guard: anything with focus is forced visible */
  [data-motion="ok"] .fb-sr-track:focus-within,
  [data-motion="ok"] .fb-sr-track:has(:focus) {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-motion="ok"] .fb-sr-track {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
      animation: none !important;
    }
  }
`;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

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
  paused = false,
  nonce,
  ref,
  ...rest
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
  if (inView && !hasEntered) {
    setHasEntered(true);
  }

  // Above-the-fold content must never dip on hydrate in browsers without CSS scroll-driven animations
  useIsomorphicLayoutEffect(() => {
    const el = elemRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setHasEntered(true);
      }
    }
  }, []);

  const effectiveDistance = resolvedTier <= 1 ? Math.min(distance, 12) : distance;
  const isRevealed =
    reducedMotionActive ||
    resolvedTier === 0 ||
    paused ||
    (once ? (hasEntered || inView) : inView);

  // Transform styles based on animation variant
  let initialTransform = `translateY(${effectiveDistance}px)`;
  if (animation === "fade") {
    initialTransform = "none";
  } else if (animation === "scale-up") {
    initialTransform = `scale(0.96) translateY(${effectiveDistance / 2}px)`;
  }

  useImperativeHandle(ref, () => elemRef.current as HTMLElement, []);

  return (
    <Component
      ref={elemRef}
      data-frictionborn-item="scroll-reveal"
      data-tier={resolvedTier}
      className={`fb-scroll-reveal ${className}`}
      style={{
        display: "block",
        position: "relative",
        ...style,
      }}
      {...rest}
    >
      <style nonce={nonce}>
        {SCROLL_REVEAL_STYLES}
      </style>

      <div
        className={
          isClientHydrated && !reducedMotionActive && resolvedTier > 0
            ? `fb-sr-track ${isRevealed ? "is-visible" : ""} ${paused ? "is-paused" : ""}`
            : ""
        }
        data-anim={animation}
        style={
          {
            "--fb-sr-dist": `${effectiveDistance}px`,
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
