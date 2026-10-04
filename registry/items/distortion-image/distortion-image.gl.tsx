// Original — Frictionborn Motion
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createSurface, type Surface } from "@frictionborn/runtime/gl";
import { useFrame, useFrameGuard, usePaused } from "@frictionborn/runtime";
import { vertexShaderSource, fragmentShaderSource } from "./distortion-image.glsl";

declare const process: any;

export interface DistortionImageGLProps {
  imageElement: HTMLImageElement | null;
  pointerPos: { x: number; y: number }; // Normalized [0, 1] relative to image dimensions
  isHovered: boolean;
  strength?: number;
  speed?: number;
  tier?: number;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onDowngrade?: () => void;
  onTaintedCORS?: () => void;
}

export default function DistortionImageGL({
  imageElement,
  pointerPos,
  isHovered,
  strength = 0.25,
  speed = 1.0,
  tier = 3,
  onContextLost,
  onContextRestored,
  onDowngrade,
  onTaintedCORS,
}: DistortionImageGLProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<Surface | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const uploadedSrcRef = useRef<string>("");

  const uniformsRef = useRef<{
    resolution?: WebGLUniformLocation;
    mouse?: WebGLUniformLocation;
    time?: WebGLUniformLocation;
    progress?: WebGLUniformLocation;
    strength?: WebGLUniformLocation;
    speed?: WebGLUniformLocation;
    image?: WebGLUniformLocation;
  }>({});

  const timeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const pointerPosRef = useRef(pointerPos);
  pointerPosRef.current = pointerPos;
  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;
  // Read through refs so changing strength or speed never rebuilds the WebGL context.
  const strengthRef = useRef(strength);
  strengthRef.current = strength;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const paused = usePaused(); // @frictionborn-guard

  const maxDpr = tier >= 3 ? 2.0 : 1.5;
  const renderScale = tier >= 3 ? 1.0 : 0.75;
  const maxTextureDim = tier >= 3 ? 2048 : 1024;

  const onContextLostRef = useRef(onContextLost);
  onContextLostRef.current = onContextLost;
  const onContextRestoredRef = useRef(onContextRestored);
  onContextRestoredRef.current = onContextRestored;
  const onDowngradeRef = useRef(onDowngrade);
  onDowngradeRef.current = onDowngrade;
  const onTaintedCORSRef = useRef(onTaintedCORS);
  onTaintedCORSRef.current = onTaintedCORS;

  // Frame guard triggers automatic downgrade if p75 frame times exceed budget
  useFrameGuard({ onDowngrade: () => onDowngradeRef.current?.(), active: !paused }); // @frictionborn-guard

  // Upload texture with tier size cap and CORS taint protection
  const uploadTexture = useCallback(
    (gl: WebGL2RenderingContext, img: HTMLImageElement): boolean => {
      // Clean up any existing texture to prevent memory/texture leaks
      if (textureRef.current) {
        gl.deleteTexture(textureRef.current);
        textureRef.current = null;
      }

      const texture = gl.createTexture();
      if (!texture) return false;

      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Determine upload source: scale down to maxTextureDim if required
      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;

      if (!natW || !natH) {
        gl.deleteTexture(texture);
        return false;
      }

      let uploadSource: TexImageSource = img;

      if (natW > maxTextureDim || natH > maxTextureDim) {
        const scale = Math.min(maxTextureDim / natW, maxTextureDim / natH);
        const targetW = Math.max(1, Math.round(natW * scale));
        const targetH = Math.max(1, Math.round(natH * scale));

        const offscreen = document.createElement("canvas");
        offscreen.width = targetW;
        offscreen.height = targetH;
        const ctx2d = offscreen.getContext("2d");
        if (!ctx2d) {
          gl.deleteTexture(texture);
          return false;
        }

        try {
          ctx2d.drawImage(img, 0, 0, targetW, targetH);
          uploadSource = offscreen;
        } catch (taintErr) {
          // Canvas drawImage throws SecurityError if tainted
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[Frictionborn Motion] DistortionImage: Image is tainted by cross-origin restrictions. Falling back to plain image. Set crossOrigin='anonymous' to enable WebGL distortion.",
              taintErr
            );
          }
          gl.deleteTexture(texture);
          onTaintedCORSRef.current?.();
          return false;
        }
      }

      // Safe texture upload with SecurityError / taint detection
      try {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          uploadSource
        );
      } catch (texErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[Frictionborn Motion] DistortionImage: Image is tainted by cross-origin restrictions. Falling back to plain image. Set crossOrigin='anonymous' to enable WebGL distortion.",
            texErr
          );
        }
        gl.deleteTexture(texture);
        onTaintedCORSRef.current?.();
        return false;
      }

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      textureRef.current = texture;
      uploadedSrcRef.current = img.currentSrc || img.src;
      return true;
    },
    [maxTextureDim]
  );

  const renderFrame = useCallback(() => {
    const surface = surfaceRef.current;
    const program = programRef.current;
    const texture = textureRef.current;
    if (!surface || !program || !texture) return;

    const gl = surface.gl;
    const { resolution, mouse, time, progress, strength: uStrength, speed: uSpeed, image } =
      uniformsRef.current;

    gl.useProgram(program);
    if (resolution) gl.uniform2f(resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    if (mouse) gl.uniform2f(mouse, pointerPosRef.current.x, pointerPosRef.current.y);
    if (time) gl.uniform1f(time, timeRef.current);
    if (progress) gl.uniform1f(progress, progressRef.current);
    if (uStrength) gl.uniform1f(uStrength, strengthRef.current);
    if (uSpeed) gl.uniform1f(uSpeed, speedRef.current);
    if (image) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(image, 0);
    }

    surface.draw();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageElement) return;

    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0px",
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
      zIndex: "2",
    });
    container.appendChild(canvas);

    function setupProgram(surface: ReturnType<typeof createSurface>) {
      const gl = surface.gl;
      glRef.current = gl;

      const program = surface.createProgram(vertexShaderSource, fragmentShaderSource);
      programRef.current = program;

      uniformsRef.current = {
        resolution: gl.getUniformLocation(program, "u_resolution") || undefined,
        mouse: gl.getUniformLocation(program, "u_mouse") || undefined,
        time: gl.getUniformLocation(program, "u_time") || undefined,
        progress: gl.getUniformLocation(program, "u_progress") || undefined,
        strength: gl.getUniformLocation(program, "u_strength") || undefined,
        speed: gl.getUniformLocation(program, "u_speed") || undefined,
        image: gl.getUniformLocation(program, "u_image") || undefined,
      };

      if (imageElement) {
        uploadTexture(gl, imageElement);
      }
    }

    try {
      const surface = createSurface(canvas, {
        maxDpr,
        scale: renderScale,
        onContextLost: () => {
          canvas.style.display = "none";
          if (textureRef.current && glRef.current) {
            glRef.current.deleteTexture(textureRef.current);
            textureRef.current = null;
          }
          onContextLostRef.current?.();
        },
        onContextRestored: () => {
          canvas.style.display = "block";
          if (surfaceRef.current) {
            setupProgram(surfaceRef.current);
            renderFrame();
          }
          onContextRestoredRef.current?.();
        },
      }); // @frictionborn-guard

      surfaceRef.current = surface;
      setupProgram(surface);
      renderFrame();
    } catch (err) {
      console.warn("DistortionImage WebGL2 initialization failed; falling back to static image", err);
      if (surfaceRef.current) {
        surfaceRef.current.dispose(); // @frictionborn-guard
        surfaceRef.current = null;
      }
      onContextLostRef.current?.();
    }

    return () => {
      // Explicitly delete WebGL texture to guarantee 0 texture leaks
      if (textureRef.current && glRef.current) {
        glRef.current.deleteTexture(textureRef.current);
        textureRef.current = null;
      }
      if (surfaceRef.current) {
        surfaceRef.current.dispose(); // @frictionborn-guard
        surfaceRef.current = null;
      }
      canvas.remove();
      canvasRef.current = null;
    };
  }, [maxDpr, renderScale, imageElement, uploadTexture, renderFrame]);

  // The browser may pick another srcset candidate (resize, DPR change) or the src prop may change while the
  // canvas is live: upload the new pixels so the overlay never shows a stale picture over the real image.
  useEffect(() => {
    const img = imageElement;
    if (!img) return;
    const onLoad = async () => {
      try {
        await img.decode();
      } catch {
        // decode can reject for a replaced source; the load event for the new one follows
      }
      const gl = glRef.current;
      if (!gl || gl.isContextLost() || !textureRef.current) return;
      if ((img.currentSrc || img.src) === uploadedSrcRef.current) return;
      uploadTexture(gl, img);
    };
    img.addEventListener("load", onLoad);
    return () => img.removeEventListener("load", onLoad);
  }, [imageElement, uploadTexture]);

  // Frame animation loop managed by runtime useFrame
  useFrame(
    ({ dt }) => {
      const targetProgress = isHoveredRef.current ? 1.0 : 0.0;
      // Exponential smoothing towards target progress (~180ms rise, ~260ms fall)
      const smoothing = isHoveredRef.current ? 0.09 : 0.06;
      progressRef.current += (targetProgress - progressRef.current) * smoothing;

      // Increment animation time while distortion is active
      if (progressRef.current > 0.005) {
        timeRef.current += (dt * 0.001) * speedRef.current;
      }

      renderFrame();
    },
    { active: !paused } // @frictionborn-guard
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
      }}
    />
  );
}
