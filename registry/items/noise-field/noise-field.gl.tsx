// Original — Frictionborn Motion
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createSurface, type Surface } from "@frictionborn/runtime/gl";
import { useFrame, useFrameGuard } from "@frictionborn/runtime";
import { vertexShaderSource, fragmentShaderSource } from "./noise-field.glsl";

export interface NoiseFieldGLProps {
  colors: [[number, number, number], [number, number, number], [number, number, number]];
  speed?: number;
  scale?: number;
  intensity?: number;
  paused?: boolean;
  time?: number;
  tier?: number;
  suspended?: boolean;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onDowngrade?: () => void;
}

export default function NoiseFieldGL({
  colors,
  speed = 1.0,
  scale = 1.8,
  intensity = 1.0,
  paused = false,
  time,
  tier = 3,
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
    octaves?: WebGLUniformLocation;
    colorBg?: WebGLUniformLocation;
    colorPrimary?: WebGLUniformLocation;
    colorAccent?: WebGLUniformLocation;
  }>({});
  const timeRef = useRef<number>(time ?? 0);
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  const maxDpr = tier >= 3 ? 2.0 : 1.5;
  const renderScale = tier >= 3 ? 1.0 : 0.75;
  const octaves = tier >= 3 ? 4 : 2;

  const onContextLostRef = useRef(onContextLost);
  onContextLostRef.current = onContextLost;
  const onContextRestoredRef = useRef(onContextRestored);
  onContextRestoredRef.current = onContextRestored;

  const renderFrame = useCallback((currentTime: number) => {
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
    if (u.octaves) {
      gl.uniform1i(u.octaves, octaves);
    }

    const currentColors = colorsRef.current;
    if (u.colorBg) {
      gl.uniform3f(u.colorBg, currentColors[0][0], currentColors[0][1], currentColors[0][2]);
    }
    if (u.colorPrimary) {
      gl.uniform3f(u.colorPrimary, currentColors[1][0], currentColors[1][1], currentColors[1][2]);
    }
    if (u.colorAccent) {
      gl.uniform3f(u.colorAccent, currentColors[2][0], currentColors[2][1], currentColors[2][2]);
    }

    surface.draw();
  }, [speed, scale, intensity, octaves]);

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
    canvas.style.zIndex = "2"; // Above poster (z: 1), below scrim (z: 3)
    container.appendChild(canvas);

    function setupProgram(surface: ReturnType<typeof createSurface>) {
      const gl = surface.gl;
      const program = surface.createProgram(vertexShaderSource, fragmentShaderSource);
      programRef.current = program;

      uniformsRef.current = {
        resolution: gl.getUniformLocation(program, "u_resolution") || undefined,
        time: gl.getUniformLocation(program, "u_time") || undefined,
        speed: gl.getUniformLocation(program, "u_speed") || undefined,
        scale: gl.getUniformLocation(program, "u_scale") || undefined,
        intensity: gl.getUniformLocation(program, "u_intensity") || undefined,
        octaves: gl.getUniformLocation(program, "u_octaves") || undefined,
        colorBg: gl.getUniformLocation(program, "u_color_bg") || undefined,
        colorPrimary: gl.getUniformLocation(program, "u_color_primary") || undefined,
        colorAccent: gl.getUniformLocation(program, "u_color_accent") || undefined,
      };
    }

    try {
      const surface = createSurface(canvas, {
        maxDpr,
        scale: renderScale,
        deferDpr: true,
        onContextLost: () => {
          canvas.style.display = "none";
          onContextLostRef.current?.();
        },
        onContextRestored: () => {
          canvas.style.display = "block";
          if (surfaceRef.current) {
            setupProgram(surfaceRef.current);
            renderFrame(timeRef.current);
          }
          onContextRestoredRef.current?.();
        },
      }); // @frictionborn-guard

      surfaceRef.current = surface;
      setupProgram(surface);

      // Draw initial frame immediately
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
  }, [maxDpr, renderScale, renderFrame]);

  // Frame rate monitoring and automated downgrade
  useFrameGuard({ onDowngrade: () => onDowngrade?.(), active: !paused && !suspended }); // @frictionborn-guard

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
    { active: !paused && !suspended } // @frictionborn-guard
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
        zIndex: 2,
        visibility: suspended ? "hidden" : "visible",
      }}
    />
  );
}
