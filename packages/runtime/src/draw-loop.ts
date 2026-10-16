// Original — Frictionborn Motion useDrawLoop: mount imperative drawing code on an element and tick it from the shared frame loop
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "./frame.js";
import { useInView } from "./in-view.js";
import { useLatest } from "./latest.js";

/** what a mounted drawing returns: `tick` answers whether it needs another frame; `destroy` removes everything it added */
export interface DrawInstance {
  /** dt and t in seconds (dt capped at 50 ms). Return `false` when nothing is moving: the loop stops until `wake()` */
  tick?: (dt: number, t: number) => boolean | void;
  destroy?: () => void;
}

export type DrawFactory = (el: HTMLElement, wake: () => void) => DrawInstance | null | undefined;

export interface DrawLoopOptions {
  /** mount at all (hydrated, tier and capability checks done by the item) */
  enabled: boolean;
  /** the item's `paused` prop: no frames while true */
  paused?: boolean;
  /** remount when this changes (tier, reduced motion, palette …) */
  key?: string | number;
  /** in-view margin: the loop runs only while the element is near the screen */
  rootMargin?: string;
}

/**
 * The lifecycle of the 2D-canvas items (round 4): `create` runs once the item may animate and again when `key` changes; its `tick` runs
 * on the page's one frame loop (`useFrame`), only while the element is in view, not paused, and the drawing says it is still moving.
 * Event handlers call `wake()` to start the loop again, so an idle item costs zero frames.
 */
export function useDrawLoop(ref: RefObject<HTMLElement | null>, create: DrawFactory, { enabled, paused = false, key = 0, rootMargin = "120px" }: DrawLoopOptions): () => void {
  const inst = useRef<DrawInstance | null>(null);
  const factory = useLatest(create);
  const [running, setRunning] = useState(true);
  const runningRef = useRef(true);
  const inView = useInView(ref, { rootMargin });

  const wake = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const made = factory.current(el, wake) ?? null;
    inst.current = made;
    runningRef.current = true;
    setRunning(true);
    return () => {
      made?.destroy?.();
      if (inst.current === made) inst.current = null;
    };
  }, [enabled, key, ref, wake, factory]);

  useFrame(
    ({ dt, time }) => {
      const more = inst.current?.tick?.(Math.min(0.05, dt / 1000), time / 1000);
      if (more === false) {
        runningRef.current = false;
        setRunning(false);
      }
    },
    { active: enabled && running && inView && !paused },
  );

  return wake;
}
