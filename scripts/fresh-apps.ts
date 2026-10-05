// Original — Frictionborn Motion repeatable fresh-app verification (nightly + on tags)
//
// What this does, for real (nothing is mocked or copied from a template of ours):
//   1. Scaffolds a Next 16 app with the OFFICIAL `create-next-app` and a Vite React app with the OFFICIAL
//      `create-vite`, in a temp directory OUTSIDE this repo (Vite gets the documented shadcn Tailwind + alias steps).
//   2. Runs `shadcn init` in each, then `shadcn add <url>` for every public item from the LOCAL registry (public/r),
//      with the freshly packed @frictionborn/runtime (it is not on npm yet).
//   3. Builds production bundles (`next build`, `tsc -b && vite build` under the template's strict tsconfig) and serves
//      them with the frameworks' own production servers (`next start`, `vite preview`).
//   4. Drives them in real Chromium (SwiftShader WebGL2): light, dark, 390 px touch, reduced motion.
//      Pixels are read back from the WebGL framebuffer at draw time, and DistortionImage is compared against the
//      real <img> it sits on. The pixel gate is first proven to REJECT blank canvases (negative controls).
//   Tool versions: official generators/CLI at their `latest` (Next: `16`), so this also catches upstream breakage.
//   Override with FRESH_CREATE_NEXT_APP / FRESH_CREATE_VITE / FRESH_SHADCN.

import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { buildRegistry } from "./build-registry.ts";

const execAsync = promisify(exec);

const CREATE_NEXT_APP = process.env.FRESH_CREATE_NEXT_APP ?? "create-next-app@16.3.8";
const CREATE_VITE = process.env.FRESH_CREATE_VITE ?? "create-vite@8.3.0";
const SHADCN = process.env.FRESH_SHADCN ?? "shadcn@4.21.1";

const REGISTRY_PORT = 3197;
const NEXT_PORT = 3301;
const VITE_PORT = 3302;
const VITE_DEV_PORT = 3303;

// FRESH_ONLY=ambient-hero,scroll-showcase installs just those items (shadcn must pull their registryDependencies itself).
// FRESH_KEEP=1 leaves the temp apps and both production servers running and prints their PIDs (for manual/audit probes).
const FRESH_ONLY = (process.env.FRESH_ONLY ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const FRESH_KEEP = process.env.FRESH_KEEP === "1";
const NO_GL = process.argv.includes("--no-gl") || process.env.FRESH_NO_GL === "1";

const NON_CORS_URL = "https://cdn.fresh-noncors.test/art-1.webp";

async function run(cmd: string, cwd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1", npm_config_yes: "true" },
    });
    return stdout + stderr;
  } catch (err: any) {
    const tail = `${err.stdout ?? ""}\n${err.stderr ?? ""}`.split("\n").slice(-60).join("\n");
    throw new Error(`Command failed: ${cmd}\n(cwd ${cwd})\n${tail}`);
  }
}

function killTree(proc: ChildProcess): void {
  if (!proc.pid) return;
  try {
    if (process.platform === "win32") {
      exec(`taskkill /pid ${proc.pid} /T /F`);
    } else {
      process.kill(-proc.pid, "SIGKILL");
    }
  } catch {
    try {
      proc.kill();
    } catch {
      // already gone
    }
  }
}

function startServer(cmd: string, cwd: string): ChildProcess {
  return spawn(cmd, {
    cwd,
    shell: true,
    stdio: "ignore",
    detached: process.platform !== "win32",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
}

/** A stale server from an earlier run would answer our health check and silently get tested instead of the new app. */
async function assertPortFree(port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () => reject(new Error(`Port ${port} is already in use (a leftover server from an earlier run?). Free it and retry.`)));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve()));
  });
}

