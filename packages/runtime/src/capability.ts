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

function checkWebGL2(): boolean {
  if (cachedWebGL2 !== null) return cachedWebGL2;
  try {
    if (typeof window === "undefined" || !window.WebGL2RenderingContext) {
      cachedWebGL2 = false;
      return false;
    }
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { powerPreference: "low-power" });
    if (!gl) {
      cachedWebGL2 = false;
      return false;
    }
    // Immediately dispose detection context so it doesn't hold GPU resources or count as active
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
    cachedWebGL2 = true;
    return true;
  } catch {
    cachedWebGL2 = false;
    return false;
  }
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
