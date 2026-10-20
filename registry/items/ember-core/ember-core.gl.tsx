// Original — Frictionborn Motion "Ember Core" WebGL2 engine (ash filaments, inner glow, pointer torch, bloom, gestures, and synthesized sound)
"use client";

import { useEffect, useRef, useState } from "react";
import { createSurface, type Surface } from "@frictionborn/runtime/gl";
import { useFrame, useFrameGuard } from "@frictionborn/runtime";
import {
  FILAMENT_VERT,
  FILAMENT_FRAG,
  GLOW_VERT,
  GLOW_FRAG,
  TORCH_VERT,
  TORCH_FRAG,
  POST_VERT,
  BLOOM_THRESHOLD_FRAG,
  BLOOM_BLUR_FRAG,
  BLOOM_COMPOSITE_FRAG,
} from "./ember-core.glsl";

export type RGB = [number, number, number];

export interface EmberCorePaletteRGB {
  ash: RGB;
  ember: RGB;
  hot: RGB;
  gA: RGB;
  gB: RGB;
}

export interface EmberCoreGLProps {
  colors: EmberCorePaletteRGB;
  interactive: "full" | "hero" | "none";
  heat: number;
  swirl: number;
  spin: number;
  density: number;
  bloom: boolean;
  sound: boolean;
  paused: boolean;
  reducedMotion: boolean;
  tier: number;
  offsetX?: number;
  lightTheme?: boolean;
  suspended?: boolean;
  strikeTrigger?: number;
  resetTrigger?: number;
  ariaLabel?: string;
  onToast?: (msg: string) => void;
  onTogglePause?: () => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onDowngrade?: () => void;
}

type Quat = [number, number, number, number]; // [x, y, z, w]

const ZMIN = 0.55;
const ZMAX = 1.9;
const FOV_RAD = (35 * Math.PI) / 180;

function quatFromEulerX(rad: number): Quat {
  const half = rad * 0.5;
  return [Math.sin(half), 0, 0, Math.cos(half)];
}

function quatFromAxisAngle(ax: number, ay: number, az: number, angle: number): Quat {
  const half = angle * 0.5;
  const s = Math.sin(half);
  return [ax * s, ay * s, az * s, Math.cos(half)];
}

function quatMultiply(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  const x = aw * bx + ax * bw + ay * bz - az * by;
  const y = aw * by - ax * bz + ay * bw + az * bx;
  const z = aw * bz + ax * by - ay * bx + az * bw;
  const w = aw * bw - ax * bx - ay * by - az * bz;
  const len = Math.hypot(x, y, z, w) || 1;
  return [x / len, y / len, z / len, w / len];
}

function quatRotateOnWorldAxis(q: Quat, ax: number, ay: number, az: number, angle: number): Quat {
  if (Math.abs(angle) < 1e-7) return q;
  const rot = quatFromAxisAngle(ax, ay, az, angle);
  return quatMultiply(rot, q);
}

function mat4FromQuat(q: Quat, out: Float32Array): void {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  out[0] = 1 - (yy + zz); out[1] = xy + wz; out[2] = xz - wy; out[3] = 0;
  out[4] = xy - wz; out[5] = 1 - (xx + zz); out[6] = yz + wx; out[7] = 0;
  out[8] = xz + wy; out[9] = yz - wx; out[10] = 1 - (xx + yy); out[11] = 0;
  out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
}

function mat4Translation(tx: number, ty: number, tz: number, out: Float32Array): void {
  out.fill(0);
  out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
  out[12] = tx; out[13] = ty; out[14] = tz;
}

function mat4Perspective(fovRad: number, aspect: number, near: number, far: number, out: Float32Array): void {
  const f = 1.0 / Math.tan(fovRad * 0.5);
  const nf = 1.0 / (near - far);
  out.fill(0);
  out[0] = f / Math.max(0.01, aspect);
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
}

const envFlare = (dt: number) => (dt < 0 ? 0 : dt < 0.35 ? dt / 0.35 : Math.exp(-(dt - 0.35) * 1.6));
const envBurst = (dt: number) => (dt < 0 ? 0 : dt < 0.12 ? dt / 0.12 : Math.exp(-(dt - 0.12) * 2.2));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface BuildGeoResult {
  fPos: Float32Array;
  fSeed: Float32Array;
  strands: number;
  steps: number;
  gPos: Float32Array;
  gSeed: Float32Array;
  glowCount: number;
}

let cachedTier2Geo: BuildGeoResult | null = null;
let cachedTier3Geo: BuildGeoResult | null = null;

