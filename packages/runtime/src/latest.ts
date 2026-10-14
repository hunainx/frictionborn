// Original — Frictionborn Motion useLatest: a ref that always holds the latest render's value, for draw loops and event handlers
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The value of the latest committed render, readable from a frame tick or an event handler without restarting either. Updated in a
 * layout effect (never during render, which React's compiler rules forbid), so it is current before the next frame is drawn.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useIsoLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
