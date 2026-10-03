// Original — Frictionborn Motion MeshGradient wrapper
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

const MeshGradientGL = lazy(() => import("./mesh-gradient.gl"));

// Paper only parses hex/rgb/hsl, while Tailwind v4 / shadcn tokens serialise as lab() or oklch()
function resolveColorToHex(element: HTMLElement | null, spec: string, fallback: string): string {
  const rgb = resolveCssColor(element, spec);
  if (!rgb) return fallback;
  return "#" + rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
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

// Host tokens with CSS system-colour fallbacks (no brand palette); module-level so the identity is stable
const DEFAULT_MESH_TOKENS = [
  "var(--background, Canvas)",
  "var(--primary, CanvasText)",
  "var(--accent, GrayText)",
  "var(--muted, ButtonFace)",
];
const NEUTRAL_HEX = ["#808080", "#808080", "#808080", "#808080"];

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
  // Resolved hex colours for the WebGL layer only (the poster and scrim use the CSS tokens directly)
  const [activeColors, setActiveColors] = useState<string[]>(NEUTRAL_HEX);

  const refreshColors = useCallback(() => {
    const el = hostElementRef.current;
    const next = colors.map((c) => resolveColorToHex(el, c, "#808080"));
    // Keep the previous array when nothing changed so unrelated <html> mutations do not re-render
    setActiveColors((prev) =>
      prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next
    );
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

  // Pure CSS from the same colour props: the server poster already follows the host theme (CLS 0, no flash)
  const bgBase = colors[0];
  const posterArt = `radial-gradient(circle at 20% 30%, color-mix(in srgb, ${colors[1] ?? colors[0]} 25%, transparent) 0%, transparent 60%), radial-gradient(circle at 80% 70%, color-mix(in srgb, ${colors[2] ?? colors[0]} 21%, transparent) 0%, transparent 55%), radial-gradient(circle at 50% 50%, color-mix(in srgb, ${colors[3] ?? colors[0]} 31%, transparent) 0%, transparent 70%), ${bgBase}`;

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
            background: `radial-gradient(circle at center, color-mix(in srgb, ${bgBase} 20%, transparent) 0%, color-mix(in srgb, ${bgBase} 80%, transparent) 100%)`,
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
