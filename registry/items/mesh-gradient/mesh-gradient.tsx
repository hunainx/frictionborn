// Original — Frictionborn Motion MeshGradient
"use client";

import React, { useState, useEffect, useRef, useCallback, useId, Suspense, lazy, useImperativeHandle } from "react";
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
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
}

// Host tokens with CSS system-colour fallbacks; stable module-level constant
const DEFAULT_MESH_TOKENS = [
  "var(--background, Canvas)",
  "var(--primary, CanvasText)",
  "var(--chart-1, var(--accent, GrayText))",
  "var(--chart-2, var(--muted, ButtonFace))",
];

type RgbTriple = [number, number, number];
const DEFAULT_RGB_QUAD: [RgbTriple, RgbTriple, RgbTriple, RgbTriple] = [
  [0.05, 0.06, 0.08],
  [0.22, 0.74, 0.97],
  [0.51, 0.55, 0.97],
  [0.12, 0.16, 0.23],
];

export function MeshGradient({
  colors = DEFAULT_MESH_TOKENS,
  speed = 1.0,
  distortion = 0.5,
  swirl = 0.25,
  grainMixer = 0.08,
  grainOverlay = 0.04,
  scrim = false,
  paused = false,
  maxTier = 3,
  reducedMotion: propReduced,
  ref,
  className = "",
  style,
  children,
  ...props
}: MeshGradientProps) {
  const hostElementRef = useRef<HTMLDivElement | null>(null);
  const uid = useId();
  const isClientHydrated = useHydrated(); // @frictionborn-guard
  const runtimeCap = useCapability(); // @frictionborn-guard
  const prefersReduce = useReducedMotion(); // @frictionborn-guard
  const suppressMotion = propReduced !== undefined ? propReduced : prefersReduce; // @frictionborn-guard
  const isInViewport = useInView(hostElementRef); // @frictionborn-guard

  const [hasContextLease, setHasContextLease] = useState(false);
  const leaseHandle = useRef<Lease | null>(null);
  const instanceTag = useRef(`mesh-${uid}`);
  const [contextSevered, setContextSevered] = useState(false);

  const [downgrades, setDowngrades] = useState(0);
  const effectiveTier = isClientHydrated
    ? Math.max(0, Math.min(runtimeCap.tier, maxTier) - downgrades)
    : 0;
  const [activeColors, setActiveColors] = useState<[RgbTriple, RgbTriple, RgbTriple, RgbTriple]>(DEFAULT_RGB_QUAD);

  const refreshColors = useCallback(() => {
    const el = hostElementRef.current;
    const resolved: RgbTriple[] = colors.map((c) => {
      const rgb = resolveCssColor(el, c);
      return rgb ? (rgb as RgbTriple) : [0.5, 0.5, 0.5];
    });

    const c0 = resolved[0] ?? DEFAULT_RGB_QUAD[0];
    const c1 = resolved[1] ?? resolved[0] ?? DEFAULT_RGB_QUAD[1];
    const c2 = resolved[2] ?? resolved[1] ?? DEFAULT_RGB_QUAD[2];
    const c3 = resolved[3] ?? resolved[0] ?? DEFAULT_RGB_QUAD[3];
    const next: [RgbTriple, RgbTriple, RgbTriple, RgbTriple] = [c0, c1, c2, c3];

    setActiveColors((prev) => {
      const isIdentical =
        prev.length === 4 &&
        prev.every(
          (tuple, i) =>
            Math.abs(tuple[0] - next[i][0]) < 0.002 &&
            Math.abs(tuple[1] - next[i][1]) < 0.002 &&
            Math.abs(tuple[2] - next[i][2]) < 0.002
        );
      return isIdentical ? prev : next;
    });
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

  // Context lease lifecycle management (Decision 19: reduced motion = no WebGL)
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

    const tryAcquire = () => {
      if (leaseHandle.current) return;
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
        // A new lease means a new GL instance: a loss that was never restored must not leave it suspended (same fix as NoiseField, 5c74d38)
        setContextSevered(false);
      }
    };

    tryAcquire();

    const unsubscribe = typeof glBudget.subscribe === "function"
      ? glBudget.subscribe(() => {
          if (!leaseHandle.current) {
            tryAcquire();
          }
        })
      : () => {};

    return () => {
      unsubscribe();
    };
  }, [isQualifiedForWebGL]);

  useEffect(() => {
    return () => {
      leaseHandle.current?.release(); // @frictionborn-guard
      leaseHandle.current = null;
    };
  }, []);

  const handleStepDown = useCallback(() => {
    setDowngrades((prev) => prev + 1); // @frictionborn-guard
  }, []);

  const handleContextLost = useCallback(() => {
    setContextSevered(true); // @frictionborn-guard
  }, []);

  const handleContextRestored = useCallback(() => {
    setContextSevered(false); // @frictionborn-guard
  }, []);

  // Pure CSS poster matching the shader's anchor positions and spatial weighting
  const bgBase = colors[0];
  const posterArt = `radial-gradient(circle at 20% 30%, color-mix(in srgb, ${colors[1] ?? colors[0]} 38%, transparent) 0%, transparent 65%), radial-gradient(circle at 80% 70%, color-mix(in srgb, ${colors[2] ?? colors[0]} 34%, transparent) 0%, transparent 60%), radial-gradient(circle at 50% 50%, color-mix(in srgb, ${colors[3] ?? colors[0]} 40%, transparent) 0%, transparent 70%), ${bgBase}`;

  const renderWebGLMesh = hasContextLease && !suppressMotion && effectiveTier >= 2;

  useImperativeHandle(ref, () => hostElementRef.current as HTMLDivElement);

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
