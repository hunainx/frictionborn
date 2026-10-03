// Original — Frictionborn Motion useFrame (single shared rAF loop)
import { useEffect, useRef } from "react";
import { getIsPaused, subscribePaused } from "./pause.js";

export interface FrameState {
  time: number;
  dt: number;
}

export type FrameCallback = (state: FrameState) => void;

export interface FrameOptions {
  active?: boolean;
}

const subscribers = new Set<FrameCallback>();
let rafId: number | null = null;
let lastTime = 0;
let isTabVisible = true;
let visibilityListenerAttached = false;

function loop(currentTime: number) {
  if (subscribers.size === 0 || !isTabVisible || getIsPaused()) {
    rafId = null;
    return;
  }

  if (lastTime === 0) {
    lastTime = currentTime;
  }

  // Cap dt at 50 ms per ARCHITECTURE.md §3
  const dt = Math.min(50, Math.max(0, currentTime - lastTime));
  lastTime = currentTime;

  const state: FrameState = { time: currentTime, dt };
  // Clone set to prevent issues if callbacks add/remove subscribers during iteration
  const currentSubscribers = Array.from(subscribers);
  for (const callback of currentSubscribers) {
    if (subscribers.has(callback)) {
      try {
        callback(state);
      } catch (err) {
        console.error("Error in Frictionborn useFrame callback:", err);
      }
    }
  }

  if (subscribers.size > 0 && isTabVisible && !getIsPaused()) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
  }
}

function startLoop() {
  if (typeof window === "undefined" || rafId !== null) return;
  if (!isTabVisible || subscribers.size === 0 || getIsPaused()) return;

  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

if (typeof window !== "undefined") {
  subscribePaused((paused) => {
    if (!paused) {
      startLoop();
    } else if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTime = 0;
}

function setupVisibilityListener() {
  if (typeof document === "undefined" || visibilityListenerAttached) return;
  visibilityListenerAttached = true;
  isTabVisible = !document.hidden;

  document.addEventListener("visibilitychange", () => {
    isTabVisible = !document.hidden;
    if (isTabVisible) {
      if (subscribers.size > 0) {
        startLoop();
      }
    } else {
      stopLoop();
    }
  });
}

export function subscribeFrame(callback: FrameCallback): () => void {
  setupVisibilityListener();
  subscribers.add(callback);
  if (subscribers.size === 1) {
    startLoop();
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      stopLoop();
    }
  };
}

export function useFrame(
  callback: FrameCallback,
  options: FrameOptions = {}
): void {
  const { active = true } = options;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) {
      return;
    }

    const handler: FrameCallback = (state) => {
      callbackRef.current(state);
    };

    return subscribeFrame(handler);
  }, [active]);
}
