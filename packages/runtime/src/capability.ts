// Original — Frictionborn Motion useCapability (DESIGN.md A4)
import { useSyncExternalStore } from "react";

export type Tier = 0 | 1 | 2 | 3;
export type PointerType = "fine" | "coarse" | "none";

export interface Capability {
  tier: Tier;
  reducedMotion: boolean;
  pointer: PointerType;
  hover: boolean;
  webgl2: boolean;
  saveData: boolean;
  maxDpr: number;
  reasons: string[];
}

const SERVER_CAPABILITY: Capability = {
  tier: 0,
  reducedMotion: true,
  pointer: "none",
  hover: false,
  webgl2: false,
  saveData: false,
  maxDpr: 1,
  reasons: ["server"],
};

let cachedClientCapability: Capability | null = null;
let lastCheckKey = "";
let cachedWebGL2: boolean | null = null;

export function _resetCapabilityCacheForTesting(): void {
  cachedWebGL2 = null;
  cachedClientCapability = null;
  lastCheckKey = "";
}

/*
 * round 4 (Part 6): WebGL2 is read from the API, not proven by creating a throwaway context. That probe was one synchronous GPU call
 * (about 80 ms on the review PC) during hydration on every page with a component, also pages whose components never use WebGL. Every
 * WebGL item makes its own context anyway and shows its poster when that fails (AGENTS rule 2); the first failure now marks WebGL2 as
 * unavailable for the page (`createSurface` sends `fb-webgl2-unavailable`; `markWebGL2Unavailable`), so every item recomputes its tier.
 */
function checkWebGL2(): boolean {
  if (cachedWebGL2 !== null) return cachedWebGL2;
  return typeof window !== "undefined" && typeof window.WebGL2RenderingContext === "function";
}

/** A WebGL2 context could not be made on this device (blocklisted GPU, lost driver): items drop to tier 0 and show their posters. */
export function markWebGL2Unavailable(): void {
  if (cachedWebGL2 === false) return;
  cachedWebGL2 = false;
  notify();
}

function evaluateCapability(): Capability {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return SERVER_CAPABILITY;
  }

  const reasons: string[] = [];

  // Check manual testing override: data-fb-tier="0|1|2|3" on <html>
  const overrideAttr = document.documentElement.getAttribute("data-fb-tier");
  if (overrideAttr !== null) {
    const parsed = parseInt(overrideAttr, 10);
    if (parsed >= 0 && parsed <= 3) {
      const tier = parsed as Tier;
      const dprMap: Record<Tier, number> = { 0: 1, 1: 1, 2: 1.5, 3: 2 };
      return {
        tier,
        reducedMotion: tier === 0,
        pointer: tier === 3 ? "fine" : "coarse",
        hover: tier === 3,
        webgl2: tier >= 2,
        saveData: false,
        maxDpr: dprMap[tier],
        reasons: [`override:${tier}`],
      };
    }
  }

  // 1. Reduced Motion
  const reducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    reasons.push("reduced-motion");
  }

  // 2. Save-Data
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  const saveData = nav.connection?.saveData === true;
  if (saveData) {
    reasons.push("save-data");
  }

  // 3. WebGL2 support
  const webgl2 = checkWebGL2();
  if (!webgl2) {
    reasons.push("no-webgl2");
  }

  // 4. Pointer & Hover
  const finePointer = !!window.matchMedia?.("(pointer: fine)").matches;
  const coarsePointer = !!window.matchMedia?.("(pointer: coarse)").matches;
  const pointer: PointerType = finePointer ? "fine" : coarsePointer ? "coarse" : "none";
  const hover = !!window.matchMedia?.("(hover: hover)").matches;

  // 5. Low-end device hints
  const deviceMemory = nav.deviceMemory ?? 8;
  const hardwareConcurrency = nav.hardwareConcurrency ?? 8;
  const isLowEnd = deviceMemory <= 2 || hardwareConcurrency <= 4;
  if (isLowEnd) {
    reasons.push("low-end-hardware");
  }

  // 6. Viewport width hint
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
  const isSmallViewport = viewportWidth < 480;
  if (isSmallViewport) {
    reasons.push("small-viewport");
  }

  // Tier assignment
  let tier: Tier = 0;
  let maxDpr = 1;

  if (reducedMotion || saveData || !webgl2) {
    tier = 0;
    maxDpr = 1;
  } else if (pointer === "coarse" && isLowEnd) {
    tier = 1;
    maxDpr = 1;
    reasons.push("tier:lite");
  } else if (pointer === "fine" && hover && !isLowEnd && !isSmallViewport) {
    tier = 3;
    maxDpr = 2;
    reasons.push("tier:full");
  } else {
    // Default standard for coarse pointers or standard screens
    tier = 2;
    maxDpr = 1.5;
    reasons.push("tier:standard");
  }

  return {
    tier,
    reducedMotion,
    pointer,
    hover,
    webgl2,
    saveData,
    maxDpr,
    reasons,
  };
}

const listeners = new Set<() => void>();

function notify() {
  cachedClientCapability = null;
  listeners.forEach((l) => l());
}

let eventsAttached = false;
function ensureListeners() {
  if (typeof window === "undefined" || eventsAttached) return;
  eventsAttached = true;

  window.addEventListener("resize", notify);
  // round 4 (Part 6): createSurface (the `gl` entry, a separate bundle) reports a WebGL2 context that could not be made
  window.addEventListener("fb-webgl2-unavailable", markWebGL2Unavailable);
  const mqMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  mqMotion?.addEventListener?.("change", notify);
  const mqPointer = window.matchMedia?.("(pointer: fine)");
  mqPointer?.addEventListener?.("change", notify);
  const mqHover = window.matchMedia?.("(hover: hover)");
  mqHover?.addEventListener?.("change", notify);

  // Observer for testing data-fb-tier attribute on html
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-fb-tier") {
          notify();
          break;
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-fb-tier"],
    });
  }
}

function subscribe(callback: () => void): () => void {
  ensureListeners();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Capability {
  const nav = typeof navigator !== "undefined" ? (navigator as any) : {};
  const currentKey = typeof document !== "undefined"
    ? `${document.documentElement.getAttribute("data-fb-tier")}|${window.innerWidth}|${window.matchMedia?.("(prefers-reduced-motion: reduce)").matches}|${window.matchMedia?.("(pointer: fine)").matches}|${window.matchMedia?.("(pointer: coarse)").matches}|${window.matchMedia?.("(hover: hover)").matches}|${nav.deviceMemory}|${nav.hardwareConcurrency}`
    : "";
  if (!cachedClientCapability || currentKey !== lastCheckKey) {
    lastCheckKey = currentKey;
    cachedClientCapability = evaluateCapability();
  }
  return cachedClientCapability;
}

function getServerSnapshot(): Capability {
  return SERVER_CAPABILITY;
}

export function useCapability(): Capability {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
