// Original — Frictionborn Motion ParticleField wrapper
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

const ParticleFieldGL = lazy(() => import("./particle-field.gl"));

function parseColorToRgb(spec: string, fallback: [number, number, number] = [0.98, 0.57, 0.24]): [number, number, number] {
  if (typeof document === "undefined") return fallback;
  try {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  } catch {
    return fallback;
  }
}

export interface ParticleFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  speed?: number;
  count?: number;
  interactive?: boolean;
  scrim?: boolean;
  paused?: boolean;
  maxTier?: number;
  reducedMotion?: boolean;
  children?: React.ReactNode;
}

const DEFAULT_COLOR = "var(--primary, #FB923C)";

export function ParticleField({
  color = DEFAULT_COLOR,
  speed = 1.0,
  count = 2000,
  interactive = true,
  scrim = false,
  paused = false,
  maxTier = 3,
  reducedMotion: propReduced,
  className = "",
  style,
  children,
  ...props
}: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHydrated = useHydrated(); // @frictionborn-guard
  const capability = useCapability(); // @frictionborn-guard
  const isReduced = useReducedMotion(); // @frictionborn-guard
  const motionDisabled = propReduced !== undefined ? propReduced : isReduced; // @frictionborn-guard
  const isVisible = useInView(containerRef); // @frictionborn-guard

  const [hasLease, setHasLease] = useState(false);
  const leaseRef = useRef<Lease | null>(null);
  const instanceId = useRef("particle-field-" + Math.random().toString(36).slice(2, 8));
  const [contextLost, setContextLost] = useState(false);
  const [activeTier, setActiveTier] = useState<number>(() =>
    isHydrated ? Math.min(capability.tier, maxTier) : 0
  );

  const [resolvedRgb, setResolvedRgb] = useState<[number, number, number]>([0.98, 0.57, 0.24]);

  const updateColor = useCallback(() => {
    setResolvedRgb(parseColorToRgb(color, [0.98, 0.57, 0.24]));
  }, [color]);

  useEffect(() => {
    updateColor();
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode", "style"],
    });
    return () => observer.disconnect();
  }, [updateColor]);

  const resolvedTargetTier = Math.min(capability.tier, maxTier);
  useEffect(() => {
    if (isHydrated) {
      setActiveTier(resolvedTargetTier);
    }
  }, [isHydrated, resolvedTargetTier]);

  // Context lease management (Decision D-A: reduced motion = no WebGL)
  const canRunWebGL = isHydrated && isVisible && activeTier >= 2 && !motionDisabled;

  useEffect(() => {
    if (!canRunWebGL) {
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
        setHasLease(false);
      }
      return;
    }

    if (!leaseRef.current) {
      const lease = glBudget.acquire({
        id: instanceId.current,
        priority: 1,
        onEvict: () => {
          leaseRef.current = null;
          setHasLease(false);
        },
      }); // @frictionborn-guard
      if (lease) {
        leaseRef.current = lease;
        setHasLease(true);
      }
    }
  }, [canRunWebGL, contextLost]);

  useEffect(() => {
    return () => {
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
      }
    };
  }, []);

  const onTierStepDown = useCallback(() => {
    setActiveTier((lvl) => (lvl > 0 ? lvl - 1 : 0)); // @frictionborn-guard
  }, []);

  const onContextDrop = useCallback(() => {
    setContextLost(true); // @frictionborn-guard
  }, []);

  const onContextRecover = useCallback(() => {
    setContextLost(false); // @frictionborn-guard
  }, []);

  const shouldBeInteractive = interactive && capability.pointer === "fine";

  const dotColorRgba = `rgba(${Math.round(resolvedRgb[0] * 255)}, ${Math.round(resolvedRgb[1] * 255)}, ${Math.round(resolvedRgb[2] * 255)}, 0.18)`;
  const posterBackground = `radial-gradient(circle at 50% 50%, ${dotColorRgba} 1.2px, transparent 1.2px)`;

  const shouldRenderGL = hasLease && !motionDisabled && activeTier >= 2;

  return (
    <div
      ref={containerRef}
      data-frictionborn-item="particle-field"
      data-tier={activeTier}
      className={`fb-particle-field ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "240px",
        overflow: "hidden",
        backgroundColor: "var(--background, #0D0F12)",
        ...style,
      }}
      {...props}
    >
      <div
        data-frictionborn-poster="true"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: posterBackground,
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />
      {shouldRenderGL && (
        <Suspense fallback={null}>
          <ParticleFieldGL
            suspended={contextLost}
            color={resolvedRgb}
            speed={speed}
            count={count}
            interactive={shouldBeInteractive}
            tier={activeTier}
            paused={paused}
            reducedMotion={motionDisabled}
            onDowngrade={onTierStepDown}
            onContextLost={onContextDrop}
            onContextRestored={onContextRecover}
          />
        </Suspense>
      )}

      {scrim && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(13, 15, 18, 0.4) 0%, rgba(13, 15, 18, 0.75) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {children && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
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

export default ParticleField;
