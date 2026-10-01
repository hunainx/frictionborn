// Original — Frictionborn Motion
"use client";

import React, { useState, useEffect, useRef, useCallback, useId, Suspense, lazy } from "react";
import {
  useCapability,
  useHydrated,
  useReducedMotion,
  useInView,
  glBudget,
  type Lease,
} from "@frictionborn/runtime";

const NoiseFieldGL = lazy(() => import("./noise-field.gl"));

export interface NoiseFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  colors?: [string, string, string];
  speed?: number;
  scale?: number;
  intensity?: number;
  scrim?: boolean;
  paused?: boolean;
  time?: number;
  maxTier?: number;
  children?: React.ReactNode;
}

export function NoiseField({
  colors = ["#0D0F12", "#FB923C", "#3B82F6"],
  speed = 1.0,
  scale = 1.8,
  intensity = 1.0,
  scrim = true,
  paused = false,
  time,
  maxTier = 3,
  className = "",
  style,
  children,
  ...props
}: NoiseFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leaseId = `noise-field:${useId()}`; // one lease per instance, never shared
  const [glKey, setGlKey] = useState(0);
  const hydrated = useHydrated(); // @frictionborn-guard
  const cap = useCapability(); // @frictionborn-guard
  const reduced = useReducedMotion(); // @frictionborn-guard
  const inView = useInView(containerRef); // @frictionborn-guard

  const [hasLease, setHasLease] = useState(false);
  const leaseRef = useRef<Lease | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [effectiveTier, setEffectiveTier] = useState<number>(3);

  // Determine active tier considering cap, maxTier and context state
  const computedTier = Math.min(cap.tier, maxTier);

  useEffect(() => {
    setEffectiveTier(computedTier);
  }, [computedTier]);

  // Context lease acquisition (PRD 6.0 + 6.1)
  useEffect(() => {
    // Only acquire WebGL context if hydrated, visible, tier >= 2, and context is healthy
    const shouldAcquire = hydrated && inView && effectiveTier >= 2;

    if (shouldAcquire && !leaseRef.current) {
      const newLease = glBudget.acquire({
        id: leaseId,
        priority: 1,
        onEvict: () => {
          leaseRef.current = null;
          setHasLease(false);
        },
      }); // @frictionborn-guard
      if (newLease) {
        leaseRef.current = newLease;
        setHasLease(true);
      }
    } else if (!shouldAcquire && leaseRef.current) {
      leaseRef.current.release(); // @frictionborn-guard
      leaseRef.current = null;
      setHasLease(false);
    }
  }, [hydrated, inView, effectiveTier, leaseId]);

  useEffect(() => {
    return () => {
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
      }
    };
  }, []);

  // CSS poster generated from the identical 3-color palette (CLS 0)
  const posterStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    background: `radial-gradient(circle at 35% 25%, ${colors[1]}33 0%, transparent 65%), radial-gradient(circle at 75% 75%, ${colors[2]}33 0%, transparent 55%), ${colors[0]}`,
    zIndex: 1,
  };

  const handleDowngrade = useCallback(() => {
    setEffectiveTier((prev) => Math.max(0, prev - 1)); // @frictionborn-guard
  }, []);

  // Lost context: hide the canvas (poster shows through) but keep the lease and the mounted
  // surface so the browser's `webglcontextrestored` event can reach us; on restore remount fresh.
  const handleContextLost = useCallback(() => {
    setContextLost(true); // @frictionborn-guard
  }, []);

  const handleContextRestored = useCallback(() => {
    setContextLost(false); // @frictionborn-guard
    setGlKey((k) => k + 1);
  }, []);

  const canRenderWebGL = hydrated && inView && effectiveTier >= 2 && hasLease;

  return (
    <div
      ref={containerRef}
      data-frictionborn-item="noise-field"
      data-tier={effectiveTier}
      data-in-view={inView}
      data-reduced-motion={reduced}
      className={`relative w-full h-full min-h-[300px] overflow-hidden ${className}`}
      style={{ backgroundColor: colors[0], ...style }}
      {...props}
    >
      {/* 1. Server-rendered CSS gradient poster always present as fallback (CLS 0) */}
      <div style={posterStyle} aria-hidden="true" />

      {/* 2. WebGL canvas rendered client-side only when lease granted */}
      {canRenderWebGL && (
        <Suspense fallback={null}>
          <NoiseFieldGL
            key={glKey}
            suspended={contextLost}
            colors={colors}
            speed={speed}
            scale={scale}
            intensity={intensity}
            paused={paused}
            time={time}
            tier={effectiveTier}
            reducedMotion={reduced}
            onContextLost={handleContextLost}
            onContextRestored={handleContextRestored}
            onDowngrade={handleDowngrade}
          />
        </Suspense>
      )}

      {/* 3. Scrim layer preserving WCAG contrast >= 4.5:1 for overlaid text */}
      {scrim && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at center, rgba(13, 15, 18, 0.25) 0%, rgba(13, 15, 18, 0.75) 100%)",
          }}
        />
      )}

      {/* 4. Children slot */}
      {children && (
        <div style={{ position: "relative", zIndex: 4, width: "100%", height: "100%" }}>
          {children}
        </div>
      )}
    </div>
  );
}
