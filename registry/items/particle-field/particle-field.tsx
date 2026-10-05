// Original — Frictionborn Motion ParticleField wrapper
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

const ParticleFieldGL = lazy(() => import("./particle-field.gl"));

export interface ParticleFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  speed?: number;
  count?: number;
  interactive?: boolean;
  scrim?: boolean;
  paused?: boolean;
  maxTier?: number;
  reducedMotion?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
}

const DEFAULT_COLOR = "var(--primary, CanvasText)";
const NEUTRAL_RGB: [number, number, number] = [0.5, 0.5, 0.5];

export function ParticleField({
  color = DEFAULT_COLOR,
  speed = 1.0,
  count = 2000,
  interactive = true,
  scrim = false,
  paused = false,
  maxTier = 3,
  reducedMotion: propReduced,
  ref,
  className = "",
  style,
  children,
  ...props
}: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uid = useId();
  const isHydrated = useHydrated(); // @frictionborn-guard
  const capability = useCapability(); // @frictionborn-guard
  const isReduced = useReducedMotion(); // @frictionborn-guard
  const motionDisabled = propReduced !== undefined ? propReduced : isReduced; // @frictionborn-guard
  const isVisible = useInView(containerRef); // @frictionborn-guard

  const [hasLease, setHasLease] = useState(false);
  const leaseRef = useRef<Lease | null>(null);
  const instanceId = useRef("particle-field-" + uid);
  const [contextLost, setContextLost] = useState(false);
  const [activeTier, setActiveTier] = useState<number>(() =>
    isHydrated ? Math.min(capability.tier, maxTier) : 0
  );

  const [resolvedRgb, setResolvedRgb] = useState<[number, number, number]>(NEUTRAL_RGB);

  const updateColor = useCallback(() => {
    const next = resolveCssColor(containerRef.current, color) ?? NEUTRAL_RGB;
    // Keep the previous array when nothing changed so unrelated <html> mutations do not re-render
    setResolvedRgb((prev) =>
      prev[0] === next[0] && prev[1] === next[1] && prev[2] === next[2] ? prev : next
    );
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

  // Context lease management (Decision 19: reduced motion = no WebGL)
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

    const tryAcquire = () => {
      if (leaseRef.current) return;
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
        // A new lease means a new GL instance: a loss that was never restored must not leave it suspended (same fix as NoiseField, 5c74d38)
        setContextLost(false);
      }
    };

    tryAcquire();

    const unsubscribe = typeof glBudget.subscribe === "function"
      ? glBudget.subscribe(() => {
          if (!leaseRef.current) {
            tryAcquire();
          }
        })
      : () => {};

    return () => {
      unsubscribe();
    };
  }, [canRunWebGL, contextLost]);

  useEffect(() => {
    return () => {
      if (leaseRef.current) {
        leaseRef.current.release(); // @frictionborn-guard
        leaseRef.current = null;
      }
    };
  }, []);

  const onTierStepDown = useCallback((targetTier?: number) => {
    setActiveTier((lvl) => (targetTier !== undefined ? targetTier : lvl > 0 ? lvl - 1 : 0)); // @frictionborn-guard
  }, []);

  const onContextDrop = useCallback(() => {
    setContextLost(true); // @frictionborn-guard
  }, []);

  const onContextRecover = useCallback(() => {
    setContextLost(false); // @frictionborn-guard
  }, []);

  const shouldBeInteractive = interactive && capability.pointer === "fine";

  // Pure CSS from the same colour prop, so the server poster already matches the host theme
  const dotColor = `color-mix(in srgb, ${color} 18%, transparent)`;
  const posterBackground = `radial-gradient(circle at 50% 50%, ${dotColor} 1.2px, transparent 1.2px)`;

  const shouldRenderGL = hasLease && !motionDisabled && activeTier >= 2;

  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

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
        backgroundColor: "var(--background, Canvas)",
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
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--background, Canvas) 40%, transparent) 0%, color-mix(in srgb, var(--background, Canvas) 75%, transparent) 100%)",
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