async function waitForServer(url: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on("error", reject);
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function installedVersion(appDir: string, pkg: string): string {
  try {
    return readJson(path.join(appDir, "node_modules", pkg, "package.json")).version;
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The page every app renders: every public item with DEFAULT props (src/alt/size are required, nothing else is set).
// ---------------------------------------------------------------------------------------------------------------

type Framework = "next" | "vite";

function generatePage(items: string[], framework: Framework): string {
  const has = (n: string) => items.includes(n);
  const next = framework === "next";
  const imports: string[] = [];
  if (next) imports.push('"use client";');
  if (next && has("distortion-image")) imports.push('import { getImageProps } from "next/image";');
  if (has("noise-field")) imports.push('import { NoiseField } from "@/components/ui/noise-field";');
  if (has("particle-field")) imports.push('import { ParticleField } from "@/components/ui/particle-field";');
  if (has("mesh-gradient")) imports.push('import { MeshGradient } from "@/components/ui/mesh-gradient";');
  if (has("text-reveal")) imports.push('import { TextReveal } from "@/components/ui/text-reveal";');
  if (has("scroll-reveal")) imports.push('import { ScrollReveal } from "@/components/ui/scroll-reveal";');
  if (has("magnetic-button")) imports.push('import { MagneticButton } from "@/components/ui/magnetic-button";');
  if (has("marquee")) imports.push('import { Marquee } from "@/components/ui/marquee";');
  if (has("smooth-scroll")) imports.push('import { SmoothScroll } from "@/components/ui/smooth-scroll";');
  if (has("sticky-scroll-story")) imports.push('import { StickyScrollStory } from "@/components/ui/sticky-scroll-story";');
  if (has("distortion-image")) imports.push('import { DistortionImage } from "@/components/ui/distortion-image";');
  if (has("ambient-hero")) imports.push('import { AmbientHero } from "@/components/ui/ambient-hero";');
  if (has("scroll-showcase")) imports.push('import { ScrollShowcase } from "@/components/ui/scroll-showcase";');

  const gl = (id: string, el: string) => `
        <div data-testid="gl-item-${id}" style={{ width: "100%", height: "260px", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
          ${el}
        </div>`;

  const nextImageSetup =
    next && has("distortion-image")
      ? `
  // The documented way to use next/image's optimiser with a plain <img>-based component.
  const { props: nextImg } = getImageProps({
    src: "/art-4.webp",
    alt: "Ocean wave crest study, via next/image",
    width: 600,
    height: 403,
    sizes: "(max-width: 640px) 100vw, 600px",
  });`
      : "";

  const nextImageCase =
    next && has("distortion-image")
      ? `
        <div data-testid="gl-item-distortion-next-image" style={{ display: "block", maxWidth: 600 }}>
          <DistortionImage src={nextImg.src} srcSet={nextImg.srcSet} sizes={nextImg.sizes} alt={nextImg.alt} width={600} height={403} style={{ width: "100%", maxWidth: 600, height: "auto" }} />
        </div>`
      : "";

  const distortionCases = has("distortion-image")
    ? `
        <div data-testid="gl-item-distortion-default" style={{ display: "block", maxWidth: 480 }}>
          <a href="#art-default" style={{ display: "block", textDecoration: "none" }}>
            <DistortionImage src="/art-1.webp" alt="Field Study in Golden Wheat" width={480} height={382} style={{ width: "100%", maxWidth: 480, height: "auto" }} />
          </a>
        </div>`
        ${nextImageCase}
        <div data-testid="item-distortion-cross-origin" style={{ display: "block", maxWidth: 320 }}>
          <DistortionImage src="${NON_CORS_URL}" alt="A picture served from a host that sends no CORS headers" width={320} height={255} style={{ width: "100%", maxWidth: 320, height: "auto" }} />
        </div>`
    : "";

  return `${imports.join("\n")}

export default function FreshAppView() {${nextImageSetup}
  const content = (
    <main style={{ boxSizing: "border-box", width: "100%", padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      ${
        has("ambient-hero")
          ? `<div data-testid="composition-ambient-hero" style={{ marginBottom: "2.5rem" }}>
              <AmbientHero
                headline="Acoustic precision, sculpted in aluminum."
                body="Near-field studio monitors engineered for uncoloured listening environments."
                primaryCta={{ label: "Explore engineering", href: "#engineering" }}
              />
            </div>`
          : ""
      }
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>Fresh app check</h1>
        <p style={{ color: "var(--muted-foreground)", margin: "0.5rem 0 0 0" }}>Every item, default props, real shadcn tokens.</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        ${has("text-reveal") ? `<div data-testid="item-text-reveal"><TextReveal as="h2">Words that arrive one line at a time</TextReveal></div>` : ""}
        ${has("marquee") ? `<div data-testid="item-marquee" style={{ overflow: "hidden" }}><Marquee><span style={{ padding: "0 1.5rem" }}>Alpha</span><span style={{ padding: "0 1.5rem" }}>Beta</span><span style={{ padding: "0 1.5rem" }}>Gamma</span></Marquee></div>` : ""}
        ${has("magnetic-button") ? `<div data-testid="item-magnetic-button"><MagneticButton><button type="button" style={{ minHeight: "44px", padding: "0 1.25rem", borderRadius: "6px", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", cursor: "pointer" }}>Get started</button></MagneticButton></div>` : ""}
        ${has("noise-field") ? gl("noise-field", "<NoiseField style={{ width: '100%', height: '100%' }} />") : ""}
        ${has("particle-field") ? gl("particle-field", "<ParticleField style={{ width: '100%', height: '100%' }} />") : ""}
        ${has("mesh-gradient") ? gl("mesh-gradient", "<MeshGradient style={{ width: '100%', height: '100%' }} />") : ""}
        ${distortionCases}
        ${has("scroll-reveal") ? `<div data-testid="item-scroll-reveal"><ScrollReveal><div style={{ padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }}>This card slides in as it scrolls into view.</div></ScrollReveal></div>` : ""}
        ${
          has("sticky-scroll-story")
            ? `<div data-testid="item-sticky-scroll-story"><StickyScrollStory steps={[
              { id: "one", title: "First step", description: "The first thing to say.", media: { content: <div style={{ padding: "2rem" }}>First</div> } },
              { id: "two", title: "Second step", description: "The second thing to say.", media: { content: <div style={{ padding: "2rem" }}>Second</div> } },
            ]} /></div>`
            : ""
        }
        ${
          has("scroll-showcase")
            ? `<div data-testid="composition-scroll-showcase">
                <ScrollShowcase
                  headline="Engineered for transparent acoustic reproduction"
                  description="Every component is milled, calibrated, and validated to laboratory standards."
                  steps={[
                    {
                      id: "enclosure",
                      title: "Monolithic Enclosure",
                      description: "6061-T6 aluminum chassis CNC-machined from solid billet.",
                      badge: "Structure",
                      media: { content: <div style={{ padding: "2rem" }}>Chassis</div> },
                    },
                    {
                      id: "driver",
                      title: "Beryllium Transducer",
                      description: "Ultra-low distortion dome with laser-interferometer precision.",
                      badge: "Acoustics",
                      media: { content: <div style={{ padding: "2rem" }}>Transducer</div> },
                    },
                  ]}
                />
              </div>`
            : ""
        }
      </div>
    </main>
  );

  return ${has("smooth-scroll") ? "<SmoothScroll>{content}</SmoothScroll>" : "content"};
}
`;
}

// ---------------------------------------------------------------------------------------------------------------
// Browser side: framebuffer readback at draw time, and the quality gate.
// ---------------------------------------------------------------------------------------------------------------

// A 2-vCPU CI runner reports hardwareConcurrency 2, which the runtime's tier gate reads as a low-end device (tier 1: no WebGL),
// so every GL check silently ran against posters on CI (nightly run 37302311390: "gl-item-mesh-gradient never showed a canvas",
// cores: 2). The Lighthouse gatherer emulates the audited phone for the same reason; the fresh-apps check measures a capable machine.
const CAPABLE_MACHINE_INIT_SCRIPT = `
  try {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  } catch (e) {}
`;

// When running in no-GL CI mode (e.g. 2-vCPU software GL runner), force tier 1 via data-fb-tier="1"
// so generative items render posters rather than churning software-GL canvases.
// The attribute must survive hydration: a Next app resets <html> attributes when it hydrates, which silently dropped a one-time
// setAttribute and left the tier at whatever the machine gives (tier 3 on a capable machine: hover then mounts canvases).
const NO_GL_INIT_SCRIPT = `
  (function () {
    var set = function () {
      var e = document.documentElement;
      if (e && e.getAttribute("data-fb-tier") !== "1") e.setAttribute("data-fb-tier", "1");
    };
    try {
      set();
      new MutationObserver(set).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-fb-tier"] });
    } catch (e) {}
  })();
`;

const READBACK_INIT_SCRIPT = `
(() => {
  window.__fbCapture = null;   // canvas we want a readback of
  window.__fbResults = new WeakMap();
  const readNow = (gl) => {
    const canvas = gl.canvas;
    if (window.__fbCapture !== canvas) return;
    window.__fbCapture = null;
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const buf = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let sum = 0, sumSq = 0, covered = 0;
    const n = w * h;
    for (let i = 0; i < buf.length; i += 4) {
      const v = (buf[i] + buf[i + 1] + buf[i + 2] + buf[i + 3]) / 4;
      sum += v; sumSq += v * v;
      if (buf[i + 3] > 0) covered++;
    }
    const mean = sum / n;
    // 16x16 block-averaged RGB (premultiplied -> un-premultiplied) for comparison with an <img>
    const G = 16, grid = new Float32Array(G * G * 3);
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      let r = 0, g = 0, b = 0, a = 0, c = 0;
      const x0 = Math.floor(gx * w / G), x1 = Math.floor((gx + 1) * w / G), y0 = Math.floor(gy * h / G), y1 = Math.floor((gy + 1) * h / G);
      for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
        const i = (y * w + x) * 4; r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3]; c++;
      }
      const al = Math.max(a / c, 1) / 255;
      const o = (gy * G + gx) * 3; // readPixels origin is bottom-left; flip rows so row 0 is the top
      const oo = ((G - 1 - gy) * G + gx) * 3;
      grid[oo] = Math.min(255, r / c / al); grid[oo + 1] = Math.min(255, g / c / al); grid[oo + 2] = Math.min(255, b / c / al);
    }
    window.__fbResults.set(canvas, { w, h, mean, std: Math.sqrt(Math.max(0, sumSq / n - mean * mean)), coverage: covered / n, grid: Array.from(grid) });
  };
  for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
    const orig = WebGL2RenderingContext.prototype[name];
    WebGL2RenderingContext.prototype[name] = function (...args) {
      const r = orig.apply(this, args);
      if (window.__fbCapture) { try { readNow(this); } catch (e) { /* context lost mid-read */ } }
      return r;
    };
  }
})();
`;

interface Readback {
  w: number;
  h: number;
  mean: number;
  std: number;
  coverage: number;
  grid: number[];
  imageDiff: number | null;
}

/** Ask the page for the next draw of this canvas and return its framebuffer stats (and diff vs the <img> under it). */
async function readCanvas(page: Page, wrapperSelector: string, compareToImg: boolean): Promise<Readback | null> {
  return page.evaluate(
    async ({ sel, compare }) => {
      const wrapper = document.querySelector(sel) as HTMLElement | null;
      const canvas = wrapper?.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas) return null;
      (window as any).__fbCapture = canvas;
      let res: any = null;
      for (let i = 0; i < 90 && !res; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        res = (window as any).__fbResults.get(canvas) ?? null;
      }
      if (!res) return null;
      let imageDiff: number | null = null;
      const img = wrapper?.querySelector("img") as HTMLImageElement | null;
      if (compare && img) {
        const G = 16;
        const off = document.createElement("canvas");
        off.width = G;
        off.height = G;
        const ctx = off.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, G, G);
        const d = ctx.getImageData(0, 0, G, G).data;
        let total = 0;
        for (let i = 0; i < G * G; i++) for (let c = 0; c < 3; c++) total += Math.abs(d[i * 4 + c] - res.grid[i * 3 + c]);
        imageDiff = total / (G * G * 3);
      }
      (window as any).__fbResults.delete(canvas);
      return { ...res, imageDiff };
    },
    { sel: wrapperSelector, compare: compareToImg }
  );
}

const GATE = { minStd: 2, minCoverage: 0.002, maxImageDiff: 30 };

function passesGate(r: Readback | null, compareToImg: boolean): boolean {
  if (!r) return false;
  if (r.std < GATE.minStd || r.coverage < GATE.minCoverage) return false;
  if (compareToImg && (r.imageDiff === null || r.imageDiff > GATE.maxImageDiff)) return false;
  return true;
}

/** Proves the gate is not vacuous: blank canvases of every kind MUST fail it. Throws if any passes. */
async function negativeControls(page: Page): Promise<string[]> {
  const lines: string[] = [];
  const cases: Array<{ name: string; clear: [number, number, number, number] }> = [
    { name: "transparent blank WebGL canvas", clear: [0, 0, 0, 0] },
    { name: "opaque black WebGL canvas", clear: [0, 0, 0, 1] },
    { name: "opaque mid-grey (cleared, nothing drawn)", clear: [0.5, 0.5, 0.5, 1] },
    { name: "opaque brand-blue fill", clear: [0.23, 0.51, 0.96, 1] },
  ];
  for (const c of cases) {
    await page.evaluate(
      ({ clear }) => {
        document.getElementById("nc-wrap")?.remove();
        const wrap = document.createElement("div");
        wrap.id = "nc-wrap";
        wrap.style.cssText = "position:fixed;left:0;top:0;width:200px;height:150px;z-index:-1";
        const img = document.createElement("img");
        img.alt = "";
        img.src = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150'><rect width='100' height='150' fill='red'/><rect x='100' width='100' height='150' fill='green'/></svg>");
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 150;
        wrap.append(img, canvas);
        document.body.append(wrap);
        const gl = canvas.getContext("webgl2")!;
        gl.clearColor(clear[0], clear[1], clear[2], clear[3]);
        const draw = () => {
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.POINTS, 0, 0);
        };
        (window as any).__ncTimer = setInterval(draw, 16);
      },
      { clear: c.clear }
    );
    const r = await readCanvas(page, "#nc-wrap", true);
    await page.evaluate(() => {
      clearInterval((window as any).__ncTimer);
      document.getElementById("nc-wrap")?.remove();
    });
    const passed = passesGate(r, true);
    lines.push(`${c.name}: std=${r?.std.toFixed(2)} coverage=${r?.coverage.toFixed(2)} imageDiff=${r?.imageDiff?.toFixed(0)} -> ${passed ? "PASSED (BAD)" : "rejected"}`);
    if (passed) throw new Error(`Pixel gate is vacuous: it accepted a ${c.name}`);
  }
  return lines;
}

// ---------------------------------------------------------------------------------------------------------------
// Checks per page load
// ---------------------------------------------------------------------------------------------------------------

interface Mode {
  id: "light" | "dark" | "390" | "reduced";
  mobile: boolean;
  dark: boolean;
  reduced: boolean;
}

const MODES: Mode[] = [
  { id: "light", mobile: false, dark: false, reduced: false },
  { id: "dark", mobile: false, dark: true, reduced: false },
  { id: "390", mobile: true, dark: false, reduced: false },
  { id: "reduced", mobile: false, dark: false, reduced: true },
];

const GENERATIVE = ["gl-item-noise-field", "gl-item-particle-field", "gl-item-mesh-gradient"];

/** What the page looked like when something timed out: enough to tell "WebGL unavailable" from "gated off" from "broken". */
async function describeItem(page: Page, testId: string): Promise<string> {
  const info = await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid='${id}']`) as HTMLElement | null;
    const probe = document.createElement("canvas").getContext("webgl2");
    return {
      found: !!el,
      canvases: el?.querySelectorAll("canvas").length ?? -1,
      rect: el ? Object.values(el.getBoundingClientRect().toJSON()).map((n) => Math.round(Number(n))) : null,
      itemAttrs: el?.querySelector("[data-frictionborn-item]")?.getAttributeNames().map((n) => n + "=" + el.querySelector("[data-frictionborn-item]")!.getAttribute(n)),
      htmlMotion: document.documentElement.getAttribute("data-motion"),
      htmlTier: document.documentElement.getAttribute("data-fb-tier"),
      webgl2: !!probe,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      pointerFine: matchMedia("(pointer: fine)").matches,
      cores: navigator.hardwareConcurrency,
      memory: (navigator as any).deviceMemory,
      saveData: (navigator as any).connection?.saveData,
    };
  }, testId);
  return JSON.stringify(info);
}

