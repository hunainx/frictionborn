// Original — Frictionborn Motion EclipseSwitch (ported from the component lab, t2 · Eclipse Theme Switch)
"use client";

import React, { useCallback, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { TAU, fbm, noise, offscreen, paletteRamp, ramp, type Ramp, stage } from "@frictionborn/runtime/canvas";

export interface EclipseSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">, CanvasItemProps {
  /** Controlled state: true = eclipse (dark). */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label of the switch button (also its accessible name). */
  label?: string;
  /** Visible, announced status by state. Pass `null` to hide it. */
  statusText?: { on: string; off: string } | null;
  ref?: React.Ref<HTMLDivElement>;
}

const STATUS = { on: "Totality", off: "Day" };
/** the lab's sun ramp (fbSun) for `fire` */
const SUN: Ramp = [[0, [70, 8, 2]], [0.4, [210, 60, 8]], [0.75, [255, 150, 40]], [1, [255, 225, 150]]];

/** a granulated sun disc of radius R, pre-rendered once (the lab's fbSun) */
function sunDisc(R: number, pal: Ramp): HTMLCanvasElement {
  const S = Math.ceil(R * 2);
  const [o, x] = offscreen(S, S);
  const id = x.createImageData(S, S);
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const u = (i - R) / R, v = (j - R) / R, d = u * u + v * v, q = (j * S + i) * 4;
      if (d > 1) { id.data[q + 3] = 0; continue; }
      const z = Math.sqrt(1 - d), n = fbm(i * 0.35, j * 0.35, 3), big = fbm(i * 0.05, j * 0.05, 3);
      const I = (0.55 + n * 0.45 - Math.max(0, big - 0.62) * 1.8) * Math.pow(z, 0.45);
      const c = ramp(pal, I);
      id.data[q] = c[0];
      id.data[q + 1] = c[1];
      id.data[q + 2] = c[2];
      id.data[q + 3] = 255;
    }
  x.putImageData(id, 0, 0);
  return o;
}

