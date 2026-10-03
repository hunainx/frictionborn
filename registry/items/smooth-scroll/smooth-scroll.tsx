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

// Module-level so its identity is stable: an inline default would change every render and make the
// Lenis effect below tear down and rebuild the instance (killing the animation it just started)
const defaultEasing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

const DIALOG_SELECTOR = '[role="dialog"], [aria-modal="true"], dialog[open], [data-lenis-prevent]';

let activeSingleton = false;

export function _resetSmoothScrollSingletonForTesting(): void {
  activeSingleton = false;
}

export function SmoothScroll({
  children,
  duration = 1.2,
  easing = defaultEasing,
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
  // No in-view gate: this wrapper is display:contents (never intersects) and a page-level scroll engine
  // must run wherever the page is. Idle cost is zero because the loop stops once Lenis reports settled.

  const lenisRef = useRef<Lenis | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isScrolling, setIsScrolling] = useState(true);
  const settleTimerRef = useRef<any>(null);
  const isMasterRef = useRef(false);
  // Callbacks may be inline lambdas; read them through refs so they never re-create Lenis
  const easingRef = useRef(easing);
  easingRef.current = easing;
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;
  const preventRef = useRef(prevent);
  preventRef.current = prevent;

  // Decision 16: SmoothScroll is disabled on reduced motion and coarse pointers (mobile/touch)
  const isCoarsePointer = capability.pointer === "coarse";
  const shouldEnable = isHydrated && enabled && !prefersReduced && !isCoarsePointer;

  // Wake the shared loop on input; it stops again as soon as Lenis reports it is no longer scrolling
  const idleFramesRef = useRef(0);
  const needsClockResetRef = useRef(true);
  const wakeLoop = useCallback(() => {
    // The shared loop was idle: Lenis would see one huge frame delta and jump instead of easing
    needsClockResetRef.current = true;
    setIsScrolling(true);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    // Safety net only: if no frame ever confirms a settle (e.g. no scroll resulted), go idle after 10 s
    settleTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 10000);
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
      easing: (t: number) => easingRef.current(t),
      orientation,
      gestureOrientation,
      smoothWheel,
      touchMultiplier,
      infinite,
      autoRaf: false, // strictly driven by runtime useFrame
      // Nested scrollers and open dialogs keep native wheel scrolling (PRD 6.10)
      allowNestedScroll: true,
      prevent: (node: HTMLElement) =>
        !!preventRef.current?.(node) ||
        (typeof node.matches === "function" && node.matches(DIALOG_SELECTOR)),
    });

    lenisRef.current = lenis;
    setIsActive(true);

    lenis.on("scroll", (e: any) => onScrollRef.current?.(e));

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
    orientation,
    gestureOrientation,
    smoothWheel,
    touchMultiplier,
    infinite,
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
      const lenis = lenisRef.current;
      if (lenis && !isPaused) {
        if (needsClockResetRef.current) {
          needsClockResetRef.current = false;
          (lenis as any).time = 0; // next raf() computes delta 0 instead of the idle gap
        }
        lenis.raf(time);
        // Idle only when Lenis is neither scrolling nor animating for several consecutive frames
        // (browsers differ in when native scroll events flip isScrolling; never stop mid-animation)
        const busy = !!lenis.isScrolling || !!(lenis as any).animate?.isRunning;
        idleFramesRef.current = busy ? 0 : idleFramesRef.current + 1;
        if (idleFramesRef.current >= 3) {
          idleFramesRef.current = 0;
          if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
          setIsScrolling(false);
        }
      }
    },
    { active: isActive && !isPaused && isScrolling }
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