/** Run one check; a thrown timeout becomes a collected problem (with the page state) instead of aborting the whole mode. */
async function step(problems: string[], page: Page, name: string, testId: string | null, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err: any) {
    const first = String(err?.message ?? err).split(/\r?\n/)[0];
    problems.push(`${name}: ${first}${testId ? " | page: " + (await describeItem(page, testId).catch(() => "?")) : ""}`);
  }
}

async function activeElementIsDistortion(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return false;
    return (
      el.getAttribute("data-frictionborn-item") === "distortion-image" ||
      el.closest("[data-frictionborn-item='distortion-image']") !== null ||
      ((el.tagName === "A" || el.tagName === "BUTTON") && el.querySelector("[data-frictionborn-item='distortion-image']") !== null)
    );
  });
}

async function captureScreenshotWebp(page: Page, outPath: string): Promise<void> {
  try {
    const client = await page.context().newCDPSession(page);
    const { data } = await client.send("Page.captureScreenshot", {
      format: "webp",
      quality: 85,
      captureBeyondViewport: true,
    });
    fs.writeFileSync(outPath, Buffer.from(data, "base64"));
  } catch {
    await page.screenshot({ path: outPath.replace(/\.webp$/, ".png"), fullPage: true });
  }
}

interface Summary {
  app: string;
  mode: string;
  idleBusyPct: number | null;
  readbacks: Record<string, { std: number; coverage: number; imageDiff: number | null }>;
  consoleMessages: number;
}

