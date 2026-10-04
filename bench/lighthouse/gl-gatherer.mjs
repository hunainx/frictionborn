// Original — Frictionborn Motion Lighthouse gatherer: did WebGL actually run during the audited page load?
//
// A Lighthouse score for a "live" WebGL composition is meaningless if the GL never started (the tier gate refused
// it, WebGL2 was unavailable, the context was lost...). This gatherer installs a hook before the page's own scripts
// run, counts WebGL contexts and draw calls, and (after the trace is closed, so it cannot change the score) reads
// the pixels of the next frame that is drawn.

/* eslint-disable */
function installHook() {
  // The audited device is a mid-range phone (8 cores, 8 GB, like a Pixel 7). The runtime's tier gate reads these two
  // values and treats <= 4 cores as "low end" (tier 1: no WebGL), so a 4-core CI runner would otherwise silently
  // measure the poster as the "live" page. Emulating the phone makes the tier the same on every machine.
  try {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  } catch (e) {
    /* already defined: the artifact records the real values */
  }
  const st = (window.__fbLh = { contexts: 0, draws: 0, capture: null, readback: null, early: null });
  const drew = new WeakSet();
  st.contextsDrawn = 0;
  const seen = new WeakSet();
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    const ctx = origGetContext.call(this, type, opts);
    if (ctx && /webgl/.test(String(type)) && !seen.has(ctx)) {
      seen.add(ctx);
      st.contexts++;
    }
    return ctx;
  };
  // 4 x 4 single-pixel reads, once, >= 1.2 s after a context's first draw: proof the GL put pixels on screen even if
  // the frame guard later downgrades the item (software GL on a loaded runner). 16 tiny reads, no full-frame readback.
  const firstDraw = new WeakMap();
  const earlySample = (gl) => {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const px = new Uint8Array(4);
    let sum = 0;
    let sumSq = 0;
    let lit = 0;
    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        gl.readPixels(Math.floor(((gx + 0.5) * w) / 4), Math.floor(((gy + 0.5) * h) / 4), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const v = (px[0] + px[1] + px[2]) / 3;
        sum += v;
        sumSq += v * v;
        if (px[3] > 0) lit++;
      }
    }
    const mean = sum / 16;
    return { atMs: Math.round(performance.now()), mean, std: Math.sqrt(Math.max(0, sumSq / 16 - mean * mean)), coverage: lit / 16 };
  };
  const read = (gl) => {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const buf = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let sum = 0;
    let sumSq = 0;
    let covered = 0;
    const n = w * h;
    for (let i = 0; i < buf.length; i += 4) {
      const v = (buf[i] + buf[i + 1] + buf[i + 2]) / 3;
      sum += v;
      sumSq += v * v;
      if (buf[i + 3] > 0) covered++;
    }
    const mean = sum / n;
    return { w, h, mean, std: Math.sqrt(Math.max(0, sumSq / n - mean * mean)), coverage: covered / n };
  };
  for (const Ctor of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
    if (!Ctor) continue;
    for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
      const orig = Ctor.prototype[name];
      if (!orig) continue;
      Ctor.prototype[name] = function (...args) {
        const r = orig.apply(this, args);
        st.draws++;
        if (!st.early) {
          const t0 = firstDraw.get(this);
          if (t0 === undefined) firstDraw.set(this, performance.now());
          else if (performance.now() - t0 >= 1200) {
            try {
              st.early = earlySample(this);
            } catch (e) {
              st.early = { error: String(e) };
            }
          }
        }
        if (!drew.has(this)) {
          drew.add(this);
          st.contextsDrawn++;
        }
        if (st.capture) {
          const done = st.capture;
          st.capture = null;
          try {
            st.readback = read(this);
          } catch (e) {
            st.readback = { error: String(e) };
          }
          done();
        }
        return r;
      };
    }
  }
}

async function collect() {
  const st = window.__fbLh;
  if (!st) return { installed: false };
  const drawsBefore = st.draws;
  await new Promise((resolve) => {
    st.capture = resolve;
    setTimeout(resolve, 3000); // no draw within 3 s: nothing is rendering
  });
  st.capture = null;
  const canvases = Array.from(document.querySelectorAll("canvas")).map((c) => {
    const r = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    return {
      width: c.width,
      height: c.height,
      visible: cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0,
      inViewport: r.bottom > 0 && r.top < innerHeight,
    };
  });
  const items = Array.from(document.querySelectorAll("[data-frictionborn-item]")).map((el) => ({
    item: el.getAttribute("data-frictionborn-item"),
    tier: el.getAttribute("data-tier"),
  }));
  return {
    installed: true,
    contextsCreated: st.contexts,
    contextsDrawn: st.contextsDrawn,
    drawsTotal: st.draws,
    drawnDuringProbe: st.draws - drawsBefore,
    readback: st.readback,
    early: st.early,
    canvases,
    items,
    forcedTier: document.documentElement.getAttribute("data-fb-tier"),
    pointerCoarse: matchMedia("(pointer: coarse)").matches,
    hoverNone: matchMedia("(hover: none)").matches,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    viewport: [innerWidth, innerHeight],
    dpr: devicePixelRatio,
  };
}

export default class FbGlGatherer {
  meta = { supportedModes: ["navigation"] };

  async startInstrumentation(context) {
    await context.driver.executionContext.evaluateOnNewDocument(installHook, { args: [] });
  }

  // Lighthouse calls every phase on a gatherer; the ones this gatherer does not need are no-ops.
  async startSensitiveInstrumentation() {}
  async stopSensitiveInstrumentation() {}
  async stopInstrumentation() {}

  async getArtifact(context) {
    return context.driver.executionContext.evaluate(collect, { args: [] });
  }
}
