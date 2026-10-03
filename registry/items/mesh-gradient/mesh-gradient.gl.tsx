// Source: https://github.com/paper-design/shaders — Apache-2.0 — Paper Design
// Notice: Powered by Paper Shaders
"use client";

import { useRef, useEffect, useState } from "react";
import { MeshGradient as PaperMeshGradient } from "@paper-design/shaders-react";
import { useFrameGuard, usePaused } from "@frictionborn/runtime";

export interface MeshGradientGLProps {
  colors: string[];
  speed?: number;
  distortion?: number;
  swirl?: number;
  grainMixer?: number;
  grainOverlay?: number;
  tier?: number;
  paused?: boolean;
  reducedMotion?: boolean;
  suspended?: boolean;
  onDowngrade?: () => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

export default function MeshGradientGL({
  colors,
  speed = 0.35,
  distortion = 0.5,
  swirl = 0.25,
  grainMixer = 0.08,
  grainOverlay = 0.04,
  tier = 3,
  paused = false,
  reducedMotion = false,
  suspended = false,
  onDowngrade,
  onContextLost,
  onContextRestored,
}: MeshGradientGLProps) {
  const mountWrapperRef = useRef<HTMLDivElement | null>(null);
  // Paper does not handle webglcontextrestored: remounting its component builds a fresh context and program
  const [mountKey, setMountKey] = useState(0);

  // Paper runs its own render loop, so the runtime's global pause (pauseAll) has to reach it as speed 0
  const globalPaused = usePaused();

  // Guard frame budget — auto-downgrades if render cost exceeds 25ms p75
  useFrameGuard({
    onDowngrade: onDowngrade ?? (() => {}),
    active: !paused && !globalPaused && !reducedMotion && !suspended,
  }); // @frictionborn-guard

  // Decision 15 (D-B): Tier 2 & mobile capped to DPR 1.5, tier 3 to 2. Paper's minPixelRatio is a floor (it
  // supersamples low-DPI screens and never lowers a high-DPI one), so the cap is a pixel budget instead:
  // css width x height x cap^2. Paper scales its canvas down uniformly to stay inside it.
  const [pixelBudget, setPixelBudget] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = mountWrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const cap = tier >= 3 ? 2 : 1.5;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPixelBudget(Math.ceil(width * height * cap * cap));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tier]);

  // Intercept WebGL context loss from Paper Shaders canvas
  useEffect(() => {
    const wrapper = mountWrapperRef.current;
    if (!wrapper) return;

    let attachedCanvas: HTMLCanvasElement | null = null;

    const attachCanvasListeners = () => {
      const canvas = wrapper.querySelector("canvas");
      if (!canvas || canvas === attachedCanvas) return;
      attachedCanvas = canvas;

      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        canvas.style.display = "none";
        onContextLost?.();
      });

      canvas.addEventListener("webglcontextrestored", () => {
        canvas.style.display = "block";
        setMountKey((k) => k + 1);
        onContextRestored?.();
      });
    };

    attachCanvasListeners();
    const observer = new MutationObserver(attachCanvasListeners);
    observer.observe(wrapper, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (attachedCanvas) {
        try {
          const gl = attachedCanvas.getContext("webgl2") || attachedCanvas.getContext("webgl");
          const loseExt = gl?.getExtension("WEBGL_lose_context");
          loseExt?.loseContext();
        } catch {
          // Ignore errors during unmount cleanup
        }
      }
    };
  }, [onContextLost, onContextRestored]);

  return (
    <div
      ref={mountWrapperRef}
      style={{
        display: suspended ? "none" : "block",
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <PaperMeshGradient
        key={mountKey}
        colors={colors}
        speed={paused || globalPaused || reducedMotion ? 0 : speed}
        distortion={distortion}
        swirl={swirl}
        grainMixer={grainMixer}
        grainOverlay={grainOverlay}
        minPixelRatio={1}
        maxPixelCount={pixelBudget}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