async function checkPage(
  browser: Browser,
  app: { name: string; url: string },
  mode: Mode,
  items: string[],
  screenshotsDir: string,
  root: string
): Promise<Summary> {
  const hasDistortion = items.includes("distortion-image");
  const context: BrowserContext = await browser.newContext({
    viewport: mode.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mode.mobile ? 2 : 1,
    isMobile: mode.mobile,
    hasTouch: mode.mobile,
    colorScheme: mode.dark ? "dark" : "light",
    reducedMotion: mode.reduced ? "reduce" : "no-preference",
  });
  if (NO_GL) {
    await context.addInitScript(NO_GL_INIT_SCRIPT);
  } else {
    await context.addInitScript(CAPABLE_MACHINE_INIT_SCRIPT);
  }
  await context.addInitScript(READBACK_INIT_SCRIPT);
  // A cross-origin picture from a host that sends NO CORS headers (what a CDN without CORS looks like).
  const artwork = fs.readFileSync(path.join(root, "public", "assets", "distortion", "art-1.webp"));
  await context.route("https://cdn.fresh-noncors.test/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/webp", body: artwork })
  );

  const page = await context.newPage();
  const problems: string[] = [];
  const messages: string[] = [];
  page.on("pageerror", (err) => problems.push(`[pageerror] ${err.message}`));
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error") problems.push(`[console.error] ${msg.text()}`);
    else if (t === "warning") problems.push(`[console.warn] ${msg.text()}`);
    else messages.push(msg.text());
  });
  page.on("response", (res) => {
    if (res.status() >= 400) problems.push(`[http ${res.status()}] ${res.url()}`);
  });

  const label = `[${app.name}][${mode.id}]`;
  const summary: Summary = { app: app.name, mode: mode.id, idleBusyPct: null, readbacks: {}, consoleMessages: 0 };

  await page.goto(app.url, { waitUntil: "networkidle" });
  if (mode.dark) {
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(300);
  }

  if (mode.reduced || NO_GL) {
    // Reduced motion or no-GL mode: static poster / plain image everywhere, even while hovering and focusing.
    for (const id of [...GENERATIVE, "gl-item-distortion-default", "composition-ambient-hero"]) {
      const el = page.locator(`[data-testid='${id}']`);
      if (await el.count()) {
        await el.scrollIntoViewIfNeeded();
        await el.hover().catch(() => {});
      }
    }
    await page.waitForTimeout(1200);
    const canvases = await page.locator("canvas").count();
    console.log(`    ${NO_GL ? "no-GL mode (tier 1 posters)" : "reduced motion"}: ${canvases} canvases (expected 0)`);
    if (canvases !== 0) problems.push(`${label} ${canvases} canvases in ${NO_GL ? "no-GL mode" : "reduced motion"}`);
  } else {
    // 1. generative WebGL items: real pixels, not just "a canvas exists"
    for (const id of GENERATIVE) {
      if (!items.includes(id.replace("gl-item-", ""))) continue;
      const el = page.locator(`[data-testid='${id}']`);
      await el.evaluate((e) => e.scrollIntoView({ block: "start" }));
      try {
        await el.locator("canvas").waitFor({ state: "visible", timeout: 10000 });
      } catch {
        problems.push(`${label} ${id} never showed a canvas: ${await describeItem(page, id)}`);
        continue;
      }
      await page.waitForTimeout(500);
      const r = await readCanvas(page, `[data-testid='${id}']`, false);
      summary.readbacks[id] = { std: r?.std ?? 0, coverage: r?.coverage ?? 0, imageDiff: null };
      console.log(`    ${id}: std=${r?.std.toFixed(1)} coverage=${((r?.coverage ?? 0) * 100).toFixed(1)}%`);
      if (!passesGate(r, false)) problems.push(`${label} ${id} failed the pixel gate (blank or flat canvas): ${JSON.stringify(r && { std: r.std, coverage: r.coverage })}`);
    }

    // 1b. ambient-hero composition: real pixels on its ambient background canvas
    if (items.includes("ambient-hero")) {
      const compId = "composition-ambient-hero";
      const el = page.locator(`[data-testid='${compId}']`);
      if (await el.count()) {
        await el.evaluate((e) => e.scrollIntoView({ block: "start" }));
        try {
          await el.locator("canvas").waitFor({ state: "visible", timeout: 10000 });
        } catch {
          problems.push(`${label} ${compId} never showed a canvas: ${await describeItem(page, compId)}`);
        }
        await page.waitForTimeout(500);
        const r = await readCanvas(page, `[data-testid='${compId}']`, false);
        summary.readbacks[compId] = { std: r?.std ?? 0, coverage: r?.coverage ?? 0, imageDiff: null };
        console.log(`    ${compId}: std=${r?.std.toFixed(1)} coverage=${((r?.coverage ?? 0) * 100).toFixed(1)}%`);
        if (!passesGate(r, false)) problems.push(`${label} ${compId} failed the pixel gate (blank or flat canvas): ${JSON.stringify(r && { std: r.std, coverage: r.coverage })}`);
      }
    }
  }

  // 1c. scroll-showcase composition: semantic heading hierarchy
  if (items.includes("scroll-showcase")) {
    const showCaseId = "composition-scroll-showcase";
    const el = page.locator(`[data-testid='${showCaseId}']`);
    if (await el.count()) {
      await el.evaluate((e) => e.scrollIntoView({ block: "start" }));
      const headings = await el.locator("h2, h3, h4").count();
      console.log(`    ${showCaseId}: found ${headings} semantic headings`);
      if (headings < 3) problems.push(`${label} ${showCaseId} missing expected semantic headings (found ${headings})`);
    }
  }

  // 2. idle main thread with the generative items running in view
  if (!mode.mobile) {
    const first = GENERATIVE.find((g) => items.includes(g.replace("gl-item-", "")));
    if (first) await page.locator(`[data-testid='${first}']`).scrollIntoViewIfNeeded();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    await page.waitForTimeout(1000);
    const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
    await page.waitForTimeout(3000);
    const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
    const busy = ((m1.TaskDuration - m0.TaskDuration) / 3) * 100;
    summary.idleBusyPct = busy;
    console.log(`    idle main thread (items running in view): ${busy.toFixed(2)}%`);
    if (busy >= 10) problems.push(`${label} idle main-thread busy ${busy.toFixed(1)}% >= 10%`);
  }

  // 3. DistortionImage
  if (hasDistortion && !mode.reduced && !NO_GL) {
      const cases = ["gl-item-distortion-default", ...(app.name === "next" ? ["gl-item-distortion-next-image"] : [])];
      for (const id of cases) {
        await step(problems, page, `${label} ${id}`, id, async () => {
        const wrapper = page.locator(`[data-testid='${id}']`);
        await wrapper.scrollIntoViewIfNeeded({ timeout: 8000 });
        const sel = `[data-testid='${id}']`;
        if (mode.mobile) {
          await wrapper.tap();
          await page.waitForTimeout(1500);
          const n = await wrapper.locator("canvas").count();
          console.log(`    ${id}: touch -> ${n} canvases (expected 0), plain <img> visible=${await wrapper.locator("img").isVisible()}`);
          if (n !== 0) problems.push(`${label} ${id} created a canvas for a touch pointer`);
          return;
        }
        const box = (await wrapper.boundingBox())!;
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
        for (let i = 0; i < 12; i++) {
          await page.mouse.move(box.x + box.width * (0.3 + i * 0.02), box.y + box.height * 0.5);
          await page.waitForTimeout(80);
        }
        await wrapper.locator("canvas").waitFor({ state: "attached", timeout: 10000 });
        await page.waitForTimeout(700); // let the ripple ease in
        const r = await readCanvas(page, sel, true);
        summary.readbacks[id] = { std: r?.std ?? 0, coverage: r?.coverage ?? 0, imageDiff: r?.imageDiff ?? null };
        console.log(`    ${id}: hover -> std=${r?.std.toFixed(1)} coverage=${((r?.coverage ?? 0) * 100).toFixed(0)}% diff-vs-<img>=${r?.imageDiff?.toFixed(1)}`);
        if (!passesGate(r, true)) problems.push(`${label} ${id} hover canvas failed the pixel gate vs its <img>: ${JSON.stringify(r && { std: r.std, coverage: r.coverage, imageDiff: r.imageDiff })}`);

        // leaves: the context is released after ~3 s idle
        await page.mouse.move(2, 2);
        const t0 = Date.now();
        await wrapper.locator("canvas").waitFor({ state: "detached", timeout: 8000 }).catch(() => {
          problems.push(`${label} ${id} canvas still present 8 s after the pointer left`);
        });
        console.log(`    ${id}: released ${((Date.now() - t0) / 1000).toFixed(1)} s after the pointer left`);
        });
      }

      // keyboard: Tab onto an image, the focus ring must be drawn and the image reacts
      await page.mouse.move(2, 2);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      let found = false;
      for (let i = 0; i < 60 && !found; i++) {
        await page.keyboard.press("Tab");
        found = await activeElementIsDistortion(page);
      }
      if (!found) {
        problems.push(`${label} Tab never reached a DistortionImage`);
      } else {
        await page.waitForTimeout(900);
        const ring = await page.evaluate(() => {
          const active = document.activeElement as HTMLElement;
          const host = (active?.getAttribute("data-frictionborn-item") === "distortion-image"
            ? active
            : active?.querySelector("[data-frictionborn-item='distortion-image']")) as HTMLElement ?? active;
          const r = host?.querySelector("[data-frictionborn-focus-ring]") as HTMLElement | null;
          const cv = host?.querySelector("canvas");
          const rc = r?.getBoundingClientRect();
          const wc = host?.getBoundingClientRect();
          return {
            ring: !!r,
            shadow: r ? getComputedStyle(r).boxShadow : "",
            insideBox: !!rc && !!wc && rc.width > 0 && Math.abs(rc.width - wc.width) < 1,
            above: !!r && (!cv || Number(getComputedStyle(r).zIndex) > Number(getComputedStyle(cv).zIndex || 0)),
          };
        });
        console.log(`    keyboard focus: ring=${ring.ring} insideBox=${ring.insideBox} aboveCanvas=${ring.above}`);
        if (!ring.ring || ring.shadow === "none" || !ring.insideBox || !ring.above) problems.push(`${label} keyboard focus ring missing/hidden: ${JSON.stringify(ring)}`);
      }
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

      // cross-origin picture without CORS headers: falls back to the plain image, no errors
      if (!mode.mobile) await step(problems, page, `${label} cross-origin`, "item-distortion-cross-origin", async () => {
        const xo = page.locator("[data-testid='item-distortion-cross-origin']");
        await xo.scrollIntoViewIfNeeded({ timeout: 8000 });
        await xo.hover();
        await page.waitForTimeout(1800);
        const xoCanvas = await xo.locator("canvas").count();
        const xoVisible = await xo.locator("img").isVisible();
        console.log(`    cross-origin without CORS: canvases=${xoCanvas} (expected 0), <img> visible=${xoVisible}`);
        if (xoCanvas !== 0 || !xoVisible) problems.push(`${label} cross-origin fallback wrong: canvases=${xoCanvas} img visible=${xoVisible}`);
        await page.mouse.move(2, 2);
      });
    }

  // 4. anything the console or network said during ALL of the above fails the run (not only at load time)
  summary.consoleMessages = messages.length;
  if (problems.length > 0) {
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => "?");
    problems.push(`${label} page text at failure: ${JSON.stringify(bodyText)}`);
    await captureScreenshotWebp(page, path.join(screenshotsDir, `FAILED-${app.name}-${mode.id}.webp`)).catch(() => {});
    await context.close();
    throw new Error(`${label} failed:\n${problems.join("\n")}`);
  }

  // Screenshot with the default DistortionImage hovered so the ripple is visible in the evidence.
  if (hasDistortion && !mode.reduced && !mode.mobile) {
    const w = page.locator("[data-testid='gl-item-distortion-default']");
    await w.scrollIntoViewIfNeeded();
    const b = (await w.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5);
    await page.mouse.move(b.x + b.width * 0.55, b.y + b.height * 0.5, { steps: 6 });
    await page.waitForTimeout(900);
  }
  const screenshotPath = path.join(screenshotsDir, `${app.name}-${mode.id}.webp`);
  await captureScreenshotWebp(page, screenshotPath);
  console.log(`    screenshot: ${path.relative(root, screenshotPath)}`);
  await context.close();
  return summary;
}