function buildGeometry(isTier2: boolean): BuildGeoResult {
  if (isTier2 && cachedTier2Geo) return cachedTier2Geo;
  if (!isTier2 && cachedTier3Geo) return cachedTier3Geo;

  const strands = isTier2 ? 2200 : 4600;
  const steps = isTier2 ? 48 : 62;
  const n = strands * steps;
  const fPos = new Float32Array(n * 3);
  const fSeed = new Float32Array(n);
  let rnd = 1337;
  const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
  const field = (x: number, y: number, z: number): [number, number, number] => [
    Math.sin(1.7 * y + Math.cos(2.3 * z)) + 0.6 * Math.sin(3.1 * z + 1.3),
    Math.sin(1.9 * z + Math.cos(2.1 * x)) + 0.6 * Math.sin(2.7 * x + 0.4),
    Math.sin(2.2 * x + Math.cos(1.6 * y)) + 0.6 * Math.sin(2.9 * y + 2.1),
  ];
  for (let s = 0, k = 0; s < strands; s++) {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const r0 = rand() < 0.18 ? 0.25 + rand() * 0.4 : 0.62 + Math.pow(rand(), 0.7) * 0.42;
    const sq = Math.sqrt(1 - u * u);
    let x = sq * Math.cos(th) * r0;
    let y = u * r0;
    let z = sq * Math.sin(th) * r0;
    const sd = rand();
    for (let i = 0; i < steps; i++, k++) {
      fPos[k * 3] = x;
      fPos[k * 3 + 1] = y;
      fPos[k * 3 + 2] = z;
      fSeed[k] = sd;
      let [fx, fy, fz] = field(x * 1.6, y * 1.6, z * 1.6);
      const r = Math.hypot(x, y, z) || 1;
      const dot = (fx * x + fy * y + fz * z) / r;
      fx -= (dot * x) / r;
      fy -= (dot * y) / r;
      fz -= (dot * z) / r;
      const len = Math.hypot(fx, fy, fz) || 1;
      x += (fx / len) * 0.0062;
      y += (fy / len) * 0.0062;
      z += (fz / len) * 0.0062;
    }
  }

  const glowCount = isTier2 ? 1100 : 2000;
  const gPos = new Float32Array(glowCount * 3);
  const gSeed = new Float32Array(glowCount);
  for (let i = 0; i < glowCount; i++) {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.6) * 0.62;
    const sq = Math.sqrt(1 - u * u);
    gPos[i * 3] = sq * Math.cos(th) * r;
    gPos[i * 3 + 1] = u * r - 0.08;
    gPos[i * 3 + 2] = sq * Math.sin(th) * r;
    gSeed[i] = rand();
  }

  const res = { fPos, fSeed, strands, steps, gPos, gSeed, glowCount };
  if (isTier2) cachedTier2Geo = res;
  else cachedTier3Geo = res;
  return res;
}

