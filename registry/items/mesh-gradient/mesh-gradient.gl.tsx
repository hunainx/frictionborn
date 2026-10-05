// Original — Frictionborn Motion MeshGradient WebGL2 renderer
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createSurface, type Surface } from "@frictionborn/runtime/gl";
import { useFrame, useFrameGuard, usePaused } from "@frictionborn/runtime";
import { vertexShaderSource, fragmentShaderSource } from "./mesh-gradient.glsl";

export interface MeshGradientGLProps {
  colors: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number]
  ];
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
  const hostRef = useRef<HTMLDivElement | null>(null);
  const glSurface = useRef<Surface | null>(null);
  const glProgram = useRef<WebGLProgram | null>(null);
  const uniformMap = useRef<Map<string, WebGLUniformLocation>>(new Map());

  const elapsedClock = useRef(0);
  const activePalette = useRef(colors);
  const lostHandler = useRef(onContextLost);
  const restoredHandler = useRef(onContextRestored);

  useEffect(() => {
    activePalette.current = colors;
    lostHandler.current = onContextLost;
    restoredHandler.current = onContextRestored;
  });

  const isGlobalPaused = usePaused();

  useFrameGuard({
    onDowngrade: onDowngrade ?? (() => {}),
    active: !paused && !isGlobalPaused && !reducedMotion && !suspended,
  }); // @frictionborn-guard

  const maxDpr = tier >= 3 ? 2.0 : 1.5;
  const meshScale = tier >= 3 ? 1.0 : 0.75;
  const meshOctaves = tier >= 3 ? 4 : 2;

  const flushMeshState = useCallback(
    (timeValue: number) => {
      const surface = glSurface.current;
      const prog = glProgram.current;
      if (!surface || !prog) return;

      const gl = surface.gl;
      const u = uniformMap.current;
      gl.useProgram(prog);

      const uRes = u.get("u_resolution");
      if (uRes) gl.uniform2f(uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);

      const uTime = u.get("u_time");
      if (uTime) gl.uniform1f(uTime, timeValue);

      const uSpeed = u.get("u_speed");
      if (uSpeed) gl.uniform1f(uSpeed, speed * 0.35);

      const uDistort = u.get("u_distortion");
      if (uDistort) gl.uniform1f(uDistort, distortion);

      const uSwirl = u.get("u_swirl");
      if (uSwirl) gl.uniform1f(uSwirl, swirl);

      const uMixer = u.get("u_grain_mixer");
      if (uMixer) gl.uniform1f(uMixer, grainMixer);

      const uOverlay = u.get("u_grain_overlay");
      if (uOverlay) gl.uniform1f(uOverlay, grainOverlay);

      const uOct = u.get("u_octaves");
      if (uOct) gl.uniform1i(uOct, meshOctaves);

      const pal = activePalette.current;
      for (let i = 0; i < 4; i++) {
        const uCol = u.get(`u_color${i}`);
        if (uCol) {
          gl.uniform3f(uCol, pal[i][0], pal[i][1], pal[i][2]);
        }
      }

      surface.draw();
    },
    [speed, distortion, swirl, grainMixer, grainOverlay, meshOctaves]
  );

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    const cvs = document.createElement("canvas");
    cvs.setAttribute("aria-hidden", "true");
    cvs.setAttribute("data-frictionborn-gl", "mesh-gradient");
    Object.assign(cvs.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
      zIndex: "2",
    });
    parent.appendChild(cvs);

    const initShaders = (s: Surface) => {
      const gl = s.gl;
      const prog = s.createProgram(vertexShaderSource, fragmentShaderSource);
      glProgram.current = prog;

      const map = new Map<string, WebGLUniformLocation>();
      const names = [
        "u_resolution",
        "u_time",
        "u_speed",
        "u_distortion",
        "u_swirl",
        "u_grain_mixer",
        "u_grain_overlay",
        "u_octaves",
        "u_color0",
        "u_color1",
        "u_color2",
        "u_color3",
      ];
      for (const name of names) {
        const loc = gl.getUniformLocation(prog, name);
        if (loc) map.set(name, loc);
      }
      uniformMap.current = map;
    };

    try {
      const surface = createSurface(cvs, {
        maxDpr,
        scale: meshScale,
        onContextLost: () => {
          cvs.style.display = "none";
          lostHandler.current?.();
        },
        onContextRestored: () => {
          cvs.style.display = "block";
          if (glSurface.current) {
            glSurface.current.resize();
            initShaders(glSurface.current);
            flushMeshState(elapsedClock.current);
          }
          restoredHandler.current?.();
        },
      }); // @frictionborn-guard

      glSurface.current = surface;
      initShaders(surface);
      flushMeshState(elapsedClock.current);
    } catch (failure) {
      console.warn("MeshGradient WebGL2 surface failure", failure);
      if (glSurface.current) {
        glSurface.current.dispose(); // @frictionborn-guard
        glSurface.current = null;
      }
      lostHandler.current?.();
    }

    return () => {
      if (glSurface.current) {
        glSurface.current.dispose(); // @frictionborn-guard
        glSurface.current = null;
      }
      cvs.remove();
    };
  }, [maxDpr, meshScale, flushMeshState]);

  useFrame(
    ({ dt }) => {
      elapsedClock.current += (dt * 0.001) * speed;
      flushMeshState(elapsedClock.current);
    },
    { active: !paused && !isGlobalPaused && !reducedMotion && !suspended } // @frictionborn-guard
  );

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="fb-mesh-surface"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 2,
        visibility: suspended ? "hidden" : "visible",
      }}
    />
  );
}
