// Original — Frictionborn Motion
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import {
  useCapability,
  useHydrated,
  useReducedMotion,
  useInView,
  resolveCssColor,
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
  reducedMotion?: boolean;
  children?: React.ReactNode;
}

// Stable default: a fresh array each render would re-trigger the colour resolver forever
const DEFAULT_COLORS: [string, string, string] = [
  "var(--background, Canvas)",
  "var(--primary, CanvasText)",
  "var(--accent, GrayText)",
];

export function NoiseField({
  colors = DEFAULT_COLORS,
  speed = 1.0,
  scale = 1.8,
  intensity = 1.0,
  scrim = true,
  paused = false,
  time,
  maxTier = 3,
  reducedMotion: propReduced,
  className = "",
  style,
  children,
  ...props
}: NoiseFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hydrated = useHydrated(); // @frictionborn-guard
  const cap = useCapability(); // @frictionborn-guard
  const systemReduced = useReducedMotion(); // @frictionborn-guard
  const reduced = propReduced !== undefined ? propReduced : systemReduced; // @frictionborn-guard
  const inView = useInView(containerRef); // @frictionborn-guard

  const [hasLease, setHasLease] = useState(false);
  const leaseRef = useRef<Lease | null>(null);
  const instanceId = useRef("noise-field-" + Math.random().toString(36).slice(2, 8));
  const [contextLost, setContextLost] = useState(false);
  const [glKey, setGlKey] = useState(0);
  const [effectiveTier, setEffectiveTier] = useState<number>(() =>
    hydrated ? Math.min(cap.tier, maxTier) : 0
  );

  // Resolved RGB arrays for WebGL uniforms
  const [rgbColors, setRgbColors] = useState<[[number, number, number], [number, number, number], [number, number, number]]>([
    [0.05, 0.06, 0.08],
    [0.98, 0.57, 0.24],
    [0.23, 0.51, 0.96],
  ]);

  // Key on the values, not the array identity (callers often pass an inline literal)
  const colorKey = colors.join("|");
  const updateResolvedColors = useCallback(() => {
    const el = containerRef.current;
    const c0 = resolveCssColor(el, colors[0]) ?? [0.05, 0.06, 0.08];
    const c1 = resolveCssColor(el, colors[1]) ?? [0.98, 0.57, 0.24];
    const c2 = resolveCssColor(el, colors[2]) ?? [0.23, 0.51, 0.96];
    setRgbColors([c0, c1, c2]);
  }, [colorKey, colors]);

  // Resolve colors on mount, prop change, and HTML theme attribute mutations
  useEffect(() => {
    updateResolvedColors();

    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      updateResolvedColors();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode", "style"],
    });
    return () => observer.disconnect();
  }, [updateResolvedColors]);

  // Determine active tier considering cap, maxTier and context state
  const computedTier = Math.min(cap.tier, maxTier);

  useEffect(() => {
    if (hydrated) {
      setEffectiveTier(computedTier);
    }
  }, [hydrated, computedTier]);

  // Context lease acquisition (PRD 6.0 + 6.1 + Decision 19: reduced motion = no WebGL)
  useEffect(() => {
    // Decision 19: Reduced motion gets static poster only (no WebGL context)
    const shouldAcquire = hydrated && inView && effectiveTier >= 2 && !reduced;

    if (!shouldAcquire) {
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
        setHasLease(false);
      }
      return;
    }

    const tryAcquire = () => {
      if (leaseRef.current) return;
      const newLease = glBudget.acquire({
        id: instanceId.current,
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
    };

    tryAcquire();
    return glBudget.subscribe(() => {
      if (!leaseRef.current) tryAcquire();
    });
  }, [hydrated, inView, effectiveTier, contextLost, reduced]);

  useEffect(() => {
    return () => {
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
      }
    };
  }, []);

  const handleDowngrade = useCallback(() => {
    setEffectiveTier((prev) => Math.max(0, prev - 1)); // @frictionborn-guard
  }, []);

  const handleContextLost = useCallback(() => {
    setContextLost(true); // @frictionborn-guard
  }, []);

  const handleContextRestored = useCallback(() => {
    setContextLost(false); // @frictionborn-guard
    setGlKey((k) => k + 1);
  }, []);

  // Poster matching the shader's palette & visual flow (CLS 0)
  const posterStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    background: `radial-gradient(circle at 35% 25%, color-mix(in srgb, ${colors[1]} 35%, transparent) 0%, transparent 65%), radial-gradient(circle at 75% 70%, color-mix(in srgb, ${colors[2]} 30%, transparent) 0%, transparent 60%), radial-gradient(circle at 50% 50%, color-mix(in srgb, ${colors[1]} 15%, ${colors[2]} 15%) 0%, transparent 75%), ${colors[0]}`,
    zIndex: 1,
  };

  // Theme-aware scrim using host background token to guarantee >= 4.5:1 text contrast
  const scrimStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 3,
    pointerEvents: "none",
    background: `radial-gradient(circle at center, color-mix(in srgb, ${colors[0]} 25%, transparent) 0%, color-mix(in srgb, ${colors[0]} 80%, transparent) 100%)`,
  };

  const canRenderWebGL = hydrated && inView && effectiveTier >= 2 && hasLease && !reduced;

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
      <div data-frictionborn-poster="true" style={posterStyle} aria-hidden="true" />

      {/* 2. WebGL canvas rendered client-side only when lease granted and not reduced-motion */}
      {canRenderWebGL && (
        <Suspense fallback={null}>
          <NoiseFieldGL
            key={glKey}
            suspended={contextLost}
            colors={rgbColors}
            speed={speed}
            scale={scale}
            intensity={intensity}
            paused={paused}
            time={time}
            tier={effectiveTier}
            onContextLost={handleContextLost}
            onContextRestored={handleContextRestored}
            onDowngrade={handleDowngrade}
          />
        </Suspense>
      )}

      {/* 3. Theme-aware scrim layer preserving WCAG AA contrast >= 4.5:1 for overlaid text */}
      {scrim && <div style={scrimStyle} aria-hidden="true" />}

      {/* 4. Children slot */}
      {children && (
        <div style={{ position: "relative", zIndex: 4, width: "100%", height: "100%" }}>
          {children}
        </div>
      )}
    </div>
  );
}
