// Original — Frictionborn Motion canvas kit: the drawing helpers of the Frictionborn component lab (round 4), shared by the 2D-canvas items
/**
 * `@frictionborn/runtime/canvas`. The lab components (owner prototypes, `_reference/prototypes/components`) all draw with one small kit:
 * colour ramps, value noise, a canvas that fills its parent, a pointer tracker and three particle pools (sparks, smoke, flame blobs).
 * The registry items port those components, so they share this kit instead of each carrying a copy. Everything here is plain
 * drawing code: no frame loop (items tick from `useFrame`), no globals, and every listener or observer is removed by `dispose()`.
 */

export type RGB = [number, number, number];
/** a colour ramp: [position 0..1, colour] stops, cold to white-hot */
export type Ramp = ReadonlyArray<readonly [number, RGB]>;

export const TAU = Math.PI * 2;
export const rand = (a: number, b: number): number => a + Math.random() * (b - a);
export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------- colour ----------
/** the lab's blackbody ramp: the `fire` palette */
export const BB: Ramp = [[0, [12, 2, 1]], [0.18, [110, 14, 3]], [0.38, [214, 66, 10]], [0.58, [255, 140, 30]], [0.78, [255, 210, 120]], [1, [255, 250, 235]]];

export function ramp(stops: Ramp, t: number): RGB {
  t = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i++)
    if (t <= stops[i][0]) {
      const [t0, a] = stops[i - 1], [t1, b] = stops[i], k = (t - t0) / (t1 - t0);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
  return stops[stops.length - 1][1] as RGB;
}
/**
 * The ramp an item draws with for a palette (see `readPalette` in the core entry). `fire` is the lab's blackbody ramp itself, so the
 * default look matches the lab exactly; any other palette spreads its five colours evenly from cold to white-hot.
 */
export function paletteRamp(name: string, colors: ReadonlyArray<ArrayLike<number>>): Ramp {
  if (name === "fire" || colors.length < 2) return BB;
  return colors.map((c, i) => [i / (colors.length - 1), [c[0], c[1], c[2]] as RGB] as const);
}
export const css = (c: ArrayLike<number>, a = 1): string => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
/** a colour from a ramp as a CSS string (the lab's `bb(t, a)` when the ramp is BB) */
export const heat = (stops: Ramp, t: number, a = 1): string => css(ramp(stops, t), a);

// ---------- value noise (one permutation per page, like the lab) ----------
let P: Uint8Array | null = null;
function perm(): Uint8Array {
  if (P) return P;
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  P = new Uint8Array(512);
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  return P;
}
const fade = (t: number) => t * t * (3 - 2 * t);
export function noise(x: number, y: number): number {
  const p = perm();
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
  const h = (i: number, j: number) => p[p[X + i] + Y + j] / 255;
  const u = fade(xf), v = fade(yf);
  return lerp(lerp(h(0, 0), h(1, 0), u), lerp(h(0, 1), h(1, 1), u), v);
}

/** fractal value noise (the lab's `fbm`) */
export function fbm(x: number, y: number, o = 4): number {
  let v = 0, a = 0.5;
  for (let i = 0; i < o; i++) {
    v += a * noise(x, y);
    x = x * 2.03 + 17;
    y = y * 2.03 + 9;
    a *= 0.5;
  }
  return v;
}

// ---------- disposal ----------
/** collects the cleanups of one mounted component */
export class Disposer {
  private fns: Array<() => void> = [];
  add(fn: () => void): void {
    this.fns.push(fn);
  }
  /** addEventListener that is removed on dispose */
  on<K extends keyof HTMLElementEventMap>(el: HTMLElement | Window, type: K | string, fn: (e: HTMLElementEventMap[K]) => void, opt?: AddEventListenerOptions): void {
    el.addEventListener(type, fn as EventListener, opt);
    this.add(() => el.removeEventListener(type, fn as EventListener, opt));
  }
  dispose(): void {
    for (const fn of this.fns.splice(0).reverse()) fn();
  }
}

