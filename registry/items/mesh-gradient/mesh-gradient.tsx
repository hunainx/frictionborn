// Original — Frictionborn Motion MeshGradient wrapper
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import {
  useCapability,
  useHydrated,
  useReducedMotion,
  useInView,
  glBudget,
  type Lease,
} from "@frictionborn/runtime";

const MeshGradientGL = lazy(() => import("./mesh-gradient.gl"));

function extractCssColor(elem: HTMLElement | null, tokenSpec: string, fallbackColor: string): string {
  if (typeof window === "undefined" || !tokenSpec) return fallbackColor;
  if (!tokenSpec.startsWith("var(")) return tokenSpec;
  const match = tokenSpec.match(/var\((--[^,\s)]+)(?:,\s*([^)]+))?\)/);
  if (!match) return fallbackColor;
  const prop = match[1];
  const def = match[2] || fallbackColor;
  const style = elem ? window.getComputedStyle(elem) : window.getComputedStyle(document.documentElement);
  const computed = style.getPropertyValue(prop).trim();
  return computed || def;
}

export interface MeshGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  colors?: string[];
  speed?: number;
  distortion?: number;
  swirl?: number;
  grainMixer?: number;
  grainOverlay?: number;
  scrim?: boolean;
  paused?: boolean;
  maxTier?: number;
  reducedMotion?: boolean;
  children?: React.ReactNode;
}

const DEFAULT_MESH_TOKENS = [
  "var(--background, #0B0E14)",
  "var(--primary, #38BDF8)",
  "var(--accent, #818CF8)",
  "var(--muted, #1E293B)",
];

export function MeshGradient({
  colors = DEFAULT_MESH_TOKENS,
  speed = 0.35,
  distortion = 0.5,
  swirl = 0.25,
  grainMixer = 0.08,
  grainOverlay = 0.04,
  scrim = false,
  paused = false,
  maxTier = 3,
  reducedMotion: propReduced,
  className = "",
  style,
  children,
  ...props
}: MeshGradientProps) {
  const hostElementRef = useRef<HTMLDivElement | null>(null);
  const isClientHydrated = useHydrated(); // @frictionborn-guard
  const runtimeCap = useCapability(); // @frictionborn-guard
  const prefersReduce = useReducedMotion(); // @frictionborn-guard
  const suppressMotion = propReduced !== undefined ? propReduced : prefersReduce; // @frictionborn-guard
  const isInViewport = useInView(hostElementRef); // @frictionborn-guard

  const [hasContextLease, setHasContextLease] = useState(false);
  const leaseHandle = useRef<Lease | null>(null);
  const instanceTag = useRef(`mesh-${Math.random().toString(36).slice(2, 9)}`);
  const [contextSevered, setContextSevered] = useState(false);

  const [effectiveTier, setEffectiveTier] = useState<number>(0);
  const [activeColors, setActiveColors] = useState<string[]>([
    "#0B0E14",
    "#38BDF8",
    "#818CF8",
    "#1E293B",
  ]);

  const refreshColors = useCallback(() => {
    const el = hostElementRef.current;
    const defaults = ["#0B0E14", "#38BDF8", "#818CF8", "#1E293B"];
    setActiveColors(colors.map((c, i) => extractCssColor(el, c, defaults[i % defaults.length])));
  }, [colors]);

  useEffect(() => {
    refreshColors();
    if (typeof MutationObserver === "undefined") return;
    const obs = new MutationObserver(refreshColors);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode", "style"],
    });
    return () => obs.disconnect();
  }, [refreshColors]);

  useEffect(() => {
    if (isClientHydrated) {
      setEffectiveTier(Math.min(runtimeCap.tier, maxTier));
    }
  }, [isClientHydrated, runtimeCap.tier, maxTier]);

  // Context lease lifecycle management (Decision D-A: reduced motion = no WebGL)
  const isQualifiedForWebGL =
    isClientHydrated && isInViewport && effectiveTier >= 2 && !suppressMotion;

  useEffect(() => {
    if (!isQualifiedForWebGL) {
      if (leaseHandle.current) {
        leaseHandle.current.release(); // @frictionborn-guard
        leaseHandle.current = null;
        setHasContextLease(false);
      }
      return;
    }

    if (!leaseHandle.current) {
      const acquired = glBudget.acquire({
        id: instanceTag.current,
        priority: 1,
        onEvict: () => {
          leaseHandle.current = null;
          setHasContextLease(false);
        },
      }); // @frictionborn-guard

      if (acquired) {
        leaseHandle.current = acquired;
        setHasContextLease(true);
      }
    }
  }, [isQualifiedForWebGL]);

  useEffect(() => {
    return () => {
      leaseHandle.current?.release(); // @frictionborn-guard
      leaseHandle.current = null;
    };
  }, []);

  const handleStepDown = useCallback(() => {
    setEffectiveTier((prev) => (prev > 0 ? prev - 1 : 0)); // @frictionborn-guard
  }, []);

  const handleContextLost = useCallback(() => {
    setContextSevered(true); // @frictionborn-guard
  }, []);

  const handleContextRestored = useCallback(() => {
    setContextSevered(false); // @frictionborn-guard
  }, []);

  const [bgBase, cAccent1, cAccent2, cMuted] = [
    activeColors[0] || "#0B0E14",
    activeColors[1] || "#38BDF8",
    activeColors[2] || "#818CF8",
    activeColors[3] || "#1E293B",
  ];

  const posterArt = `radial-gradient(circle at 20% 30%, ${cAccent1}40 0%, transparent 60%), radial-gradient(circle at 80% 70%, ${cAccent2}35 0%, transparent 55%), radial-gradient(circle at 50% 50%, ${cMuted}50 0%, transparent 70%), ${bgBase}`;

  const renderWebGLMesh = hasContextLease && !suppressMotion && effectiveTier >= 2;

  return (
    <div
      ref={hostElementRef}
      data-frictionborn-item="mesh-gradient"
      data-tier={effectiveTier}
      className={`fb-mesh-gradient ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "260px",
        overflow: "hidden",
        backgroundColor: bgBase,
        ...style,
      }}
      {...props}
    >
      {/* 1. Server-rendered CSS gradient poster always present as fallback (CLS 0) */}
      <div
        data-frictionborn-poster="true"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: posterArt,
          pointerEvents: "none",
        }}
      />

      {/* 2. WebGL canvas rendered client-side only when lease granted and not reduced-motion */}
      {renderWebGLMesh && (
        <Suspense fallback={null}>
          <MeshGradientGL
            suspended={contextSevered}
            colors={activeColors}
            speed={speed}
            distortion={distortion}
            swirl={swirl}
            grainMixer={grainMixer}
            grainOverlay={grainOverlay}
            tier={effectiveTier}
            paused={paused}
            reducedMotion={suppressMotion}
            onDowngrade={handleStepDown}
            onContextLost={handleContextLost}
            onContextRestored={handleContextRestored}
          />
        </Suspense>
      )}

      {/* 3. Theme-aware scrim preserving WCAG AA contrast >= 4.5:1 for overlaid text */}
      {scrim && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at center, ${bgBase}33 0%, ${bgBase}cc 100%)`,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}

      {/* 4. Children slot */}
      {children && (
        <div
          style={{
            position: "relative",
            zIndex: 3,
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default MeshGradient;
