// Original — Frictionborn Motion probe injector
import { FrameCounterProbe } from "./frame-counter.js";
import { ContextCounterProbe } from "./context-counter.js";
import { ListenerCounterProbe } from "./listener-counter.js";
import { AnimationProbe } from "./animation-probe.js";
import { PerformanceObserverProbe } from "./performance-observer.js";

export interface FrictionbornProbes {
  frameCounter: FrameCounterProbe;
  contextCounter: ContextCounterProbe;
  listenerCounter: ListenerCounterProbe;
  animationProbe: AnimationProbe;
  perfObserver: PerformanceObserverProbe;
  // Only the injected public/probes.js defines this one (WebGL texture create/delete accounting).
  textureCounter?: {
    getStats(): { activeTextures: number; totalCreated: number; totalDeleted: number };
    reset(): void;
  };
}

declare global {
  interface Window {
    __FB_PROBES__?: FrictionbornProbes;
  }
}

export function installProbes(): FrictionbornProbes {
  if (typeof window === "undefined") {
    throw new Error("Probes can only be installed in a browser environment");
  }

  if (window.__FB_PROBES__) {
    return window.__FB_PROBES__;
  }

  const frameCounter = new FrameCounterProbe();
  const contextCounter = new ContextCounterProbe();
  const listenerCounter = new ListenerCounterProbe();
  const animationProbe = new AnimationProbe();
  const perfObserver = new PerformanceObserverProbe();

  frameCounter.install();
  contextCounter.install();
  listenerCounter.install();
  perfObserver.install();

  const probes: FrictionbornProbes = {
    frameCounter,
    contextCounter,
    listenerCounter,
    animationProbe,
    perfObserver,
  };

  window.__FB_PROBES__ = probes;
  return probes;
}

// Auto-install if running in browser
if (typeof window !== "undefined") {
  installProbes();
}