// ---------- a canvas that fills its parent ----------
export interface FitCanvas {
  cv: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
  fit: () => void;
  onResize: (f: (c: FitCanvas) => void) => FitCanvas;
}
export interface FitCanvasOptions {
  /** CSS appended to the canvas's inline style */
  style?: string;
  /** insert before the parent's first child (a backdrop) instead of appending */
  before?: boolean;
  /** device-pixel-ratio ceiling (tier 2 passes 1.5) */
  maxDpr?: number;
  className?: string;
}
/** Creates a decorative (aria-hidden) canvas that tracks its parent's size; removed, with its observer, on dispose. */
export function fitCanvas(parent: HTMLElement, d: Disposer, opt: FitCanvasOptions = {}): FitCanvas | null {
  const cv = document.createElement("canvas");
  cv.className = opt.className ?? "fb-cv";
  cv.setAttribute("aria-hidden", "true");
  if (opt.style) cv.style.cssText += opt.style;
  if (opt.before) parent.insertBefore(cv, parent.firstChild);
  else parent.appendChild(cv);
  const g = cv.getContext("2d");
  if (!g) {
    cv.remove();
    return null;
  }
  const cbs: Array<(c: FitCanvas) => void> = [];
  const o: FitCanvas = {
    cv,
    g,
    w: 0,
    h: 0,
    dpr: 1,
    fit: () => {},
    onResize(f) {
      cbs.push(f);
      return o;
    },
  };
  o.fit = () => {
    const r = parent.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    const dpr = Math.min(window.devicePixelRatio || 1, opt.maxDpr ?? 2);
    if (w === o.w && h === o.h && dpr === o.dpr) return;
    o.w = w;
    o.h = h;
    o.dpr = dpr;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cbs.forEach((f) => f(o));
  };
  o.fit();
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => o.fit()) : null;
  ro?.observe(parent);
  d.add(() => {
    ro?.disconnect();
    cv.remove();
  });
  return o;
}

/** marks `el` with `data-drawn` while the drawing is mounted (items hide their server fallback with it), removed on dispose */
export function markDrawn(el: Element, d: Disposer): void {
  el.setAttribute("data-drawn", "");
  d.add(() => el.removeAttribute("data-drawn"));
}

/**
 * The usual start of a canvas item: a disposer and a canvas filling `fx`, at DPR <= 2 for tier 3 and <= 1.5 below. With `drawn`, that
 * element carries `data-drawn` while the canvas is mounted (items hide their server fallback with it).
 */
export function stage(fx: HTMLElement, tier: number, drawn?: Element): { d: Disposer; c: FitCanvas } | null {
  const d = new Disposer();
  const c = fitCanvas(fx, d, { maxDpr: tier >= 3 ? 2 : 1.5 });
  if (!c) {
    d.dispose();
    return null;
  }
  if (drawn) markDrawn(drawn, d);
  return { d, c };
}

export function offscreen(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w | 0);
  c.height = Math.max(1, h | 0);
  return [c, c.getContext("2d") as CanvasRenderingContext2D];
}

