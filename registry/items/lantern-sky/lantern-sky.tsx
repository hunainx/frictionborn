// Original — Frictionborn Motion LanternSky (ported from the component lab, s3 · Lantern Sky Background)
"use client";

import React, { useRef, useState } from "react";
import { paletteVars, readPalette, resumeAll, useDrawLoop, usePaused, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { paletteRamp, rand, ramp, trackPointer, type Ramp, stage } from "@frictionborn/runtime/canvas";

export interface LanternSkyProps extends React.HTMLAttributes<HTMLDivElement>, CanvasItemProps {
  /** Content shown over the sky (a headline, a call to action). */
  children?: React.ReactNode;
  /** Lanterns per 10,000 px² of sky (the lab used about 1.1). */
  density?: number;
  /** A visible Pause / Play button (WCAG 2.2.2: the sky moves for longer than 5 s). */
  showPauseButton?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

interface Lantern { x: number; y: number; z: number; ph: number; vx: number; lit: number }

/** one paper lantern of height h, lit by k (the lab's fbLantern; `pal` recolours the light for palettes other than fire) */
function drawLantern(g: CanvasRenderingContext2D, x: number, y: number, h: number, lit: number, t: number, ph: number, pal: Ramp | null) {
  const w1 = h * 0.74, w0 = h * 0.5, k = lit * (0.88 + 0.12 * Math.sin(t * 9 + ph * 3));
  const at = (q: number, a: number) => { const c = ramp(pal as Ramp, q); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; };
  if (k > 0.02) {
    const R = h * 2.4, gr = g.createRadialGradient(x, y + h * 0.2, 0, x, y + h * 0.2, R);
    gr.addColorStop(0, pal ? at(0.78, 0.3 * k) : `rgba(255,170,80,${0.3 * k})`);
    gr.addColorStop(1, pal ? at(0.5, 0) : "rgba(255,100,30,0)");
    g.save();
    g.globalCompositeOperation = "lighter";
    g.fillStyle = gr;
    g.fillRect(x - R, y - R, R * 2, R * 2.2);
    g.restore();
  }
  g.beginPath();
  g.moveTo(x - w0 / 2, y + h / 2);
  g.bezierCurveTo(x - w1 * 0.62, y + h * 0.1, x - w1 * 0.6, y - h * 0.38, x - w1 * 0.3, y - h * 0.5);
  g.quadraticCurveTo(x, y - h * 0.58, x + w1 * 0.3, y - h * 0.5);
  g.bezierCurveTo(x + w1 * 0.6, y - h * 0.38, x + w1 * 0.62, y + h * 0.1, x + w0 / 2, y + h / 2);
  g.closePath();
  const gr = g.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  if (k > 0.02) {
    if (pal) {
      gr.addColorStop(0, at(0.4, 0.92));
      gr.addColorStop(0.55, at(0.6 + 0.2 * k, 0.97));
      gr.addColorStop(1, at(0.8 + 0.15 * k, 1));
    } else {
      gr.addColorStop(0, "rgba(200,70,20,.92)");
      gr.addColorStop(0.55, `rgba(${(235 + 20 * k) | 0},${(120 + 70 * k) | 0},${(40 + 40 * k) | 0},.97)`);
      gr.addColorStop(1, `rgba(255,${(200 + 40 * k) | 0},${(120 + 60 * k) | 0},1)`);
    }
  } else {
    gr.addColorStop(0, "#2e2422");
    gr.addColorStop(1, "#4a3a30");
  }
  g.fillStyle = gr;
  g.fill();
  g.strokeStyle = k > 0.02 ? "rgba(120,40,10,.35)" : "rgba(0,0,0,.35)";
  g.lineWidth = Math.max(0.6, h / 50);
  for (const f of [-0.3, 0, 0.3]) {
    g.beginPath();
    g.moveTo(x + f * w1 * 0.9, y - h * 0.48);
    g.quadraticCurveTo(x + f * w1 * 1.15, y, x + f * w0, y + h * 0.5);
    g.stroke();
  }
}

export function LanternSky({ children, density = 1.1, showPauseButton = true, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: LanternSkyProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState(false);
  const globalPaused = usePaused();
  const { hydrated, tier, still } = useItemEnv(maxTier);
  const stopped = paused || held || globalPaused;

  // the sky: the lab's s3 drawing. It is the picture, so every tier draws it; still (reduced motion, tier 0) draws one frame
  useDrawLoop(
    fxRef,
    (fx, wakeUp) => {
      const root = rootRef.current;
      if (!root) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      const pal = palette === "fire" ? null : paletteRamp(palette, readPalette(root, palette));
      const p = trackPointer(root, d, { move: () => wakeUp() });
      let L: Lantern[] = [];
      const seed = () => {
        L = Array.from({ length: Math.round(((c.w * c.h) / 10000) * density * (tier === 2 ? 0.6 : 1)) }, () => ({
          x: rand(0, c.w), y: rand(0, c.h * 1.2), z: 0.2 + 0.8 * Math.random() ** 1.5, ph: rand(0, 6), vx: 0, lit: Math.random() < 0.85 ? 1 : 0,
        })).sort((a, b) => a.z - b.z);
      };
      c.onResize(() => { seed(); wakeUp(); });
      seed();
      return {
        tick(dt, t) {
          const g = c.g, bg = g.createLinearGradient(0, 0, 0, c.h);
          bg.addColorStop(0, "#04050b");
          bg.addColorStop(0.7, "#0d0a14");
          bg.addColorStop(1, "#2a140c");
          g.fillStyle = bg;
          g.fillRect(0, 0, c.w, c.h);
          for (const l of L) {
            if (!still) {
              l.y -= (10 + 26 * l.z) * dt;
              l.x += (Math.sin(t * 0.4 + l.ph) * 6 * l.z + l.vx) * dt;
              l.vx *= Math.exp(-dt * 1.4);
              if (p.in) {
                const dx = l.x - p.x, dy = l.y - p.y, dd = Math.hypot(dx, dy);
                if (dd < 120 && dd > 1) l.vx += (dx / dd) * (120 - dd) * 2 * dt * l.z;
                if (dd < 30 && !l.lit) l.lit = 1;
              }
            }
            if (l.y < -40) { l.y = c.h + 30; l.x = rand(0, c.w); }
            if (l.x > c.w + 40) l.x = -40;
            if (l.x < -40) l.x = c.w + 40;
            g.save();
            g.globalAlpha = 0.35 + 0.65 * l.z;
            drawLantern(g, l.x, l.y, 8 + 34 * l.z, l.lit, still ? 0 : t, l.ph, pal);
            g.restore();
          }
          p.decay(dt);
          return !still;
        },
        destroy: () => d.dispose(),
      };
    },
    { enabled: hydrated, paused: stopped, key: `${tier}:${still ? 1 : 0}:${palette}:${density}` },
  );

  return (
    <div ref={rootRef} data-frictionborn-item="lantern-sky" data-tier={tier} className={`fb-lantern-sky ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        .fb-lantern-sky { position: relative; isolation: isolate; min-height: 250px; overflow: hidden; border-radius: inherit; background: linear-gradient(#04050b, #0d0a14 70%, #2a140c); color: #E9E5DF; }
        .fb-ls-fx { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .fb-ls-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-ls-pause { position: absolute; right: 14px; bottom: 14px; min-height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(233, 229, 223, 0.3); background: rgba(4, 5, 11, 0.6); color: #E9E5DF; font: 12px ui-monospace, "Geist Mono", monospace; cursor: pointer; }
        .fb-ls-pause:focus-visible { outline: 2px solid var(--ring, #E9E5DF); outline-offset: 2px; }
      `}</style>
      <div ref={fxRef} className="fb-ls-fx" aria-hidden="true" />
      {children}
      {showPauseButton && hydrated && !still && (
        <button
          type="button"
          className="fb-ls-pause"
          onClick={() => {
            if (stopped) {
              if (globalPaused) resumeAll();
              setHeld(false);
            } else setHeld(true);
          }}
        >
          {stopped ? "Play the lanterns" : "Pause the lanterns"}
        </button>
      )}
    </div>
  );
}

export default LanternSky;
