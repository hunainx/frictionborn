// Original — Frictionborn Motion useFrameGuard
import { useEffect, useRef, useState } from "react";
import { useFrame } from "./frame.js";
import { useLatest } from "./latest.js";

export interface FrameGuardOptions {
  onDowngrade?: () => void;
  active?: boolean;
}

export function useFrameGuard(options: FrameGuardOptions): void {
  const { onDowngrade, active = true } = options;
  const downgradedRef = useRef(false);
  const [downgraded, setDowngraded] = useState(false);
  const samplesRef = useRef<number[]>([]);
  const windowStartRef = useRef<number>(0);
  const onDowngradeRef = useLatest(onDowngrade);

  useFrame(
    ({ dt, time }) => {
      if (!active || downgradedRef.current) return;

      if (windowStartRef.current === 0) {
        windowStartRef.current = time;
      }

      samplesRef.current.push(dt);

      // Check after 2 seconds (2000 ms) of sampling
      if (time - windowStartRef.current >= 2000) {
        const samples = samplesRef.current;
        if (samples.length >= 10) {
          // Calculate 75th percentile (p75)
          const sorted = [...samples].sort((a, b) => a - b);
          const p75Index = Math.floor(sorted.length * 0.75);
          const p75 = sorted[p75Index];

          if (p75 > 25) {
            downgradedRef.current = true;
            setDowngraded(true);
            onDowngradeRef.current?.();
          }
        }
        // Reset window for next 2s period if not downgraded
        windowStartRef.current = time;
        samplesRef.current = [];
      }
    },
    { active: active && !downgraded }
  );

  useEffect(() => {
    return () => {
      samplesRef.current = [];
      windowStartRef.current = 0;
    };
  }, []);
}
