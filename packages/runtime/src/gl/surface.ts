// Original — Frictionborn Motion createSurface (@frictionborn/runtime/gl)

export interface SurfaceOptions {
  maxDpr?: number;
  scale?: number;
  onContextLost?: (event: Event) => void;
  onContextRestored?: () => void;
  onError?: (error: Error) => void;
}

export interface Surface {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  resize: () => { width: number; height: number; dpr: number };
  createProgram: (vertexSource: string, fragmentSource: string) => WebGLProgram;
  draw: () => void;
  dispose: () => void;
}

export type SurfaceInstance = Surface;

const FULLSCREEN_TRIANGLE = new Float32Array([
  -1, -1,
   3, -1,
  -1,  3,
]);

const DEFAULT_VERTEX_SHADER = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to allocate WebGL shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "Unknown error";
    gl.deleteShader(shader);

    // Format with line numbers for readable debugging
    const lines = source.split("\n");
    const annotated = lines
      .map((l, i) => `${(i + 1).toString().padStart(3, " ")} | ${l}`)
      .join("\n");

    throw new Error(`Shader compile error:\n${info}\nSource:\n${annotated}`);
  }

  return shader;
}

export function createSurface(
  canvas: HTMLCanvasElement,
  options: SurfaceOptions = {}
): Surface {
  if (typeof window === "undefined" || !canvas) {
    throw new Error("createSurface can only be called in a browser environment with a canvas element");
  }

  const {
    maxDpr = 2,
    scale = 1.0,
    onContextLost,
    onContextRestored,
    onError,
  } = options;

  const gl = canvas.getContext("webgl2", {
    powerPreference: "low-power",
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    const err = new Error("WebGL2 is not supported on this device/browser");
    // round 4 (Part 6): tell the core runtime (a separate bundle) that WebGL2 cannot be made here, so every item drops to its poster
    window.dispatchEvent(new Event("fb-webgl2-unavailable"));
    onError?.(err);
    throw err;
  }

  // Full-screen triangle buffer setup
  let vao: WebGLVertexArrayObject | null = null;
  let vbo: WebGLBuffer | null = null;

  const initBuffers = () => {
    vao = gl.createVertexArray();
    vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  };

  initBuffers();

  // Resize calculation with clamps
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const rawDpr = window.devicePixelRatio || 1;
    const dpr = Math.min(rawDpr, maxDpr);

    let displayWidth = Math.floor(rect.width * dpr * scale);
    let displayHeight = Math.floor(rect.height * dpr * scale);

    // iOS Safari 8192x8192 total area limit clamp
    const maxDimension = 8192;
    if (displayWidth * displayHeight > maxDimension * maxDimension) {
      const ratio = Math.sqrt((maxDimension * maxDimension) / (displayWidth * displayHeight));
      displayWidth = Math.floor(displayWidth * ratio);
      displayHeight = Math.floor(displayHeight * ratio);
    }

    displayWidth = Math.max(1, displayWidth);
    displayHeight = Math.max(1, displayHeight);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    gl.viewport(0, 0, displayWidth, displayHeight);
    return { width: displayWidth, height: displayHeight, dpr };
  };

  // ResizeObserver
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);
  }

  // Initial sizing
  resize();

  // Context Loss and Restoration
  const handleContextLost = (e: Event) => {
    e.preventDefault();
    onContextLost?.(e);
  };

  const handleContextRestored = () => {
    canvas.style.display = "block";
    // Programs made before the loss belong to the dead context; deleting them later only logs a WebGL warning.
    programs.length = 0;
    initBuffers();
    resize();
    onContextRestored?.();
  };

  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

  const programs: WebGLProgram[] = [];

  const createProgram = (
    vertexSource: string = DEFAULT_VERTEX_SHADER,
    fragmentSource: string
  ): WebGLProgram => {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    if (!program) {
      throw new Error("Failed to allocate WebGL program");
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || "Unknown linker error";
      gl.deleteProgram(program);
      throw new Error(`Shader program link error: ${info}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    programs.push(program);
    return program;
  };

  const draw = () => {
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    canvas.removeEventListener("webglcontextlost", handleContextLost);
    canvas.removeEventListener("webglcontextrestored", handleContextRestored);

    for (const prog of programs) {
      gl.deleteProgram(prog);
    }
    programs.length = 0;

    if (vbo) gl.deleteBuffer(vbo);
    if (vao) gl.deleteVertexArray(vao);

    // Call WEBGL_lose_context extension per ARCHITECTURE.md §3
    const loseContext = gl.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
  };

  return {
    gl,
    canvas,
    resize,
    createProgram,
    draw,
    dispose,
  };
}