export function EclipseSwitch({ checked, defaultChecked = false, onCheckedChange, label = "Eclipse mode", statusText = STATUS, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: EclipseSwitchProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const onRef = useRef(on);
  onRef.current = on;
  const { hydrated, tier, still } = useItemEnv(maxTier);

  // the sky: the lab's t2 drawing. The sun is the content, so every tier draws it; still (reduced motion, tier 0) jumps to the end state
  const wake = useDrawLoop(
    fxRef,
    (fx) => {
      const root = rootRef.current;
      if (!root) return null;
      const s = stage(fx, tier, root);
      if (!s) return null;
      const { d, c } = s;
      const pal = palette === "fire" ? SUN : paletteRamp(palette, readPalette(root, palette));
      const sun = sunDisc(48, pal);
      let m = onRef.current ? 1 : 0;
      return {
        tick(dt, t) {
          const want = onRef.current ? 1 : 0;
          m += (want - m) * Math.min(1, dt * (still ? 20 : 1.4));
          if (still || Math.abs(want - m) < 0.002) m = want;
          const g = c.g, cx = c.w / 2, cy = c.h / 2 - 14;
          g.clearRect(0, 0, c.w, c.h);
          if (m > 0.6) {
            g.save();
            g.globalAlpha = (m - 0.6) / 0.4;
            for (let i = 0; i < 60; i++) {
              g.fillStyle = "rgba(255,255,255,.6)";
              g.fillRect((i * 97) % c.w, (i * 53) % c.h, 1.2, 1.2);
            }
            g.restore();
          }
          if (m > 0.85) {
            g.save();
            g.globalCompositeOperation = "lighter";
            const a = (m - 0.85) / 0.15;
            const co = g.createRadialGradient(cx, cy, 46, cx, cy, 140);
            co.addColorStop(0, `rgba(230,240,255,${0.7 * a})`);
            co.addColorStop(0.25, `rgba(200,215,255,${0.2 * a})`);
            co.addColorStop(1, "rgba(180,200,255,0)");
            g.fillStyle = co;
            g.fillRect(0, 0, c.w, c.h);
            for (let i = 0; i < 24; i++) {
              const an = (i / 24) * TAU, l = 60 + 50 * noise(i, t * 0.2);
              g.strokeStyle = `rgba(220,230,255,${0.15 * a})`;
              g.beginPath();
              g.moveTo(cx + Math.cos(an) * 50, cy + Math.sin(an) * 50);
              g.lineTo(cx + Math.cos(an) * l * 1.4, cy + Math.sin(an) * l * 1.4);
              g.stroke();
            }
            g.restore();
          } else {
            const gl = g.createRadialGradient(cx, cy, 40, cx, cy, 120);
            gl.addColorStop(0, `rgba(255,220,150,${0.45 * (1 - m)})`);
            gl.addColorStop(1, "rgba(255,220,150,0)");
            g.fillStyle = gl;
            g.fillRect(0, 0, c.w, c.h);
          }
          g.drawImage(sun, cx - 48, cy - 48);
          const mx = cx + (1 - m) * 150;
          g.fillStyle = m > 0.5 ? "#05060a" : "#1b2430";
          g.beginPath();
          g.arc(mx, cy - (1 - m) * 18, 49, 0, TAU);
          g.fill();
          if (m > 0.97) {
            g.save();
            g.globalCompositeOperation = "lighter";
            const dx = cx - 30, dy = cy - 38;
            const gr = g.createRadialGradient(dx, dy, 0, dx, dy, 16);
            gr.addColorStop(0, "rgba(255,255,255,.9)");
            gr.addColorStop(1, "rgba(255,255,255,0)");
            g.fillStyle = gr;
            g.fillRect(dx - 16, dy - 16, 32, 32);
            g.restore();
          }
          // the moon slides, then the sky holds still (the corona's rays settle with it)
          return m !== want;
        },
        destroy: () => d.dispose(),
      };
    },
    { enabled: hydrated, paused, key: `${tier}:${still ? 1 : 0}:${palette}` },
  );

  const toggle = useCallback(() => {
    const next = !onRef.current;
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
    wake();
  }, [checked, onCheckedChange, wake]);

  return (
    <div ref={rootRef} data-frictionborn-item="eclipse-switch" data-tier={tier} data-on={on} className={`fb-eclipse-switch ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        .fb-eclipse-switch { position: relative; isolation: isolate; min-height: 250px; border-radius: 16px; overflow: hidden; background: #2a4a6a; color: #E9E5DF; }
        [data-motion="ok"] .fb-eclipse-switch { transition: background 1s; }
        .fb-eclipse-switch[data-on="true"] { background: #05060a; }
        .fb-es-fx { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .fb-es-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-es-sun { position: absolute; left: 50%; top: calc(50% - 14px); width: 96px; height: 96px; margin: -48px 0 0 -48px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, var(--fb-heat-4, #FFF4E0), var(--fb-heat-2, #E8590C) 70%, var(--fb-heat-1, #7A1D10)); }
        .fb-eclipse-switch[data-on="true"] .fb-es-sun { background: #05060a; box-shadow: 0 0 0 2px rgba(230, 240, 255, 0.7), 0 0 40px rgba(200, 215, 255, 0.45); }
        .fb-eclipse-switch[data-drawn] .fb-es-sun { display: none; }
        .fb-es-btn { position: absolute; left: 20px; bottom: 18px; z-index: 2; min-height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(233, 229, 223, 0.3); background: rgba(12, 11, 10, 0.55); color: #E9E5DF; font: inherit; font-size: 13px; cursor: pointer; }
        .fb-es-btn[aria-checked="true"] { border-color: rgba(230, 240, 255, 0.6); }
        .fb-es-btn:focus-visible { outline: 2px solid var(--ring, #E9E5DF); outline-offset: 2px; }
        .fb-es-status { position: absolute; right: 20px; bottom: 22px; z-index: 2; font: 11px ui-monospace, "Geist Mono", monospace; letter-spacing: 0.12em; text-transform: uppercase; color: #E9E5DF; }
      `}</style>
      <div ref={fxRef} className="fb-es-fx" aria-hidden="true" />
      <div className="fb-es-sun" aria-hidden="true" />
      <button type="button" role="switch" aria-checked={on} className="fb-es-btn" onClick={toggle}>
        {label}
      </button>
      {statusText && (
        <span className="fb-es-status" aria-live="polite">
          {on ? statusText.on : statusText.off}
        </span>
      )}
    </div>
  );
}

export default EclipseSwitch;