export default function EmberCoreGL({
  colors,
  interactive,
  heat,
  swirl,
  spin,
  density,
  bloom,
  sound,
  paused,
  reducedMotion,
  tier,
  offsetX = 0,
  lightTheme = false,
  suspended = false,
  strikeTrigger = 0,
  resetTrigger = 0,
  ariaLabel,
  onToast,
  onTogglePause,
  onContextLost,
  onContextRestored,
  onDowngrade,
}: EmberCoreGLProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<Surface | null>(null);
  const [tier2BloomOff, setTier2BloomOff] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const isTier2 = tier <= 2;
  const maxDpr = tier >= 3 ? 2.0 : 1.5;
  const bloomActive = bloom && !(isTier2 && tier2BloomOff);

  const propsRef = useRef({
    colors,
    interactive,
    heat,
    swirl,
    spin,
    density,
    bloomActive,
    sound,
    paused,
    reducedMotion,
    isTier2,
    offsetX,
    lightTheme,
    ariaLabel,
    onToast,
    onTogglePause,
    onContextLost,
    onContextRestored,
    onDowngrade,
  });

  useEffect(() => {
    propsRef.current = {
      colors,
      interactive,
      heat,
      swirl,
      spin,
      density,
      bloomActive,
      sound,
      paused,
      reducedMotion,
      isTier2,
      offsetX,
      lightTheme,
      ariaLabel,
      onToast,
      onTogglePause,
      onContextLost,
      onContextRestored,
      onDowngrade,
    };
  });

  // Simulation state ref
  const simRef = useRef({
    clock: 4,
    flareT: -99,
    nextAuto: 17,
    burstT: -99,
    burstAmp: 0,
    charging: false,
    charge: 0,
    pointerTarget: 0,
    uPointerOn: 0,
    uPointer: [9, 9, 9] as [number, number, number],
    uWaveO: [0, 0, 0.95] as [number, number, number],
    uWaveT: 99,
    uFlare: 0,
    uBurst: 0,
    velX: 0,
    velY: 0,
    lastInteract: -99,
    quat: quatFromEulerX(0.35),
    fitDist: 4,
    zoom: 1,
    zoomTarget: 1,
    camX: 0,
    camY: 0,
    camZ: 4,
    aspect: 1,
    dpr: 1,
    dragging: false,
  });

  // AudioContext ref (created only after a user gesture when sound is true)
  const audioRef = useRef<AudioContext | null>(null);

  const ensureAudio = () => {
    if (!propsRef.current.sound) return null;
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        try {
          audioRef.current = new AC();
        } catch {
          return null;
        }
      }
    }
    if (audioRef.current && audioRef.current.state === "suspended") {
      audioRef.current.resume().catch(() => {});
    }
    return audioRef.current;
  };

  const noiseBurst = (dur: number, freq: number, gain: number) => {
    const actx = ensureAudio();
    if (!actx) return;
    try {
      const len = Math.floor(actx.sampleRate * dur);
      const buf = actx.createBuffer(1, len, actx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (Math.random() < 0.08 ? 1 : 0.35);
      }
      const src = actx.createBufferSource();
      src.buffer = buf;
      const bp = actx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = 0.8;
      const g = actx.createGain();
      g.gain.value = gain;
      src.connect(bp).connect(g).connect(actx.destination);
      src.start();
    } catch {
      // Ignore audio errors
    }
  };

  const thump = (amp: number) => {
    const actx = ensureAudio();
    if (!actx) return;
    try {
      const o = actx.createOscillator();
      const g = actx.createGain();
      const t = actx.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
      g.gain.setValueAtTime(0.35 * amp, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o.connect(g).connect(actx.destination);
      o.start();
      o.stop(t + 0.75);
    } catch {
      // Ignore audio errors
    }
  };

  const drawNowRef = useRef<() => void>(() => {});
  const stepSimRef = useRef<(dt: number) => void>(() => {});
  const triggerStrikeRef = useRef<(at: [number, number, number] | null, auto?: boolean) => void>(() => {});
  const prevSoundRef = useRef(sound);

  useEffect(() => {
    if (sound && !prevSoundRef.current) {
      noiseBurst(0.3, 2400, 0.3);
    }
    prevSoundRef.current = sound;
  });

  useEffect(() => {
    if (strikeTrigger > 0) {
      triggerStrikeRef.current(null, false);
    }
  }, [strikeTrigger]);

  useEffect(() => {
    if (resetTrigger > 0) {
      const s = simRef.current;
      s.quat = quatFromEulerX(0.35);
      s.velX = 0;
      s.velY = 0;
      s.zoomTarget = 1;
      s.zoom = 1;
      s.flareT = -99;
      s.burstT = -99;
      s.uFlare = 0;
      s.uBurst = 0;
      s.uWaveT = 99;
      s.charge = 0;
      s.charging = false;
      drawNowRef.current();
    }
  }, [resetTrigger]);

  // Redraw when visual props change while paused or in reduced motion
  useEffect(() => {
    drawNowRef.current();
  }, [colors, heat, swirl, spin, density, bloomActive, offsetX, lightTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.zIndex = "1";

    const applyInteractiveAttrs = () => {
      const mode = propsRef.current.interactive;
      if (mode === "full") {
        canvas.tabIndex = 0;
        canvas.setAttribute("role", "application");
        canvas.setAttribute(
          "aria-label",
          propsRef.current.ariaLabel ||
            "Ember Core: a sphere of ash filaments with fire inside. Drag to spin, scroll or pinch to zoom, click to strike, hold to charge and release to burst. Keyboard: arrow keys spin, Space strikes or charges when held, plus and minus zoom, P pauses."
        );
        canvas.removeAttribute("aria-hidden");
        canvas.style.touchAction = "none";
        canvas.style.pointerEvents = "auto";
        canvas.style.cursor = "grab";
      } else if (mode === "hero") {
        canvas.removeAttribute("tabindex");
        canvas.removeAttribute("role");
        canvas.removeAttribute("aria-label");
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.touchAction = "pan-y";
        canvas.style.pointerEvents = "auto";
        canvas.style.cursor = "grab";
      } else {
        canvas.removeAttribute("tabindex");
        canvas.removeAttribute("role");
        canvas.removeAttribute("aria-label");
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.touchAction = "auto";
        canvas.style.pointerEvents = "none";
        canvas.style.cursor = "default";
      }
    };
    applyInteractiveAttrs();
    container.appendChild(canvas);

    const geo = buildGeometry(isTier2);
    const modelMat = new Float32Array(16);
    const viewMat = new Float32Array(16);
    const projMat = new Float32Array(16);

    let fProg: WebGLProgram | null = null;
    let gProg: WebGLProgram | null = null;
    let tProg: WebGLProgram | null = null;
    let threshProg: WebGLProgram | null = null;
    let blurProg: WebGLProgram | null = null;
    let compProg: WebGLProgram | null = null;

    let fVao: WebGLVertexArrayObject | null = null;
    let fPosBuf: WebGLBuffer | null = null;
    let fSeedBuf: WebGLBuffer | null = null;

    let gVao: WebGLVertexArrayObject | null = null;
    let gPosBuf: WebGLBuffer | null = null;
    let gSeedBuf: WebGLBuffer | null = null;

    let tVao: WebGLVertexArrayObject | null = null;
    let tPosBuf: WebGLBuffer | null = null;

    let sceneFbo: WebGLFramebuffer | null = null;
    let sceneTex: WebGLTexture | null = null;
    let pingFbo: WebGLFramebuffer | null = null;
    let pingTex: WebGLTexture | null = null;
    let pongFbo: WebGLFramebuffer | null = null;
    let pongTex: WebGLTexture | null = null;
    let fboW = 0;
    let fboH = 0;

    type LocMap = Record<string, WebGLUniformLocation | null>;
    let fLoc: LocMap = {};
    let gLoc: LocMap = {};
    let tLoc: LocMap = {};
    let threshLoc: LocMap = {};
    let blurLoc: LocMap = {};
    let compLoc: LocMap = {};

    const getLocs = (gl: WebGL2RenderingContext, prog: WebGLProgram, names: string[]): LocMap => {
      const m: LocMap = {};
      for (const n of names) m[n] = gl.getUniformLocation(prog, n);
      return m;
    };

    const deleteFbos = (gl: WebGL2RenderingContext) => {
      if (sceneFbo) gl.deleteFramebuffer(sceneFbo);
      if (sceneTex) gl.deleteTexture(sceneTex);
      if (pingFbo) gl.deleteFramebuffer(pingFbo);
      if (pingTex) gl.deleteTexture(pingTex);
      if (pongFbo) gl.deleteFramebuffer(pongFbo);
      if (pongTex) gl.deleteTexture(pongTex);
      sceneFbo = pingFbo = pongFbo = null;
      sceneTex = pingTex = pongTex = null;
      fboW = 0;
      fboH = 0;
    };

    const ensureFbos = (gl: WebGL2RenderingContext, w: number, h: number): boolean => {
      if (fboW === w && fboH === h && sceneFbo && pingFbo && pongFbo) return true;
      deleteFbos(gl);

      const floatExt = gl.getExtension("EXT_color_buffer_float");
      gl.getExtension("OES_texture_float_linear");
      const internalFormat = floatExt ? gl.RGBA16F : gl.RGBA8;
      const type = floatExt ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

      const makeTarget = (tw: number, th: number) => {
        const tex = gl.createTexture();
        const fbo = gl.createFramebuffer();
        if (!tex || !fbo) return null;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, tw, th, 0, gl.RGBA, type, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (!ok) {
          gl.deleteFramebuffer(fbo);
          gl.deleteTexture(tex);
          return null;
        }
        return { tex, fbo };
      };

      const hw = Math.max(1, w >> 1);
      const hh = Math.max(1, h >> 1);
      const sTarget = makeTarget(w, h);
      const aTarget = makeTarget(hw, hh);
      const bTarget = makeTarget(hw, hh);
      if (!sTarget || !aTarget || !bTarget) {
        if (sTarget) { gl.deleteFramebuffer(sTarget.fbo); gl.deleteTexture(sTarget.tex); }
        if (aTarget) { gl.deleteFramebuffer(aTarget.fbo); gl.deleteTexture(aTarget.tex); }
        if (bTarget) { gl.deleteFramebuffer(bTarget.fbo); gl.deleteTexture(bTarget.tex); }
        return false;
      }
      sceneFbo = sTarget.fbo; sceneTex = sTarget.tex;
      pingFbo = aTarget.fbo; pingTex = aTarget.tex;
      pongFbo = bTarget.fbo; pongTex = bTarget.tex;
      fboW = w;
      fboH = h;
      return true;
    };

    const setupResources = (surface: Surface) => {
      const gl = surface.gl;
      sceneFbo = pingFbo = pongFbo = null;
      sceneTex = pingTex = pongTex = null;
      fboW = 0;
      fboH = 0;
      fProg = surface.createProgram(FILAMENT_VERT, FILAMENT_FRAG);
      gProg = surface.createProgram(GLOW_VERT, GLOW_FRAG);
      tProg = surface.createProgram(TORCH_VERT, TORCH_FRAG);
      threshProg = surface.createProgram(POST_VERT, BLOOM_THRESHOLD_FRAG);
      blurProg = surface.createProgram(POST_VERT, BLOOM_BLUR_FRAG);
      compProg = surface.createProgram(POST_VERT, BLOOM_COMPOSITE_FRAG);

      const commonNames = [
        "uModelMatrix", "uViewMatrix", "uProjMatrix", "uCameraPos",
        "uTime", "uFlare", "uSize", "uPR", "uHeat", "uCharge", "uBurst", "uLightTheme",
        "uAsh", "uEmber", "uHot", "uGA", "uGB",
        "uPointer", "uPointerOn", "uSwirl", "uWaveT", "uWaveO",
      ];
      fLoc = getLocs(gl, fProg, commonNames);
      gLoc = getLocs(gl, gProg, commonNames);
      tLoc = getLocs(gl, tProg, commonNames);
      threshLoc = getLocs(gl, threshProg, ["uTex", "uThreshold"]);
      blurLoc = getLocs(gl, blurProg, ["uTex", "uDir", "uRadius"]);
      compLoc = getLocs(gl, compProg, ["uSceneTex", "uBloomTex", "uStrength", "uLightTheme", "uPlateCenter", "uAspect"]);

      // Filaments VAO
      fVao = gl.createVertexArray();
      fPosBuf = gl.createBuffer();
      fSeedBuf = gl.createBuffer();
      gl.bindVertexArray(fVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, fPosBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geo.fPos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, fSeedBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geo.fSeed, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

      // Glow VAO
      gVao = gl.createVertexArray();
      gPosBuf = gl.createBuffer();
      gSeedBuf = gl.createBuffer();
      gl.bindVertexArray(gVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gPosBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geo.gPos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, gSeedBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geo.gSeed, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

      // Torch VAO
      tVao = gl.createVertexArray();
      tPosBuf = gl.createBuffer();
      gl.bindVertexArray(tVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, tPosBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    const updateCameraMetrics = () => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = canvas.getBoundingClientRect();
      const cw = Math.max(1, rect.width);
      const ch = Math.max(1, rect.height);
      const s = simRef.current;
      s.aspect = cw / ch;
      const v = FOV_RAD * 0.5;
      const hz = Math.atan(Math.tan(v) * s.aspect);
      s.fitDist = Math.max(1.22 / Math.tan(v), 1.18 / Math.tan(hz)) + 0.1;
      s.camX = cw >= 860 ? propsRef.current.offsetX : 0;
      s.camY = cw < ch ? 0.18 : 0;
      s.camZ = s.fitDist * s.zoom;
      s.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    };

    const renderScene = () => {
      const surface = surfaceRef.current;
      if (!surface || !fProg || !gProg || !tProg) return;
      const gl = surface.gl;
      if (gl.isContextLost()) return;

      updateCameraMetrics();
      const s = simRef.current;
      const p = propsRef.current;
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      if (w < 1 || h < 1) return;

      mat4FromQuat(s.quat, modelMat);
      mat4Translation(-s.camX, -s.camY, -s.camZ, viewMat);
      mat4Perspective(FOV_RAD, s.aspect, 0.1, 50.0, projMat);

      const useBloom = p.bloomActive && threshProg && blurProg && compProg && ensureFbos(gl, w, h);

      gl.bindFramebuffer(gl.FRAMEBUFFER, useBloom ? sceneFbo : null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);

      const setCommonUniforms = (loc: LocMap) => {
        if (loc.uModelMatrix) gl.uniformMatrix4fv(loc.uModelMatrix, false, modelMat);
        if (loc.uViewMatrix) gl.uniformMatrix4fv(loc.uViewMatrix, false, viewMat);
        if (loc.uProjMatrix) gl.uniformMatrix4fv(loc.uProjMatrix, false, projMat);
        if (loc.uCameraPos) gl.uniform3f(loc.uCameraPos, s.camX, s.camY, s.camZ);
        if (loc.uTime) gl.uniform1f(loc.uTime, s.clock);
        if (loc.uFlare) gl.uniform1f(loc.uFlare, s.uFlare);
        if (loc.uSize) gl.uniform1f(loc.uSize, p.isTier2 ? 3.5 : 3.0);
        if (loc.uPR) gl.uniform1f(loc.uPR, s.dpr);
        if (loc.uHeat) gl.uniform1f(loc.uHeat, p.heat);
        if (loc.uCharge) gl.uniform1f(loc.uCharge, s.charge);
        if (loc.uBurst) gl.uniform1f(loc.uBurst, s.uBurst);
        if (loc.uLightTheme) gl.uniform1f(loc.uLightTheme, p.lightTheme ? 1.0 : 0.0);
        if (loc.uSwirl) gl.uniform1f(loc.uSwirl, p.swirl);
        if (loc.uPointer) gl.uniform3f(loc.uPointer, s.uPointer[0], s.uPointer[1], s.uPointer[2]);
        if (loc.uPointerOn) gl.uniform1f(loc.uPointerOn, s.uPointerOn);
        if (loc.uWaveT) gl.uniform1f(loc.uWaveT, s.uWaveT);
        if (loc.uWaveO) gl.uniform3f(loc.uWaveO, s.uWaveO[0], s.uWaveO[1], s.uWaveO[2]);
        if (loc.uAsh) gl.uniform3f(loc.uAsh, p.colors.ash[0], p.colors.ash[1], p.colors.ash[2]);
        if (loc.uEmber) gl.uniform3f(loc.uEmber, p.colors.ember[0], p.colors.ember[1], p.colors.ember[2]);
        if (loc.uHot) gl.uniform3f(loc.uHot, p.colors.hot[0], p.colors.hot[1], p.colors.hot[2]);
        if (loc.uGA) gl.uniform3f(loc.uGA, p.colors.gA[0], p.colors.gA[1], p.colors.gA[2]);
        if (loc.uGB) gl.uniform3f(loc.uGB, p.colors.gB[0], p.colors.gB[1], p.colors.gB[2]);
      };

      // 1. Filaments (premultiplied normal blending so ash strands build crisp volume without alpha squaring)
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(fProg);
      setCommonUniforms(fLoc);
      gl.bindVertexArray(fVao);
      const drawCount = Math.floor(geo.strands * clamp(p.density, 0.2, 1)) * geo.steps;
      gl.drawArrays(gl.POINTS, 0, drawCount);

      // 2. Inner glow (additive)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(gProg);
      setCommonUniforms(gLoc);
      gl.bindVertexArray(gVao);
      gl.drawArrays(gl.POINTS, 0, geo.glowCount);

      // 3. Pointer torch (additive)
      if (s.uPointerOn > 0.005) {
        gl.useProgram(tProg);
        setCommonUniforms(tLoc);
        gl.bindVertexArray(tVao);
        gl.drawArrays(gl.POINTS, 0, 1);
      }
      gl.bindVertexArray(null);

      // 4. Bloom passes (strength 0.75, radius 0.6, threshold 0.18)
      if (useBloom && threshProg && blurProg && compProg) {
        gl.disable(gl.BLEND);
        const hw = Math.max(1, w >> 1);
        const hh = Math.max(1, h >> 1);

        // Threshold pass -> pingFbo
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingFbo);
        gl.viewport(0, 0, hw, hh);
        gl.useProgram(threshProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTex);
        if (threshLoc.uTex) gl.uniform1i(threshLoc.uTex, 0);
        if (threshLoc.uThreshold) gl.uniform1f(threshLoc.uThreshold, 0.18);
        surface.draw();

        // Two separable Gaussian blur passes (radius 0.6)
        gl.useProgram(blurProg);
        if (blurLoc.uTex) gl.uniform1i(blurLoc.uTex, 0);
        if (blurLoc.uRadius) gl.uniform1f(blurLoc.uRadius, 0.6);

        for (const scale of [2.0, 1.0]) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, pongFbo);
          gl.bindTexture(gl.TEXTURE_2D, pingTex);
          if (blurLoc.uDir) gl.uniform2f(blurLoc.uDir, scale / hw, 0);
          surface.draw();

          gl.bindFramebuffer(gl.FRAMEBUFFER, pingFbo);
          gl.bindTexture(gl.TEXTURE_2D, pongTex);
          if (blurLoc.uDir) gl.uniform2f(blurLoc.uDir, 0, scale / hh);
          surface.draw();
        }

        // Composite pass -> screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(compProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTex);
        if (compLoc.uSceneTex) gl.uniform1i(compLoc.uSceneTex, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, pingTex);
        if (compLoc.uBloomTex) gl.uniform1i(compLoc.uBloomTex, 1);
        if (compLoc.uStrength) gl.uniform1f(compLoc.uStrength, 0.75);
        if (compLoc.uLightTheme) gl.uniform1f(compLoc.uLightTheme, p.lightTheme ? 1.0 : 0.0);
        if (compLoc.uPlateCenter) gl.uniform2f(compLoc.uPlateCenter, s.camX < -0.1 ? 0.58 : 0.5, 0.5);
        if (compLoc.uAspect) gl.uniform1f(compLoc.uAspect, s.aspect);
        surface.draw();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
      } else {
        gl.disable(gl.BLEND);
      }
    };

    const checkBusy = () => {
      const s = simRef.current;
      return (
        s.dragging ||
        s.charging ||
        s.charge > 0.001 ||
        Math.abs(s.velX) + Math.abs(s.velY) > 0.002 ||
        Math.abs(s.zoomTarget - s.zoom) > 0.001 ||
        Math.abs(s.pointerTarget - s.uPointerOn) > 0.01 ||
        s.uWaveT < 3 ||
        s.clock - s.burstT < 3 ||
        s.clock - s.flareT < 3
      );
    };

    const stepSim = (dt: number) => {
      const s = simRef.current;
      const p = propsRef.current;
      s.clock += dt;
      if (!p.paused && !p.reducedMotion && s.clock > s.nextAuto) {
        if (s.clock - s.lastInteract > 6) {
          triggerStrike(null, true);
        }
        s.nextAuto = s.clock + 13 + Math.random() * 6;
      }
      s.charge = s.charging ? Math.min(1, s.charge + dt * 0.55) : Math.max(0, s.charge - dt * 2.5);
      if (s.charging && Math.random() < dt * 14 * s.charge) {
        noiseBurst(0.06, 3000, 0.08 + s.charge * 0.12);
      }
      s.uFlare = envFlare(s.clock - s.flareT);
      s.uBurst = envBurst(s.clock - s.burstT) * s.burstAmp;
      s.uWaveT = Math.min(99, s.uWaveT + dt);
      s.uPointerOn += (s.pointerTarget - s.uPointerOn) * Math.min(1, dt * 6);

      if (!s.dragging) {
        s.quat = quatRotateOnWorldAxis(s.quat, 1, 0, 0, s.velX * dt);
        const idleSpin = p.paused || p.reducedMotion ? 0 : 0.06 * p.spin * dt;
        s.quat = quatRotateOnWorldAxis(s.quat, 0, 1, 0, s.velY * dt + idleSpin);
        const damp = Math.exp(-dt * 2.2);
        s.velX *= damp;
        s.velY *= damp;
      }
      s.zoom += (s.zoomTarget - s.zoom) * Math.min(1, dt * 7);
      s.camZ = s.fitDist * s.zoom;
    };

    let reducedMotionFlareTimer = 0;

    const triggerStrike = (at: [number, number, number] | null, auto = false) => {
      const s = simRef.current;
      const p = propsRef.current;
      s.uWaveO = at ? [at[0], at[1], at[2]] : [0, 0, 0.95];
      if (!auto) noiseBurst(0.45, 2200, 0.5);

      if (p.reducedMotion) {
        // Reduced motion: mode still-frame. A strike shows one flared frame, then returns.
        window.clearTimeout(reducedMotionFlareTimer);
        s.uFlare = 1.0;
        s.uWaveT = 0.22;
        renderScene();
        reducedMotionFlareTimer = window.setTimeout(() => {
          s.uFlare = 0;
          s.uWaveT = 99;
          renderScene();
        }, 900);
        return;
      }

      s.flareT = s.clock;
      s.uWaveT = 0;
      if (!auto) {
        s.lastInteract = s.clock;
        setIsBusy(true);
      }
    };

    const startCharge = () => {
      const s = simRef.current;
      const p = propsRef.current;
      if (p.reducedMotion) return;
      s.charging = true;
      s.lastInteract = s.clock;
      p.onToast?.("Charging… release to burst");
      setIsBusy(true);
    };

    const releaseCharge = (at: [number, number, number] | null) => {
      const s = simRef.current;
      const p = propsRef.current;
      if (!s.charging) return;
      s.charging = false;
      s.burstT = s.clock;
      s.burstAmp = 0.25 + s.charge * 0.95;
      triggerStrike(at, false);
      thump(0.4 + s.charge);
      noiseBurst(0.9, 900, 0.4 + s.charge * 0.4);
      p.onToast?.(s.charge > 0.8 ? "Full burst" : "Burst");
      setIsBusy(true);
    };

    drawNowRef.current = renderScene;
    stepSimRef.current = (dt: number) => {
      stepSim(dt);
      renderScene();
      const busyNow = checkBusy();
      setIsBusy((prev) => (prev !== busyNow ? busyNow : prev));
    };
    triggerStrikeRef.current = triggerStrike;

    // Raycast pointer onto the sphere (r=1.1) or camera-facing plane through origin
    const pointerToWorld = (clientX: number, clientY: number, out: [number, number, number]): number => {
      updateCameraMetrics();
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return 0;
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      const s = simRef.current;
      const tanHalf = Math.tan(FOV_RAD * 0.5);
      let dx = ndcX * s.aspect * tanHalf;
      let dy = ndcY * tanHalf;
      let dz = -1;
      const len = Math.hypot(dx, dy, dz) || 1;
      dx /= len; dy /= len; dz /= len;

      const ox = s.camX, oy = s.camY, oz = s.camZ;
      const rBall = 1.1;
      const b = ox * dx + oy * dy + oz * dz;
      const c = ox * ox + oy * oy + oz * oz - rBall * rBall;
      const disc = b * b - c;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        const t = -b - sq >= 0 ? -b - sq : -b + sq;
        if (t >= 0) {
          out[0] = ox + t * dx;
          out[1] = oy + t * dy;
          out[2] = oz + t * dz;
          return 1;
        }
      }
      if (Math.abs(dz) > 1e-5) {
        const t = -oz / dz;
        if (t > 0) {
          out[0] = ox + t * dx;
          out[1] = oy + t * dy;
          out[2] = 0;
          const d = Math.hypot(out[0], out[1], out[2]);
          return d < 1.9 ? Math.max(0, 1 - (d - 1.1) / 0.8) : 0;
        }
      }
      return 0;
    };

    // Pointer gestures
    const pts = new Map<number, { x: number; y: number }>();
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let holdTimer = 0;
    let pinchD = 0;
    let pinched = false;
    let lastMoveT = 0;
    const hit: [number, number, number] = [9, 9, 9];

    const onPointerDown = (e: PointerEvent) => {
      const mode = propsRef.current.interactive;
      if (mode === "none") return;
      const s = simRef.current;
      const isTouch = e.pointerType !== "mouse";

      if (mode === "full") {
        canvas.focus({ preventScroll: true });
      }
      if (mode === "full" || !isTouch) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture errors on synthetic events
        }
      }

      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === "full" && pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinchD = Math.hypot(a.x - b.x, a.y - b.y);
        pinched = true;
        window.clearTimeout(holdTimer);
        s.charging = false;
        s.dragging = false;
        return;
      }
      if (pts.size > 2) return;

      pinched = false;
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
      s.dragging = false;
      s.velX = 0;
      s.velY = 0;
      s.pointerTarget = pointerToWorld(e.clientX, e.clientY, hit);
      s.uPointer = [hit[0], hit[1], hit[2]];

      // In "hero" mode, no hold-to-charge on touch
      if (!(mode === "hero" && isTouch)) {
        holdTimer = window.setTimeout(() => {
          if (!s.dragging && !pinched) startCharge();
        }, 280);
      }
      setIsBusy(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      const mode = propsRef.current.interactive;
      if (mode === "none") return;
      const s = simRef.current;
      const isTouch = e.pointerType !== "mouse";
      const prev = pts.get(e.pointerId);

      if (mode === "full" && pts.size >= 2 && prev) {
        prev.x = e.clientX;
        prev.y = e.clientY;
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD && d) {
          s.zoomTarget = clamp(s.zoomTarget * (pinchD / d), ZMIN, ZMAX);
          if (propsRef.current.reducedMotion) {
            s.zoom = s.zoomTarget;
            renderScene();
          }
        }
        pinchD = d;
        setIsBusy(true);
        return;
      }

      s.pointerTarget = pointerToWorld(e.clientX, e.clientY, hit);
      s.uPointer = [hit[0], hit[1], hit[2]];

      if (prev && !pinched) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        prev.x = e.clientX;
        prev.y = e.clientY;
        const totalDx = Math.abs(e.clientX - downX);
        const totalDy = Math.abs(e.clientY - downY);

        if (!s.dragging && Math.hypot(totalDx, totalDy) > 6) {
          // In "hero" mode, only horizontal touch drags spin
          if (mode === "hero" && isTouch && totalDy > totalDx) {
            window.clearTimeout(holdTimer);
            s.charging = false;
            pts.delete(e.pointerId);
            return;
          }
          s.dragging = true;
          window.clearTimeout(holdTimer);
          canvas.style.cursor = "grabbing";
          s.charging = false;
        }
        if (s.dragging) {
          const k = 0.0055;
          s.quat = quatRotateOnWorldAxis(s.quat, 0, 1, 0, dx * k);
          if (!(mode === "hero" && isTouch)) {
            s.quat = quatRotateOnWorldAxis(s.quat, 1, 0, 0, dy * k);
          }
          const now = performance.now();
          const dt = Math.max(8, now - lastMoveT) / 1000;
          lastMoveT = now;
          const vxTarget = mode === "hero" && isTouch ? 0 : (dy * k) / dt;
          const vyTarget = (dx * k) / dt;
          s.velX = s.velX + (vxTarget - s.velX) * 0.5;
          s.velY = s.velY + (vyTarget - s.velY) * 0.5;
          if (propsRef.current.reducedMotion) {
            renderScene();
          }
        }
      }

      s.lastInteract = s.clock;
      if (!propsRef.current.reducedMotion) {
        setIsBusy(true);
      }
    };

    const endPointer = (e: PointerEvent) => {
      const wasDown = pts.delete(e.pointerId);
      if (pts.size > 0) {
        pinchD = 0;
        return;
      }
      window.clearTimeout(holdTimer);
      canvas.style.cursor = propsRef.current.interactive === "none" ? "default" : "grab";
      if (!wasDown) return;
      const s = simRef.current;
      const at: [number, number, number] | null = s.pointerTarget > 0.2 ? [hit[0], hit[1], hit[2]] : null;
      if (!pinched) {
        if (s.charging) releaseCharge(at);
        else if (!s.dragging && performance.now() - downT < 280 && e.type === "pointerup") triggerStrike(at, false);
      }
      s.charging = false;
      if (e.pointerType !== "mouse") s.pointerTarget = 0;
      if (performance.now() - lastMoveT > 90) {
        s.velX *= 0.2;
        s.velY *= 0.2;
      }
      s.dragging = false;
      pinched = false;
      if (!propsRef.current.reducedMotion) {
        setIsBusy(true);
      }
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) {
        simRef.current.pointerTarget = 0;
        if (!propsRef.current.reducedMotion) {
          setIsBusy(true);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (propsRef.current.interactive !== "full") return;
      e.preventDefault();
      const s = simRef.current;
      s.zoomTarget = clamp(s.zoomTarget * Math.exp(e.deltaY * 0.0012), ZMIN, ZMAX);
      if (propsRef.current.reducedMotion) {
        s.zoom = s.zoomTarget;
        renderScene();
      } else {
        setIsBusy(true);
      }
    };

    // Keyboard controls on the focused canvas
    let spaceDown = false;
    let keyHold = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (propsRef.current.interactive !== "full") return;
      const s = simRef.current;
      if (e.key === "ArrowLeft") s.velY -= 1.6;
      else if (e.key === "ArrowRight") s.velY += 1.6;
      else if (e.key === "ArrowUp") s.velX -= 1.6;
      else if (e.key === "ArrowDown") s.velX += 1.6;
      else if (e.key === "+" || e.key === "=") s.zoomTarget = Math.max(ZMIN, s.zoomTarget - 0.18);
      else if (e.key === "-" || e.key === "_") s.zoomTarget = Math.min(ZMAX, s.zoomTarget + 0.18);
      else if (e.key === " " || e.key === "Enter") {
        if (!spaceDown) {
          spaceDown = true;
          keyHold = window.setTimeout(startCharge, 280);
        }
      } else if (e.key === "p" || e.key === "P") {
        propsRef.current.onTogglePause?.();
      } else {
        return;
      }
      e.preventDefault();
      s.lastInteract = s.clock;
      if (propsRef.current.reducedMotion) {
        s.quat = quatRotateOnWorldAxis(s.quat, 1, 0, 0, s.velX * 0.12);
        s.quat = quatRotateOnWorldAxis(s.quat, 0, 1, 0, s.velY * 0.12);
        s.velX = 0;
        s.velY = 0;
        s.zoom = s.zoomTarget;
        renderScene();
      } else {
        setIsBusy(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.key !== " " && e.key !== "Enter") || !spaceDown) return;
      window.clearTimeout(keyHold);
      spaceDown = false;
      if (simRef.current.charging) releaseCharge(null);
      else triggerStrike(null, false);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", onPointerLeave);
    if (propsRef.current.interactive === "full") {
      canvas.addEventListener("wheel", onWheel, { passive: false });
      canvas.addEventListener("keydown", onKeyDown);
      canvas.addEventListener("keyup", onKeyUp);
    }

    try {
      const surface = createSurface(canvas, {
        maxDpr,
        scale: 1.0,
        onContextLost: () => {
          canvas.style.display = "none";
          propsRef.current.onContextLost?.();
        },
        onContextRestored: () => {
          canvas.style.display = "block";
          if (surfaceRef.current) {
            setupResources(surfaceRef.current);
            renderScene();
          }
          propsRef.current.onContextRestored?.();
        },
      }); // @frictionborn-guard

      surfaceRef.current = surface;
      setupResources(surface);
      stepSim(0);
      renderScene();
    } catch (err) {
      console.warn("EmberCore WebGL2 initialization failed; falling back to poster", err);
      if (surfaceRef.current) {
        surfaceRef.current.dispose(); // @frictionborn-guard
        surfaceRef.current = null;
      }
      propsRef.current.onContextLost?.();
    }

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(keyHold);
      window.clearTimeout(reducedMotionFlareTimer);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);

      if (surfaceRef.current) {
        const gl = surfaceRef.current.gl;
        if (!gl.isContextLost()) {
          deleteFbos(gl);
          if (fPosBuf) gl.deleteBuffer(fPosBuf);
          if (fSeedBuf) gl.deleteBuffer(fSeedBuf);
          if (gPosBuf) gl.deleteBuffer(gPosBuf);
          if (gSeedBuf) gl.deleteBuffer(gSeedBuf);
          if (tPosBuf) gl.deleteBuffer(tPosBuf);
          if (fVao) gl.deleteVertexArray(fVao);
          if (gVao) gl.deleteVertexArray(gVao);
          if (tVao) gl.deleteVertexArray(tVao);
        }
        surfaceRef.current.dispose(); // @frictionborn-guard
        surfaceRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.close().catch(() => {});
        audioRef.current = null;
      }
      canvas.remove();
    };
  }, [isTier2, maxDpr, interactive]);

  const loopActive = !suspended && !reducedMotion && (!paused || isBusy);

  // Frame rate monitoring and automated downgrade (Tier 2 falls back to no bloom first if frame budget fails)
  useFrameGuard({
    onDowngrade: () => {
      if (isTier2 && bloom && !tier2BloomOff) {
        setTier2BloomOff(true);
      } else {
        onDowngrade?.();
      }
    },
    active: loopActive,
  }); // @frictionborn-guard

  useFrame(
    ({ dt }) => {
      const stepDt = Math.min(0.05, dt * 0.001);
      stepSimRef.current(stepDt);
    },
    { active: loopActive } // @frictionborn-guard
  );

  return (
    <div
      ref={containerRef}
      className="fb-ec-gl-wrap"
      aria-hidden={interactive === "full" ? undefined : "true"}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: interactive === "none" ? "none" : "auto",
        zIndex: 1,
        visibility: suspended ? "hidden" : "visible",
      }}
    />
  );
}
