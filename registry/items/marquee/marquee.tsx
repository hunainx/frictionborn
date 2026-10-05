// Original — Frictionborn Motion Marquee
"use client";

import React, { useRef, useState, useEffect, useImperativeHandle } from "react";
import { useInView, useReducedMotion, useCapability, useHydrated, usePaused } from "@frictionborn/runtime";

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Transit rate in physical pixels per second (default 40). */
  pixelsPerSecond?: number;
  /** Unitless multiplier on `pixelsPerSecond` (1 = as given, 0.5 = half, 2 = double). */
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  showPauseButton?: boolean;
  gap?: string | number;
  className?: string;
  style?: React.CSSProperties;
  maxTier?: number;
  paused?: boolean;
  nonce?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function Marquee({
  children,
  pixelsPerSecond = 40,
  speed = 1,
  direction = "left",
  pauseOnHover = true,
  pauseOnFocus = true,
  showPauseButton = true,
  gap = "2rem",
  className = "",
  style,
  maxTier = 3,
  paused = false,
  nonce,
  ref,
  ...rest
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const effectivePps = pixelsPerSecond * speed;

  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const globalPaused = usePaused();
  const { tier: rawTier } = useCapability();
  const tier = Math.min(rawTier, maxTier);

  const [localPaused, setLocalPaused] = useState(false);
  const [duration, setDuration] = useState(25);

  const inView = useInView(containerRef as React.RefObject<HTMLElement>, {
    rootMargin: "100px",
  });

  // Calculate duration from track width and desired pixels/second
  useEffect(() => {
    if (!trackRef.current) return;
    const trackWidth = trackRef.current.scrollWidth;
    if (trackWidth > 0 && effectivePps > 0) {
      setDuration(Math.max(5, trackWidth / effectivePps));
    }
  }, [children, effectivePps, gap]);

  const formattedGap = typeof gap === "number" ? `${gap}px` : gap;
  const isPaused = !inView || globalPaused || localPaused || paused || prefersReduced || tier === 0;

  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  return (
    <div
      ref={containerRef}
      data-frictionborn-item="marquee"
      data-tier={tier}
      data-paused={isPaused ? "true" : undefined}
      className={`fb-marquee ${className}`}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        ...style,
      }}
      {...rest}
    >
      <style nonce={nonce}>{`
        @keyframes fb-mq-slide-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(calc(-100% - var(--fb-mq-gap, 2rem))); }
        }

        @keyframes fb-mq-slide-right {
          0% { transform: translateX(calc(-100% - var(--fb-mq-gap, 2rem))); }
          100% { transform: translateX(0%); }
        }

        .fb-marquee-track {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          gap: var(--fb-mq-gap, 2rem);
          will-change: transform;
        }

        [data-motion="ok"] .fb-marquee-track.anim-left {
          animation: fb-mq-slide-left var(--fb-mq-dur, 25s) linear infinite;
        }

        [data-motion="ok"] .fb-marquee-track.anim-right {
          animation: fb-mq-slide-right var(--fb-mq-dur, 25s) linear infinite;
        }

        /* Scoped to the viewport, not the root: the Pause/Play button is a sibling of the viewport, and a root-level
           :hover / :focus-within rule also matched the button, so Play could not resume while it had focus or the pointer */
        .fb-marquee-viewport:hover [data-pause-hover="true"] .fb-marquee-track {
          animation-play-state: paused;
        }

        .fb-marquee-viewport:focus-within [data-pause-focus="true"] .fb-marquee-track {
          animation-play-state: paused;
        }

        .fb-marquee[data-paused="true"] .fb-marquee-track {
          animation-play-state: paused !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .fb-marquee-track {
            animation: none !important;
          }
        }
      `}</style>

      {/* Marquee Viewport with subtle edge fade before pause control */}
      <div
        className="fb-marquee-viewport"
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          WebkitMaskImage: "linear-gradient(to right, black calc(100% - 24px), transparent 100%)",
          maskImage: "linear-gradient(to right, black calc(100% - 24px), transparent 100%)",
        }}
      >
        {/* Marquee Content Wrap */}
        <div
          data-pause-hover={pauseOnHover ? "true" : undefined}
          data-pause-focus={pauseOnFocus ? "true" : undefined}
          // Under reduced motion this box scrolls by hand (overflow: auto); a scrollable region must be reachable by keyboard (WCAG 2.1.1)
          tabIndex={prefersReduced ? 0 : undefined}
          role={prefersReduced ? "group" : undefined}
          aria-label={prefersReduced ? "Scrollable list" : undefined}
          style={
            {
              display: "flex",
              width: "max-content",
              overflow: prefersReduced ? "auto" : "visible",
              "--fb-mq-gap": formattedGap,
              "--fb-mq-dur": `${duration}s`,
            } as React.CSSProperties
          }
        >
          {/* Original items (interactive, accessible to screen readers) */}
          <div
            ref={trackRef}
            className={`fb-marquee-track ${direction === "left" ? "anim-left" : "anim-right"}`}
            style={{ paddingRight: formattedGap }}
          >
            {children}
          </div>

          {/* Inert duplicate copy (aria-hidden and inert so screen readers & keyboard only visit items once) */}
          {(!prefersReduced && hydrated && tier > 0) && (
            <div
              aria-hidden="true"
              inert={true}
              className={`fb-marquee-track ${direction === "left" ? "anim-left" : "anim-right"}`}
            >
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Accessible Pause/Play Toggle Button (WCAG 2.2.2) - positioned outside scrolling track */}
      {showPauseButton && hydrated && !prefersReduced && (
        <button
          type="button"
          onClick={() => setLocalPaused((p) => !p)}
          aria-label={localPaused ? "Play scrolling ticker" : "Pause scrolling ticker"}
          style={{
            flexShrink: 0,
            padding: "0.375rem 0.625rem",
            fontSize: "0.75rem",
            fontWeight: 500,
            borderRadius: "4px",
            border: "1px solid var(--border, currentColor)",
            background: "var(--background, transparent)",
            color: "var(--foreground, inherit)",
            cursor: "pointer",
            marginRight: "0.5rem",
          }}
        >
          {localPaused ? "Play" : "Pause"}
        </button>
      )}
    </div>
  );
}

export default Marquee;