// ---------- pointer tracked relative to an element ----------
export interface Pointer {
  x: number;
  y: number;
  in: boolean;
  down: boolean;
  vx: number;
  vy: number;
  speed: number;
  t: number;
  moved: number;
  decay: (dt: number) => void;
}
export interface PointerOptions {
  capture?: boolean;
  move?: (p: Pointer, e: PointerEvent) => void;
  down?: (p: Pointer, e: PointerEvent) => void;
  up?: (p: Pointer, e: PointerEvent) => void;
}
export function trackPointer(el: HTMLElement, d: Disposer, opt: PointerOptions = {}): Pointer {
  const p: Pointer = { x: 0, y: 0, in: false, down: false, vx: 0, vy: 0, speed: 0, t: 0, moved: 0, decay: () => {} };
  const upd = (e: PointerEvent) => {
    const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    const dt = Math.max(8, now - (p.t || now - 16)) / 1000;
    if (p.in) {
      p.vx = p.vx * 0.4 + ((x - p.x) / dt) * 0.6;
      p.vy = p.vy * 0.4 + ((y - p.y) / dt) * 0.6;
      p.moved += Math.hypot(x - p.x, y - p.y);
    }
    p.x = x;
    p.y = y;
    p.t = now;
    p.speed = Math.hypot(p.vx, p.vy);
  };
  d.on(el, "pointerenter", (e: PointerEvent) => {
    p.t = 0;
    p.in = true;
    upd(e);
    p.vx = p.vy = 0;
  });
  d.on(el, "pointermove", (e: PointerEvent) => {
    if (!p.in) {
      p.in = true;
      p.t = 0;
    }
    upd(e);
    opt.move?.(p, e);
  });
  d.on(el, "pointerleave", (e: PointerEvent) => {
    if (e.pointerType === "mouse" || !p.down) p.in = false;
  });
  d.on(el, "pointerdown", (e: PointerEvent) => {
    p.in = true;
    upd(e);
    p.vx = p.vy = 0;
    p.down = true;
    if (opt.capture) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* the pointer is already gone */
      }
    }
    opt.down?.(p, e);
  });
  const up = (e: PointerEvent) => {
    if (!p.down) return;
    p.down = false;
    opt.up?.(p, e);
    if (e.pointerType !== "mouse") p.in = false;
  };
  d.on(el, "pointerup", up);
  d.on(el, "pointercancel", up);
  d.on(window, "pointerup", up);
  p.decay = (dt) => {
    const k = Math.exp(-dt * 7);
    p.vx *= k;
    p.vy *= k;
    p.speed = Math.hypot(p.vx, p.vy);
  };
  return p;
}

// ---------- sparks ----------
/** a spark's colour: 0 the lab's fire curve, 1 its blue curve, or an RGB that fades from white-hot to that colour */
export type SparkColor = 0 | 1 | RGB;
interface Spark { x: number; y: number; px: number; py: number; vx: number; vy: number; l: number; m: number; w: number; g: number; d: number; pal: SparkColor }
export interface BurstOptions { dir?: number; spread?: number; l0?: number; l1?: number; w0?: number; w1?: number; grav?: number; drag?: number; pal?: SparkColor }
/**
 * Line sparks, drawn additively. With no ramp they use the lab's own colours exactly (per spark: fire, blue, or a given colour); with a
 * ramp (a palette other than fire) every spark follows the same white-hot-to-cool curve along that ramp.
 */