// Dev-server smoke: Vite dev does not statically replace `process.env.NODE_ENV` the way a build does.
async function checkViteDev(browser: Browser, url: string, root: string, noGl = false): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (noGl) {
    await context.addInitScript(NO_GL_INIT_SCRIPT);
  } else {
    await context.addInitScript(CAPABLE_MACHINE_INIT_SCRIPT);
  }
  const artwork = fs.readFileSync(path.join(root, "public", "assets", "distortion", "art-1.webp"));
  await context.route("https://cdn.fresh-noncors.test/**", (route) => route.fulfill({ status: 200, contentType: "image/webp", body: artwork }));
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[console.error] ${m.text()}`);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  const xo = page.locator("[data-testid='item-distortion-cross-origin']");
  await xo.scrollIntoViewIfNeeded();
  await xo.hover();
  await page.waitForTimeout(2000);
  const canvases = await xo.locator("canvas").count();
  console.log(`    [vite dev] cross-origin without CORS: canvases=${canvases}, errors=${errors.length}`);
  await context.close();
  if (errors.length || canvases !== 0) throw new Error(`[vite dev] cross-origin fallback failed:\n${errors.join("\n")}`);
}

// ---------------------------------------------------------------------------------------------------------------

/** Every registryDependency (transitively) of the requested items must have been written into components/ui by shadcn. */
function assertDependenciesInstalled(root: string, uiDir: string, requested: string[]): void {
  const seen = new Set<string>();
  const queue = [...requested];
  while (queue.length) {
    const name = queue.pop()!;
    if (seen.has(name)) continue;
    seen.add(name);
    const json = readJson(path.join(root, "public", "r", `${name}.json`));
    for (const f of json.files as { target: string }[]) {
      const file = path.join(uiDir, "..", "..", f.target);
      if (!fs.existsSync(file)) throw new Error(`shadcn add did not write ${f.target} (needed by ${requested.join(", ")}) into ${path.dirname(uiDir)}`);
    }
    for (const dep of (json.registryDependencies ?? []) as string[]) queue.push(dep.replace(/^@frictionborn\//, ""));
  }
  console.log(`✔ dependency closure installed: ${[...seen].sort().join(", ")}`);
}

/**
 * Runs the template's own lint script (`pnpm lint`, the template's eslint config, the whole app) and fails on any
 * error in a file Frictionborn installed. Errors in files that the scaffolders or shadcn wrote themselves (for example
 * shadcn's own button.tsx, which fails the default Vite react-refresh rule) are printed as upstream and do not fail:
 * they are not ours to fix and would make the gate unpassable. The consumer config is never edited.
 */
async function lintInstalledItems(root: string, appDir: string, uiDir: string, requested: string[], label: string): Promise<void> {
  const ours = new Set<string>();
  const seen = new Set<string>();
  const queue = [...requested];
  while (queue.length) {
    const name = queue.pop()!;
    if (seen.has(name)) continue;
    seen.add(name);
    const json = readJson(path.join(root, "public", "r", `${name}.json`));
    for (const f of json.files as { target: string }[]) ours.add(path.resolve(uiDir, "..", "..", f.target));
    for (const dep of (json.registryDependencies ?? []) as string[]) queue.push(dep.replace(/^@frictionborn\//, ""));
  }
  const reportFile = path.join(appDir, "eslint-report.json");
  fs.rmSync(reportFile, { force: true });
  try {
    await run(`pnpm lint --format json --output-file eslint-report.json`, appDir);
  } catch {
    // ESLint exits 1 when it finds errors; the report below decides.
  }
  if (!fs.existsSync(reportFile)) throw new Error(`${label} lint produced no report: the template's lint script did not run`);
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8")) as {
    filePath: string;
    errorCount: number;
    warningCount: number;
    messages: { severity: number; ruleId: string | null; line: number; message: string }[];
  }[];
  const ourFailures: string[] = [];
  const upstream: string[] = [];
  let linted = 0;
  let ourWarnings = 0;
  for (const file of report) {
    const isOurs = ours.has(path.resolve(file.filePath));
    if (isOurs) {
      linted++;
      ourWarnings += file.warningCount;
    }
    for (const m of file.messages) {
      const line = `${path.relative(appDir, file.filePath)}:${m.line} ${m.ruleId ?? "parse"} ${m.message}`;
      if (m.severity === 2) (isOurs ? ourFailures : upstream).push(line);
    }
  }
  if (linted !== ours.size) throw new Error(`${label} lint covered ${linted} of ${ours.size} installed Frictionborn files: the template's config skipped some`);
  for (const u of upstream) console.log(`  (upstream, not Frictionborn) ${u}`);
  if (ourFailures.length) throw new Error(`${label} lint: ${ourFailures.length} error(s) in installed Frictionborn files:\n${ourFailures.join("\n")}`);
  console.log(`✔ ${label} lint (template config, whole app): 0 errors in ${linted} installed Frictionborn files, ${ourWarnings} warning(s), ${upstream.length} upstream error(s) ignored`);
}

