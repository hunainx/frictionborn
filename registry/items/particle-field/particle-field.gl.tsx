// Original — Frictionborn Motion ParticleField WebGL2 engine
"use client";

import { useRef, useEffect } from "react";
import { useFrame, useFrameGuard } from "@frictionborn/runtime";

export interface ParticleFieldGLProps {
  color: [number, number, number];
  backgroundColor?: [number, number, number];
  speed?: number;
  count?: number;
  interactive?: boolean;
  tier: number;
  paused?: boolean;
  reducedMotion?: boolean;
  suspended?: boolean;
  onDowngrade?: () => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

const VS_SOURCE = `#version 300 es
layout(location = 0) in float a_index;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_speed;
uniform float u_dpr;

out float v_alpha;

// Hash generator for stable pseudo-random particle initial conditions
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  float seedX = hash11(a_index * 1.61803);
  float seedY = hash11(a_index * 2.71828);
  float phase = hash11(a_index * 3.14159) * 6.28318;

  // Gentle deterministic kinematic drift
  float t = u_time * 0.15 * u_speed;
  vec2 pos = vec2(
    fract(seedX + sin(phase + t) * 0.08 + t * 0.04),
    fract(seedY + cos(phase + t * 0.8) * 0.08 + t * 0.02)
  );

  vec2 screenPos = pos * u_resolution;

  // Pointer repel (if active and within interaction radius)
  if (u_pointer.x > -9000.0) {
    vec2 diff = screenPos - u_pointer;
    float dist = length(diff);
    float radius = 140.0;
    if (dist < radius && dist > 0.001) {
      float repel = (1.0 - dist / radius);
      screenPos += normalize(diff) * (repel * repel * 40.0);
    }
  }

  // Clip coordinates [-1, 1]
  vec2 clipPos = (screenPos / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);

  // Twinkle frequency strictly < 3 Hz (WCAG 2.3.1 compliance)
  float twinkle = 0.5 + 0.5 * sin(phase + u_time * 1.8);
  v_alpha = 0.25 + 0.65 * twinkle;

  // Size scaling with DPR clamp
  float baseSize = 2.0 + hash11(a_index * 4.123) * 2.5;
  gl_PointSize = baseSize * u_dpr;
}
`;

const FS_SOURCE = `#version 300 es
precision highp float;

in float v_alpha;
uniform vec3 u_color;
out vec4 fragColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) {
    discard;
  }
  float circleAlpha = smoothstep(0.5, 0.1, dist) * v_alpha;
  fragColor = vec4(u_color, circleAlpha);
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  if (gl.isContextLost()) return null;
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (!gl.isContextLost()) {
      console.error("ParticleField shader compilation error:", gl.getShaderInfoLog(shader));
    }
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ParticleFieldGL({
  color,
  speed = 1.0,
  count = 2000,
  interactive = true,
  tier,
  paused = false,
  reducedMotion = false,
  suspended = false,
  onDowngrade,
  onContextLost,
  onContextRestored,
}: ParticleFieldGLProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const vaoRef = useRef<WebGLVertexArrayObject | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });

  const uniformsRef = useRef<{
    time: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    pointer: WebGLUniformLocation | null;
    speed: WebGLUniformLocation | null;
    dpr: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
  }>({
    time: null,
    resolution: null,
    pointer: null,
    speed: null,
    dpr: null,
    color: null,
  });

  useFrameGuard({
    onDowngrade: onDowngrade ?? (() => {}),
    active: !paused && !reducedMotion && !suspended,
  }); // @frictionborn-guard

  // Calculate actual particle count clamped by tier
  // Tier 3: up to count (default ~2000, max 4000)
  // Tier 2: ~35% count
  const effectiveCount = Math.round(tier >= 3 ? Math.min(count, 4000) : count * 0.35);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "fb-particle-canvas";
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:2;";
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });

    if (!gl) {
      onDowngrade?.();
      return;
    }

    glRef.current = gl;

    const initResources = () => {
      if (!gl || gl.isContextLost()) return;

      const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
      if (!vs || !fs) return;

      const prog = gl.createProgram();
      if (!prog) return;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        if (!gl.isContextLost()) {
          console.error("ParticleField program link error:", gl.getProgramInfoLog(prog));
        }
        return;
      }

      programRef.current = prog;
      gl.useProgram(prog);

      uniformsRef.current = {
        time: gl.getUniformLocation(prog, "u_time"),
        resolution: gl.getUniformLocation(prog, "u_resolution"),
        pointer: gl.getUniformLocation(prog, "u_pointer"),
        speed: gl.getUniformLocation(prog, "u_speed"),
        dpr: gl.getUniformLocation(prog, "u_dpr"),
        color: gl.getUniformLocation(prog, "u_color"),
      };

      // Build particle index buffer
      const indices = new Float32Array(4000);
      for (let i = 0; i < 4000; i++) {
        indices[i] = i;
      }

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      vaoRef.current = vao;

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

      // Blending: additive translucent particles
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    };

    initResources();

    // Context loss handlers
    const handleLost = (e: Event) => {
      e.preventDefault();
      canvas.style.display = "none";
      onContextLost?.();
    };

    const handleRestored = () => {
      canvas.style.display = "block";
      initResources();
      onContextRestored?.();
    };

    canvas.addEventListener("webglcontextlost", handleLost, false);
    canvas.addEventListener("webglcontextrestored", handleRestored, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
      if (gl) {
        if (vaoRef.current) gl.deleteVertexArray(vaoRef.current);
        if (programRef.current) gl.deleteProgram(programRef.current);
        const loseExt = gl.getExtension("WEBGL_lose_context");
        loseExt?.loseContext();
      }
      canvas.remove();
      canvasRef.current = null;
      glRef.current = null;
    };
  }, [onDowngrade, onContextLost, onContextRestored]);

  // Pointer tracking for interactive repel (fine pointer only)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const rect = canvas.getBoundingClientRect();
      pointerPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerLeave = () => {
      pointerPosRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    canvas.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [interactive]);

  // Render loop driven by runtime useFrame
  useFrame(
    ({ time }) => {
      const gl = glRef.current;
      const canvas = canvasRef.current;
      const prog = programRef.current;
      const u = uniformsRef.current;
      if (!gl || !canvas || !prog) return;

      const dpr = Math.min(window.devicePixelRatio || 1, tier >= 3 ? 2.0 : 1.5);
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.bindVertexArray(vaoRef.current);

      const renderTime = reducedMotion ? 0.0 : time / 1000.0;
      gl.uniform1f(u.time, renderTime);
      gl.uniform2f(u.resolution, canvas.clientWidth, canvas.clientHeight);
      gl.uniform2f(u.pointer, pointerPosRef.current.x, pointerPosRef.current.y);
      gl.uniform1f(u.speed, speed);
      gl.uniform1f(u.dpr, dpr);
      gl.uniform3f(u.color, color[0], color[1], color[2]);

      gl.drawArrays(gl.POINTS, 0, effectiveCount);
    },
    { active: !paused && !reducedMotion && !suspended }
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: suspended ? "none" : "block",
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

export default ParticleFieldGL;
