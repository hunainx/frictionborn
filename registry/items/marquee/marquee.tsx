// Original — Frictionborn Motion Marquee
"use client";

import React, { useRef, useState, useEffect } from "react";
import { useInView, useReducedMotion, useCapability, useHydrated, usePaused } from "@frictionborn/runtime";

export interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  showPauseButton?: boolean;
  gap?: string | number;
  className?: string;
  style?: React.CSSProperties;
  maxTier?: number;
}

export function Marquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = true,
  pauseOnFocus = true,
  showPauseButton = true,
  gap = "2rem",
  className = "",
  style,
  maxTier = 3,
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
    if (trackWidth > 0 && speed > 0) {
      setDuration(Math.max(5, trackWidth / speed));
    }
  }, [children, speed, gap]);

  const formattedGap = typeof gap === "number" ? `${gap}px` : gap;
  const isPaused = !inView || globalPaused || localPaused || prefersReduced || tier === 0;

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
        ...style,
      }}
    >
      <style>{`
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

        .fb-marquee:hover [data-pause-hover="true"] .fb-marquee-track {
          animation-play-state: paused;
        }

        .fb-marquee:focus-within [data-pause-focus="true"] .fb-marquee-track {
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

      {/* Marquee Viewport */}
      <div
        className="fb-marquee-viewport"
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Marquee Content Wrap */}
        <div
          data-pause-hover={pauseOnHover ? "true" : undefined}
          data-pause-focus={pauseOnFocus ? "true" : undefined}
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
              inert={true as any}
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
