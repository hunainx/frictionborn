// Original — Frictionborn Motion global pause (WCAG 2.2.2)
import { useSyncExternalStore } from "react";

let isPaused = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getIsPaused(): boolean {
  return isPaused;
}

export function pauseAll(): void {
  if (!isPaused) {
    isPaused = true;
    notify();
  }
}

export function resumeAll(): void {
  if (isPaused) {
    isPaused = false;
    notify();
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  return isPaused;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePaused(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
