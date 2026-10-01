// Original — Frictionborn Motion MagneticButton
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useFrame, useReducedMotion, useCapability, useHydrated } from "@frictionborn/runtime";

export interface MagneticButtonProps {
  children: React.ReactElement<{
    className?: string;
    style?: React.CSSProperties;
    onFocus?: React.FocusEventHandler;
    onBlur?: React.FocusEventHandler;
  }>;
  strength?: number;
  tension?: number;
  damping?: number;
  className?: string;
  style?: React.CSSProperties;
  maxTier?: number;
}

export function MagneticButton({
  children,
  strength = 16,
  tension = 180,
  damping = 16,
  className = "",
  style,
  maxTier = 3,
}: MagneticButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentRef = useRef<{ x: number; y: number; vx: number; vy: number }>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  });

  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const { tier: rawTier } = useCapability();
  const tier = Math.min(rawTier, maxTier);

  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Gate pointer listeners strictly to fine pointers (hover: hover and pointer: fine)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsFinePointer(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const shouldEnable = hydrated && !prefersReduced && tier > 1 && isFinePointer;

  // Spring animation loop driven by shared useFrame
  useFrame(
    ({ dt }) => {
      const el = containerRef.current;
      if (!el) return;

      const deltaSec = Math.min(dt / 1000, 0.05);
      const cur = currentRef.current;
      const tgt = targetRef.current;

      // Spring physics (Hooke's law with damping)
      const ax = tension * (tgt.x - cur.x) - damping * cur.vx;
      const ay = tension * (tgt.y - cur.y) - damping * cur.vy;

      cur.vx += ax * deltaSec;
      cur.vy += ay * deltaSec;
      cur.x += cur.vx * deltaSec;
      cur.y += cur.vy * deltaSec;

      // Check settle condition
      const dx = Math.abs(tgt.x - cur.x);
      const dy = Math.abs(tgt.y - cur.y);
      const dv = Math.sqrt(cur.vx * cur.vx + cur.vy * cur.vy);

      if (dx < 0.01 && dy < 0.01 && dv < 0.01) {
        cur.x = tgt.x;
        cur.y = tgt.y;
        cur.vx = 0;
        cur.vy = 0;
        el.style.transform = tgt.x === 0 && tgt.y === 0 ? "" : `translate3d(${tgt.x}px, ${tgt.y}px, 0)`;
        setIsActive(false);
      } else {
        el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
      }
    },
    { active: isActive && shouldEnable }
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!shouldEnable || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const relX = (e.clientX - centerX) / (rect.width / 2);
      const relY = (e.clientY - centerY) / (rect.height / 2);

      targetRef.current = {
        x: Math.max(-strength, Math.min(strength, relX * strength)),
        y: Math.max(-strength, Math.min(strength, relY * strength)),
      };
      setIsActive(true);
    },
    [shouldEnable, strength]
  );

  const handlePointerLeave = useCallback(() => {
    if (!shouldEnable) return;
    targetRef.current = { x: 0, y: 0 };
    setIsActive(true);
  }, [shouldEnable]);

  // Keyboard focus resets position immediately to prevent disorienting keyboard users
  const handleFocus = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    currentRef.current = { x: 0, y: 0, vx: 0, vy: 0 };
    if (containerRef.current) {
      containerRef.current.style.transform = "";
    }
    setIsActive(false);
  }, []);

  return (
    <div
      ref={containerRef}
      data-frictionborn-item="magnetic-button"
      data-tier={tier}
      className={`fb-magnetic-button ${className}`}
      onPointerMove={shouldEnable ? handlePointerMove : undefined}
      onPointerLeave={shouldEnable ? handlePointerLeave : undefined}
      style={{
        display: "inline-block",
        position: "relative",
        overflow: "visible", // Focus ring must never be clipped
        willChange: isActive ? "transform" : "auto",
        ...style,
      }}
    >
      {React.cloneElement(children, {
        onFocus: (e: React.FocusEvent) => {
          handleFocus();
          children.props.onFocus?.(e);
        },
      })}
    </div>
  );
}

export default MagneticButton;
