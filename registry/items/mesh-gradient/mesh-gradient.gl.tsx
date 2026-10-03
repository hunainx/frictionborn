// Source: https://github.com/paper-design/shaders — Apache-2.0 — Paper Design
// Notice: Powered by Paper Shaders
"use client";

import { useRef, useEffect } from "react";
import { MeshGradient as PaperMeshGradient } from "@paper-design/shaders-react";
import { useFrameGuard } from "@frictionborn/runtime";

export interface MeshGradientGLProps {
  colors?: string[];
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
  colors = ["#0B0E14", "#38BDF8", "#818CF8", "#1E293B"],
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

  // Guard frame budget — auto-downgrades if render cost exceeds 25ms p75
  useFrameGuard({
    onDowngrade: onDowngrade ?? (() => {}),
    active: !paused && !reducedMotion && !suspended,
  }); // @frictionborn-guard

  // Decision 15 (D-B): Tier 2 & mobile capped to max DPR 1.5
  const targetPixelRatio = tier <= 2 ? 1.0 : 1.5;

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
        colors={colors}
        speed={paused || reducedMotion ? 0 : speed}
        distortion={distortion}
        swirl={swirl}
        grainMixer={grainMixer}
        grainOverlay={grainOverlay}
        minPixelRatio={targetPixelRatio}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