export async function runFreshAppsCheck(): Promise<void> {
  const root = process.cwd();
  console.log("==> Fresh-apps verification (official scaffolders, production builds, real Chromium)");
  for (const port of [REGISTRY_PORT, NEXT_PORT, VITE_PORT, VITE_DEV_PORT]) await assertPortFree(port);

  console.log("==> Building the shadcn registry and packing @frictionborn/runtime...");
  buildRegistry();
  await run("pnpm --filter @frictionborn/runtime build", root);

  const tempRoot = path.join(os.tmpdir(), `fb-fresh-apps-${Date.now()}`);
  fs.mkdirSync(tempRoot, { recursive: true });
  console.log(`==> Temp workspace (outside the repo): ${tempRoot}`);

  await run(`pnpm --filter @frictionborn/runtime pack --pack-destination "${tempRoot}"`, root);
  const tgzFile = fs.readdirSync(tempRoot).find((f) => f.endsWith(".tgz"));
  if (!tgzFile) throw new Error("Failed to locate packed runtime tarball (.tgz)");
  const runtimeTarball = path.join(tempRoot, tgzFile).replace(/\\/g, "/");

  const publicRDir = path.join(root, "public", "r");
  const allItems = fs
    .readdirSync(publicRDir)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => f.replace(/\.json$/, ""));
  for (const name of FRESH_ONLY) if (!allItems.includes(name)) throw new Error(`FRESH_ONLY: unknown item "${name}"`);
  const items = FRESH_ONLY.length ? [...FRESH_ONLY] : allItems;

  // Decision 28 & Audit Task 3: Assert every public/r/<item>.json contains verified meta matching meta.json
  for (const name of allItems) {
    const itemJson = readJson(path.join(publicRDir, `${name}.json`));
    if (!itemJson.meta) {
      throw new Error(`Registry item ${name}.json is missing 'meta' field (Decision 28)`);
    }
    const metaPath = path.join(root, "registry", "items", name, "meta.json");
    if (fs.existsSync(metaPath)) {
      const expectedMeta = readJson(metaPath);
      if (JSON.stringify(itemJson.meta) !== JSON.stringify(expectedMeta)) {
        throw new Error(`Registry item ${name}.json 'meta' does not match registry/items/${name}/meta.json`);
      }
    }
  }
  console.log("✔ Every public/r/*.json carries verified metadata matching meta.json");

  // Sort items so primitive dependencies are installed before compositions
  const COMPOSITIONS = ["ambient-hero", "scroll-showcase"];
  items.sort((a, b) => {
    const aComp = COMPOSITIONS.includes(a);
    const bComp = COMPOSITIONS.includes(b);
    if (aComp === bComp) return a.localeCompare(b);
    return aComp ? 1 : -1;
  });
  console.log(`==> ${items.length} public items (ordered): ${items.join(", ")}`);

  const configureRegistries = (appDir: string) => {
    const compJsonPath = path.join(appDir, "components.json");
    if (fs.existsSync(compJsonPath)) {
      const cj = JSON.parse(fs.readFileSync(compJsonPath, "utf8"));
      cj.registries = {
        ...(cj.registries ?? {}),
        "@frictionborn": `http://127.0.0.1:${REGISTRY_PORT}/r/{name}.json`,
      };
      fs.writeFileSync(compJsonPath, JSON.stringify(cj, null, 2), "utf8");
    }
  };

  const publicDir = path.join(root, "public");
  const registryServer = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || "").split("?")[0]).replace(/^\/+/, "");
    const filePath = path.resolve(publicDir, rel);
    if (filePath.startsWith(publicDir + path.sep) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        "Content-Type": filePath.endsWith(".json") ? "application/json" : "text/plain",
        "Content-Length": content.length,
        "Access-Control-Allow-Origin": "*",
      });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise<void>((resolve, reject) => {
    registryServer.once("error", reject);
    registryServer.listen(REGISTRY_PORT, "127.0.0.1", () => resolve());
  });
  console.log(`✔ Local registry on http://127.0.0.1:${REGISTRY_PORT}`);

  const procs: ChildProcess[] = [];
  const today = new Date().toISOString().split("T")[0];
  // A FRESH_ONLY run must never overwrite the full run's evidence for the same day
  const screenshotsDir = path.join(root, "docs", "fresh-apps", FRESH_ONLY.length ? `${today}-only-${FRESH_ONLY.join("+")}` : today);
  fs.mkdirSync(screenshotsDir, { recursive: true });
  const itemUrls = items.map((i) => `http://127.0.0.1:${REGISTRY_PORT}/r/${i}.json`).join(" ");
  const artFiles = ["art-1.webp", "art-4.webp"];
  const copyArt = (dest: string) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const f of artFiles) fs.copyFileSync(path.join(root, "public", "assets", "distortion", f), path.join(dest, f));
  };
  const versions: Record<string, string> = {};
  let browser: Browser | null = null;

  try {
    // ---- Next 16: create-next-app -> shadcn init -> shadcn add -> next build -> next start
    console.log(`\n==> [1/2] create-next-app (${CREATE_NEXT_APP})`);
    await run(`npx --yes ${CREATE_NEXT_APP} fresh-next --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm --yes --disable-git`, tempRoot);
    const nextDir = path.join(tempRoot, "fresh-next");
    console.log(`==> shadcn init (${SHADCN})`);
    await run(`npx --yes ${SHADCN} init --defaults --yes`, nextDir);
    configureRegistries(nextDir);
    console.log("==> install the packed runtime, then shadcn add every public item from the local registry");
    await run(`pnpm add "file:${runtimeTarball}"`, nextDir);
    await run(`npx --yes ${SHADCN} add ${itemUrls} --yes --overwrite`, nextDir);
    assertDependenciesInstalled(root, path.join(nextDir, "components", "ui"), items);
    console.log("==> run Next lint (pnpm lint) to ensure installed items pass default Next 16 ESLint");
    await lintInstalledItems(root, nextDir, path.join(nextDir, "components", "ui"), items, "Next");
    copyArt(path.join(nextDir, "public"));
    fs.writeFileSync(path.join(nextDir, "app", "page.tsx"), generatePage(items, "next"));
    // The documented Next setup step: <MotionReadyScript /> in the root layout (Vite calls initMotionReady() instead).
    const layoutFile = path.join(nextDir, "app", "layout.tsx");
    const layout = fs
      .readFileSync(layoutFile, "utf8")
      .replace('import "./globals.css";', 'import "./globals.css";\nimport { MotionReadyScript } from "@frictionborn/runtime";')
      .replace("<body", "<head><MotionReadyScript /></head>\n      <body");
    if (!layout.includes("<MotionReadyScript />")) throw new Error("Could not add MotionReadyScript to the generated layout.tsx");
    fs.writeFileSync(layoutFile, layout);
    versions.next = installedVersion(nextDir, "next");
    versions.react = installedVersion(nextDir, "react");
    versions.tailwind = installedVersion(nextDir, "tailwindcss");
    console.log(`==> next build (next ${versions.next}, react ${versions.react}, tailwind ${versions.tailwind})`);
    await run("pnpm exec next build", nextDir);
    console.log("✔ Next production build succeeded");
    procs.push(startServer(`pnpm exec next start -p ${NEXT_PORT}`, nextDir));
    await waitForServer(`http://127.0.0.1:${NEXT_PORT}`);

    // ---- Vite: create-vite -> tailwind + alias (shadcn's documented Vite steps) -> shadcn init -> add -> build -> preview
    console.log(`\n==> [2/2] create-vite (${CREATE_VITE})`);
    await run(`npx --yes ${CREATE_VITE} fresh-vite --template react-ts --no-interactive`, tempRoot);
    const viteDir = path.join(tempRoot, "fresh-vite");
    try {
      await run("pnpm install", viteDir);
    } catch {
      await run("pnpm approve-builds --all", viteDir);
    }
    try {
      await run("pnpm add tailwindcss @tailwindcss/vite", viteDir);
    } catch {
      await run("pnpm approve-builds --all", viteDir);
    }
    fs.writeFileSync(path.join(viteDir, "src", "index.css"), '@import "tailwindcss";\n');
    fs.writeFileSync(
      path.join(viteDir, "vite.config.ts"),
      `import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
})
`
    );
    for (const f of ["tsconfig.json", "tsconfig.app.json"]) {
      const file = path.join(viteDir, f);
      const j = JSON.parse(fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, ""));
      j.compilerOptions = { ...(j.compilerOptions ?? {}), paths: { "@/*": ["./src/*"] } };
      fs.writeFileSync(file, JSON.stringify(j, null, 2));
    }
    console.log(`==> shadcn init (${SHADCN})`);
    await run(`npx --yes ${SHADCN} init --defaults --yes`, viteDir);
    configureRegistries(viteDir);
    await run(`pnpm add "file:${runtimeTarball}"`, viteDir);
    await run(`npx --yes ${SHADCN} add ${itemUrls} --yes --overwrite`, viteDir);
    assertDependenciesInstalled(root, path.join(viteDir, "src", "components", "ui"), items);
    console.log("==> run Vite lint (pnpm lint) to ensure installed items pass default Vite ESLint");
    await lintInstalledItems(root, viteDir, path.join(viteDir, "src", "components", "ui"), items, "Vite");
    copyArt(path.join(viteDir, "public"));
    fs.writeFileSync(path.join(viteDir, "src", "App.tsx"), generatePage(items, "vite"));
    fs.writeFileSync(
      path.join(viteDir, "src", "main.tsx"),
      `import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initMotionReady } from "@frictionborn/runtime"
import "./index.css"
import App from "./App.tsx"

initMotionReady()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
`
    );
    versions.vite = installedVersion(viteDir, "vite");
    versions.typescript = installedVersion(viteDir, "typescript");
    console.log(`==> pnpm build = tsc -b && vite build (vite ${versions.vite}, typescript ${versions.typescript}; the template's strict tsconfig type-checks the installed items)`);
    await run("pnpm build", viteDir);
    console.log("✔ Vite production build succeeded");
    procs.push(startServer(`pnpm exec vite preview --host 127.0.0.1 --port ${VITE_PORT} --strictPort`, viteDir));
    await waitForServer(`http://127.0.0.1:${VITE_PORT}`);
    procs.push(startServer(`pnpm exec vite --host 127.0.0.1 --port ${VITE_DEV_PORT} --strictPort`, viteDir));
    await waitForServer(`http://127.0.0.1:${VITE_DEV_PORT}`);

    // ---- Browser checks
    console.log("\n==> Playwright: real Chromium (SwiftShader WebGL2)");
    browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

    if (!NO_GL) {
      console.log("--> negative controls: the pixel gate must reject every kind of blank canvas");
      const ctx = await browser.newContext();
      await ctx.addInitScript(CAPABLE_MACHINE_INIT_SCRIPT);
      await ctx.addInitScript(READBACK_INIT_SCRIPT);
      const p = await ctx.newPage();
      await p.goto(`http://127.0.0.1:${VITE_PORT}`, { waitUntil: "networkidle" });
      for (const line of await negativeControls(p)) console.log(`    ${line}`);
      await ctx.close();
    } else {
      console.log("--> no-GL variant: WebGL pixel gate tests skipped (tier forced < 2, posters only)");
    }

    const apps = [
      { name: "next", url: `http://127.0.0.1:${NEXT_PORT}` },
      { name: "vite", url: `http://127.0.0.1:${VITE_PORT}` },
    ];
    const summaries: Summary[] = [];
    for (const app of apps) {
      console.log(`\n--> ${app.name.toUpperCase()} production build (${app.url})`);
      for (const mode of MODES) {
        console.log(`  mode: ${mode.id}`);
        summaries.push(await checkPage(browser, app, mode, items, screenshotsDir, root));
      }
    }
    console.log("\n--> Vite dev server smoke");
    if (items.includes("distortion-image")) await checkViteDev(browser, `http://127.0.0.1:${VITE_DEV_PORT}`, root, NO_GL);
    else console.log("    (skipped: the dev smoke exercises DistortionImage, which this FRESH_ONLY run did not install)");

    fs.writeFileSync(
      path.join(screenshotsDir, "summary.json"),
      JSON.stringify({ date: today, tools: { createNextApp: CREATE_NEXT_APP, createVite: CREATE_VITE, shadcn: SHADCN }, versions, items, gate: GATE, results: summaries }, null, 2) + "\n"
    );

    console.log("\n=======================================================");
    console.log("✔ FRESH-APP CHECKS PASSED (official scaffolders, production builds, real browsers)");
    console.log(`✔ Screenshots + summary.json: ${path.relative(root, screenshotsDir)}`);
    console.log("=======================================================\n");
  } finally {
    if (FRESH_KEEP) {
      // No `return` here: a return inside finally would swallow a failure thrown by the checks above.
      console.log(`FRESH_KEEP: apps left in ${tempRoot}; server PIDs (kill with taskkill /PID <pid> /T /F): ${procs.map((p) => p.pid).join(", ")}; registry on :${REGISTRY_PORT}`);
      await browser?.close().catch(() => {});
      registryServer.close();
    } else {
      console.log("Cleaning up servers and temp files...");
      await browser?.close().catch(() => {});
      for (const proc of procs) killTree(proc);
      registryServer.close();
      await new Promise((r) => setTimeout(r, 1500));
      try {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      } catch {
        console.log(`(could not remove ${tempRoot}; remove it manually)`);
      }
    }
  }
}

runFreshAppsCheck().catch((err) => {
  console.error("\n❌ Fresh-apps check failed:\n", err.message ?? err);
  process.exit(1);
});
