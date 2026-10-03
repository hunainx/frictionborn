// Source: https://github.com/darkroomengineering/lenis — MIT — Darkroom Engineering
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Lenis from "lenis";
import {
  useFrame,
  useReducedMotion,
  useCapability,
  useHydrated,
  usePaused,
  useInView,
} from "@frictionborn/runtime";

export interface SmoothScrollProps {
  children?: React.ReactNode;
  duration?: number;
  easing?: (t: number) => number;
  orientation?: "vertical" | "horizontal";
  gestureOrientation?: "vertical" | "horizontal" | "both";
  smoothWheel?: boolean;
  touchMultiplier?: number;
  infinite?: boolean;
  enabled?: boolean;
  onScroll?: (e: any) => void;
  prevent?: (node: HTMLElement) => boolean;
}

let activeSingleton = false;

export function _resetSmoothScrollSingletonForTesting(): void {
  activeSingleton = false;
}

export function SmoothScroll({
  children,
  duration = 1.2,
  easing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation = "vertical",
  gestureOrientation = "vertical",
  smoothWheel = true,
  touchMultiplier = 1,
  infinite = false,
  enabled = true,
  onScroll,
  prevent,
}: SmoothScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHydrated = useHydrated(); // @frictionborn-guard
  const prefersReduced = useReducedMotion(); // @frictionborn-guard
  const capability = useCapability(); // @frictionborn-guard
  const isPaused = usePaused(); // @frictionborn-guard
  const inView = useInView(containerRef); // @frictionborn-guard

  const lenisRef = useRef<Lenis | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isScrolling, setIsScrolling] = useState(true);
  const settleTimerRef = useRef<any>(null);
  const isMasterRef = useRef(false);

  // Decision 16: SmoothScroll is disabled on reduced motion and coarse pointers (mobile/touch)
  const isCoarsePointer = capability.pointer === "coarse";
  const shouldEnable = isHydrated && enabled && !prefersReduced && !isCoarsePointer;

  const wakeLoop = useCallback(() => {
    setIsScrolling(true);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (!shouldEnable) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setIsActive(false);
      }
      return;
    }

    // Singleton guard: warn and no-op if an instance is already active
    if (activeSingleton && !isMasterRef.current) {
      console.warn(
        "[frictionborn/smooth-scroll] A SmoothScroll instance is already active. Duplicate instance ignored."
      );
      return;
    }

    activeSingleton = true;
    isMasterRef.current = true;

    const lenis = new Lenis({
      duration,
      easing,
      orientation,
      gestureOrientation,
      smoothWheel,
      touchMultiplier,
      infinite,
      autoRaf: false, // strictly driven by runtime useFrame
      prevent,
    });

    lenisRef.current = lenis;
    setIsActive(true);

    if (onScroll) {
      lenis.on("scroll", onScroll);
    }

    return () => {
      if (isMasterRef.current) {
        lenis.destroy();
        lenisRef.current = null;
        activeSingleton = false;
        isMasterRef.current = false;
        setIsActive(false);
      }
    };
  }, [
    shouldEnable,
    duration,
    easing,
    orientation,
    gestureOrientation,
    smoothWheel,
    touchMultiplier,
    infinite,
    prevent,
    onScroll,
  ]);

  // Wake loop on wheel, scroll or keyboard navigation events
  useEffect(() => {
    if (!isActive || typeof window === "undefined") return;

    window.addEventListener("wheel", wakeLoop, { passive: true });
    window.addEventListener("keydown", wakeLoop, { passive: true });
    window.addEventListener("touchmove", wakeLoop, { passive: true });
    window.addEventListener("scroll", wakeLoop, { passive: true });

    // Initial settle after mounting
    settleTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 500);

    return () => {
      window.removeEventListener("wheel", wakeLoop);
      window.removeEventListener("keydown", wakeLoop);
      window.removeEventListener("touchmove", wakeLoop);
      window.removeEventListener("scroll", wakeLoop);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [isActive, wakeLoop]);

  // Stepped strictly via the shared useFrame loop (zero direct rAF calls, zero idle frames)
  useFrame(
    ({ time }) => {
      if (lenisRef.current && !isPaused && inView) {
        lenisRef.current.raf(time);
      }
    },
    { active: isActive && !isPaused && inView && isScrolling }
  );

  return (
    <div
      ref={containerRef}
      data-frictionborn-item="smooth-scroll"
      data-active={isActive}
      data-tier={capability.tier}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  );
}
