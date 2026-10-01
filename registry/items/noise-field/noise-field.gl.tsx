// Original — Frictionborn Motion
"use client";

import { useEffect, useRef } from "react";
import { createSurface, type Surface } from "@frictionborn/runtime/gl";
import { useFrame, useFrameGuard } from "@frictionborn/runtime";
import { vertexShaderSource, fragmentShaderSource } from "./shaders/noise.glsl";

export interface NoiseFieldGLProps {
  colors: [string, string, string];
  speed?: number;
  scale?: number;
  intensity?: number;
  paused?: boolean;
  time?: number;
  tier?: number;
  reducedMotion?: boolean;
  suspended?: boolean;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onDowngrade?: () => void;
}

function parseColor(hexOrCss: string): [number, number, number] {
  if (hexOrCss.startsWith("#")) {
    let hex = hexOrCss.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(hex, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255,
    ];
  }
  // Fallback dark ember palette
  return [0.05, 0.06, 0.08];
}

export default function NoiseFieldGL({
  colors,
  speed = 1.0,
  scale = 1.8,
  intensity = 1.0,
  paused = false,
  time,
  tier = 3,
  reducedMotion = false,
  suspended = false,
  onContextLost,
  onContextRestored,
  onDowngrade,
}: NoiseFieldGLProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<Surface | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<{
    resolution?: WebGLUniformLocation;
    time?: WebGLUniformLocation;
    speed?: WebGLUniformLocation;
    scale?: WebGLUniformLocation;
    intensity?: WebGLUniformLocation;
    color1?: WebGLUniformLocation;
    color2?: WebGLUniformLocation;
    color3?: WebGLUniformLocation;
  }>({});
  const timeRef = useRef<number>(time ?? 0);

  // Monitor frame timings and trigger downgrade if performance degrades
  useFrameGuard({ onDowngrade: () => onDowngrade?.(), active: !paused && !reducedMotion && !suspended }); // @frictionborn-guard

  const maxDpr = tier >= 3 ? 2.0 : 1.5;
  const renderScale = tier >= 3 ? 1.0 : 0.75;

  const onContextLostRef = useRef(onContextLost);
  onContextLostRef.current = onContextLost;
  const onContextRestoredRef = useRef(onContextRestored);
  onContextRestoredRef.current = onContextRestored;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";
    container.appendChild(canvas);

    try {
      const surface = createSurface(canvas, {
        maxDpr,
        scale: renderScale,
        onContextLost: () => {
          onContextLostRef.current?.();
        },
        onContextRestored: () => {
          onContextRestoredRef.current?.();
        },
      }); // @frictionborn-guard

      surfaceRef.current = surface;
      const gl = surface.gl;

      const program = surface.createProgram(vertexShaderSource, fragmentShaderSource);
      programRef.current = program;

      uniformsRef.current = {
        resolution: gl.getUniformLocation(program, "u_resolution") || undefined,
        time: gl.getUniformLocation(program, "u_time") || undefined,
        speed: gl.getUniformLocation(program, "u_speed") || undefined,
        scale: gl.getUniformLocation(program, "u_scale") || undefined,
        intensity: gl.getUniformLocation(program, "u_intensity") || undefined,
        color1: gl.getUniformLocation(program, "u_color1") || undefined,
        color2: gl.getUniformLocation(program, "u_color2") || undefined,
        color3: gl.getUniformLocation(program, "u_color3") || undefined,
      };

      // Draw initial frame immediately (required for reduced-motion still frame)
      renderFrame(timeRef.current);
    } catch (err) {
      console.warn("NoiseField WebGL2 initialization failed; falling back to poster", err);
      if (surfaceRef.current) {
        surfaceRef.current.dispose(); // @frictionborn-guard
        surfaceRef.current = null;
      }
      onContextLostRef.current?.();
    }

    return () => {
      if (surfaceRef.current) {
        surfaceRef.current.dispose(); // @frictionborn-guard
        surfaceRef.current = null;
      }
      canvas.remove();
    };
  }, [maxDpr, renderScale]);

  function renderFrame(currentTime: number) {
    const surface = surfaceRef.current;
    const program = programRef.current;
    if (!surface || !program) return;

    const gl = surface.gl;
    const u = uniformsRef.current;

    gl.useProgram(program);

    if (u.resolution) {
      gl.uniform2f(u.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    if (u.time) {
      gl.uniform1f(u.time, currentTime);
    }
    if (u.speed) {
      gl.uniform1f(u.speed, speed);
    }
    if (u.scale) {
      gl.uniform1f(u.scale, scale);
    }
    if (u.intensity) {
      gl.uniform1f(u.intensity, intensity);
    }

    const c1 = parseColor(colors[0]);
    const c2 = parseColor(colors[1]);
    const c3 = parseColor(colors[2]);

    if (u.color1) gl.uniform3f(u.color1, c1[0], c1[1], c1[2]);
    if (u.color2) gl.uniform3f(u.color2, c2[0], c2[1], c2[2]);
    if (u.color3) gl.uniform3f(u.color3, c3[0], c3[1], c3[2]);

    surface.draw();
  }

  // Animation loop subscribed via shared runtime useFrame (never raw rAF)
  useFrame(
    ({ dt }) => {
      if (time !== undefined) {
        timeRef.current = time;
      } else {
        timeRef.current += (dt * 0.001) * speed;
      }
      renderFrame(timeRef.current);
    },
    { active: !paused && !reducedMotion && !suspended } // @frictionborn-guard
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 2, // above the poster (z 1), below the scrim (z 3)
        visibility: suspended ? "hidden" : "visible",
      }}
    />
  );
}
