// Original — Frictionborn Motion: the environment every canvas item reads (hydration, reduced motion, capped tier) and its shared props
import { useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import { useCapability } from "./capability.js";
import { useHydrated } from "./hydrated.js";
import { useReducedMotion } from "./reduced-motion.js";
import type { PaletteName } from "./palette.js";

/** the props every canvas item (round 4) shares, besides its own */
export interface CanvasItemProps {
  /** Colours of the effect: `fire` (default) | `ice` | `neon` | `mono` | `custom` (reads `--fb-heat-0..4`, DESIGN.md A8). */
  palette?: PaletteName;
  /** Universal pause prop: the effect stops drawing; the control keeps working. */
  paused?: boolean;
  /** Hard ceiling on the capability tier. */
  maxTier?: number;
  /** CSP nonce for the item's <style> element. */
  nonce?: string;
}

/**
 * Hydrated, reduced motion and the capability tier capped at `maxTier` (the server snapshot is tier 0 with reduced motion); `still` is
 * true when the item may draw but not animate (reduced motion or tier 0: the `still-frame` mode of DESIGN.md A3).
 */
export function useItemEnv(maxTier = 3): { hydrated: boolean; reduced: boolean; tier: 0 | 1 | 2 | 3; still: boolean } {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const tier = Math.min(useCapability().tier, maxTier) as 0 | 1 | 2 | 3;
  return { hydrated, reduced, tier, still: reduced || tier === 0 };
}

/** the item's root element ref, also handed to the consumer's `ref` prop */
export function useItemRef<T extends HTMLElement = HTMLDivElement>(ref: Ref<T> | undefined): RefObject<T | null> {
  const root = useRef<T>(null);
  useImperativeHandle(ref, () => root.current as T);
  return root;
}