export class Sparks {
  a: Spark[] = [];
  constructor(public max = 700, public pal: Ramp | null = null) {}
  add(x: number, y: number, vx: number, vy: number, life = 0.6, w = 1.2, grav = 600, drag = 1.4, pal: SparkColor = 0): void {
    if (this.a.length >= this.max) return;
    this.a.push({ x, y, px: x, py: y, vx, vy, l: 0, m: life, w, g: grav, d: drag, pal });
  }
  burst(x: number, y: number, n: number, s0: number, s1: number, o: BurstOptions = {}): void {
    for (let i = 0; i < n; i++) {
      const a = (o.dir ?? -Math.PI / 2) + rand(-(o.spread ?? Math.PI), o.spread ?? Math.PI), v = rand(s0, s1);
      this.add(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(o.l0 ?? 0.3, o.l1 ?? 0.8), rand(o.w0 ?? 0.8, o.w1 ?? 1.6), o.grav ?? 600, o.drag ?? 1.4, o.pal ?? 0);
    }
  }
  step(dt: number): void {
    const a = this.a;
    for (let i = a.length - 1; i >= 0; i--) {
      const s = a[i];
      s.l += dt;
      if (s.l >= s.m) {
        a[i] = a[a.length - 1];
        a.pop();
        continue;
      }
      s.px = s.x;
      s.py = s.y;
      const k = Math.exp(-s.d * dt);
      s.vx *= k;
      s.vy = s.vy * k + s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
  }
  draw(g: CanvasRenderingContext2D, scale = 1): void {
    g.save();
    g.globalCompositeOperation = "lighter";
    g.lineCap = "round";
    for (const s of this.a) {
      const f = 1 - s.l / s.m;
      let c: string;
      if (this.pal) c = heat(this.pal, 0.55 + 0.45 * f * f, Math.min(1, f * 1.4));
      else if (s.pal === 1) c = `rgba(${(140 + 115 * f * f) | 0},${(190 + 65 * f) | 0},255,${Math.min(1, f * 1.4)})`;
      else if (Array.isArray(s.pal)) {
        const h = Math.max(0, 1 - s.l * 4), q = s.pal;
        c = `rgba(${(q[0] + (255 - q[0]) * h) | 0},${(q[1] + (255 - q[1]) * h) | 0},${(q[2] + (255 - q[2]) * h) | 0},${Math.min(1, f * 1.5)})`;
      } else c = `rgba(255,${(110 + 140 * f * f) | 0},${(30 + 180 * f * f * f) | 0},${Math.min(1, f * 1.4)})`;
      g.strokeStyle = c;
      g.lineWidth = s.w * (0.5 + f) * scale;
      g.beginPath();
      g.moveTo(s.px, s.py);
      g.lineTo(s.x + (s.x - s.px) * 0.5, s.y + (s.y - s.py) * 0.5);
      g.stroke();
    }
    g.restore();
  }
  get n(): number {
    return this.a.length;
  }
}

// ---------- smoke ----------
interface Puff { x: number; y: number; r: number; vx: number; vy: number; a: number; age: number; life: number; grow: number; c: RGB; rot: number }
export interface PuffOptions { vx?: number; vy?: number; a?: number; life?: number; grow?: number; c?: RGB }
export class Smoke {
  a: Puff[] = [];
  constructor(public max = 160) {}
  add(x: number, y: number, r = 10, o: PuffOptions = {}): void {
    if (this.a.length < this.max)
      this.a.push({ x, y, r, vx: o.vx ?? rand(-8, 8), vy: o.vy ?? rand(-40, -20), a: o.a ?? 0.22, age: 0, life: o.life ?? rand(2, 3.4), grow: o.grow ?? 22, c: o.c ?? [150, 142, 136], rot: rand(0, TAU) });
  }
  step(dt: number, wind = 0): void {
    for (let i = this.a.length - 1; i >= 0; i--) {
      const m = this.a[i];
      m.age += dt;
      if (m.age > m.life) {
        this.a.splice(i, 1);
        continue;
      }
      m.x += (m.vx + wind + Math.sin(m.age * 2 + m.rot) * 6) * dt;
      m.y += m.vy * dt;
      m.vy *= Math.exp(-dt * 0.4);
      m.r += m.grow * dt;
    }
  }
  draw(g: CanvasRenderingContext2D): void {
    for (const m of this.a) {
      const k = m.age / m.life, a = m.a * Math.min(1, m.age * 4) * (1 - k);
      const gr = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      gr.addColorStop(0, css(m.c, a));
      gr.addColorStop(0.6, css(m.c, a * 0.45));
      gr.addColorStop(1, css(m.c, 0));
      g.fillStyle = gr;
      g.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
  }
  get n(): number {
    return this.a.length;
  }
}

// ---------- soft additive flame blobs ----------
interface Blob { x: number; y: number; r: number; vx: number; vy: number; l: number; m: number; h: number; s: number }
export class Fire {
  a: Blob[] = [];
  constructor(public max = 420) {}
  add(x: number, y: number, r: number, vx = 0, vy = -60, life = 0.8, h = 1): void {
    if (this.a.length < this.max) this.a.push({ x, y, r, vx, vy, l: 0, m: life, h, s: rand(0, 6) });
  }
  step(dt: number, buoy = -90, wind = 0): void {
    for (let i = this.a.length - 1; i >= 0; i--) {
      const b = this.a[i];
      b.l += dt;
      if (b.l >= b.m) {
        this.a[i] = this.a[this.a.length - 1];
        this.a.pop();
        continue;
      }
      b.vy += buoy * dt;
      b.vx += (wind + Math.sin(b.l * 9 + b.s) * 30) * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.r *= Math.exp(-dt * 0.9);
    }
  }
  draw(g: CanvasRenderingContext2D, pal: Ramp = BB, alpha = 0.5): void {
    g.save();
    g.globalCompositeOperation = "lighter";
    for (const b of this.a) {
      const k = b.l / b.m, c = ramp(pal, b.h * (1 - k) * 0.98), a = alpha * (1 - k) * Math.min(1, b.l * 12);
      const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      gr.addColorStop(0, css(c, a));
      gr.addColorStop(1, css(c, 0));
      g.fillStyle = gr;
      g.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    g.restore();
  }
  get n(): number {
    return this.a.length;
  }
}

// ---------- text ----------
export const fontStr = (px: number, weight = 900, fam = "'Archivo', 'Geist', sans-serif"): string => `${weight} ${px}px ${fam}`;
export function fitText(g: CanvasRenderingContext2D, text: string, maxW: number, maxPx: number, weight?: number, fam?: string): number {
  let px = maxPx;
  g.font = fontStr(px, weight, fam);
  const w = g.measureText(text).width;
  if (w > maxW) px = Math.floor((px * maxW) / w);
  return px;
}
export interface TextMaskOptions { weight?: number; fam?: string; px?: number; fill?: number; maxPx?: number; ls?: number; lh?: number; cx?: number; cy?: number }
export interface TextMask { w: number; h: number; px: number; inside: (x: number, y: number) => boolean; points: (step?: number) => Array<[number, number]> }
/** an alpha mask of centred text at 1 CSS px: `inside(x, y)` and evenly spaced sample points (jittered by ±1 px, like the lab) */
export function textMask(lines: string | string[], w: number, h: number, opt: TextMaskOptions = {}): TextMask {
  const [, x] = offscreen(w, h);
  const weight = opt.weight ?? 900, fam = opt.fam ?? "'Archivo', 'Geist', sans-serif";
  const L = Array.isArray(lines) ? lines : [lines];
  let px = opt.px || 9999;
  for (const s of L) px = Math.min(px, fitText(x, s, w * (opt.fill ?? 0.86), opt.maxPx ?? (h * 0.7) / L.length, weight, fam));
  x.font = fontStr(px, weight, fam);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff";
  try {
    (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = (opt.ls ?? -0.02) * px + "px";
  } catch {
    /* older engines: no letter spacing */
  }
  const lh = px * (opt.lh ?? 0.98), y0 = (opt.cy ?? h / 2) - (lh * (L.length - 1)) / 2;
  L.forEach((s, i) => x.fillText(s, opt.cx ?? w / 2, y0 + i * lh));
  const d = x.getImageData(0, 0, w, h).data, data = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = d[i * 4 + 3];
  const inside = (X: number, Y: number) => {
    X |= 0;
    Y |= 0;
    return X >= 0 && Y >= 0 && X < w && Y < h && data[Y * w + X] > 127;
  };
  const points = (step = 4) => {
    const out: Array<[number, number]> = [];
    for (let y = 0; y < h; y += step) for (let X = 0; X < w; X += step) if (data[y * w + X] > 127) out.push([X + rand(-1, 1), y + rand(-1, 1)]);
    return out;
  };
  return { w, h, px, inside, points };
}

/** the box of `el` relative to `root`, in CSS px */
export function relBox(el: Element, root: Element): { x: number; y: number; w: number; h: number } {
  const r = el.getBoundingClientRect(), q = root.getBoundingClientRect();
  return { x: r.left - q.left, y: r.top - q.top, w: r.width, h: r.height };
}
