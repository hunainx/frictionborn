// Original — Frictionborn Motion MatchProgress (ported from the component lab, f4 · Chain Ignition Progress)
"use client";

import React, { useEffect, useRef } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { BB, Fire, Sparks, heat, paletteRamp, rand, stage } from "@frictionborn/runtime/canvas";

export interface MatchProgressProps extends React.HTMLAttributes<HTMLDivElement>, CanvasItemProps {
  /** Progress, 0–100. Each match catches from the last as the value passes its share. */
  value: number;
  /** Accessible name of the progress bar. */
  label: string;
  /** Number of matches in the row. */
  matches?: number;
  /** Show the percentage under the row. */
  showValue?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

/** seconds a lit match takes to burn down to its last 8 % */
const BURN = 7;

/** one match on its side or standing: stick, char along the burnt length, head (the lab's fbMatch) */
function drawMatch(g: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, burnt: number, headR: number, charHead: boolean) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const bl = len * burnt;
  g.fillStyle = "#d9b37a";
  g.fillRect(-len, -2.2, len - bl, 4.4);
  g.fillStyle = "#d0a66a";
  g.fillRect(-len, 0.6, len - bl, 1.6);
  if (bl > 0) {
    const cg = g.createLinearGradient(-bl, 0, 0, 0);
    cg.addColorStop(0, "#5a4535");
    cg.addColorStop(0.6, "#2a1d16");
    cg.addColorStop(1, "#14100d");
    g.fillStyle = cg;
    g.beginPath();
    g.moveTo(-bl, -2);
    g.quadraticCurveTo(-bl * 0.5, -1.4, 0, -1.5);
    g.lineTo(0, 1.5);
    g.quadraticCurveTo(-bl * 0.5, 1.4, -bl, 2);
    g.fill();
  }
  const hg = g.createRadialGradient(-1, -2, 0, 0, 0, headR + 2);
  hg.addColorStop(0, charHead ? "#3a2a22" : "#e0574a");
  hg.addColorStop(1, charHead ? "#120c0a" : "#7a1810");
  g.fillStyle = hg;
  g.beginPath();
  g.ellipse(1, 0, headR + 1.5, headR, 0, 0, 7);
  g.fill();
  g.restore();
}

export function MatchProgress({ value, label, matches = 12, showValue = true, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: MatchProgressProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const vRef = useRef(v);
  vRef.current = v;
  const { hydrated, tier, still } = useItemEnv(maxTier);

  // the row: the lab's f4 drawing. Animated: a match catches with a burst and burns down over 7 s. Still (reduced motion, tier 0):
  // the reached matches stand lit with a steady glow, one frame per change
  const wake = useDrawLoop(
    fxRef,
    (fx) => {
      const root = rootRef.current, s = root && stage(fx, tier, root);
      if (!root || !s) return null;
      const { d, c } = s;
      const pal = paletteRamp(palette, readPalette(root, palette));
      const fire = new Fire(tier >= 3 ? 500 : 250), sp = new Sparks(tier >= 3 ? 200 : 100, palette === "fire" ? null : pal);
      const M = Array.from({ length: matches }, () => ({ lit: -1 }));
      // already reached when mounted: lit and burnt as far as a full burn (no burst for history)
      M.forEach((m, i) => { if (vRef.current >= ((i + 1) / matches) * 100 - 0.01) m.lit = still ? 0 : BURN; });
      const glowA = palette === "fire" ? "rgba(255,220,150,.9)" : heat(pal, 0.86, 0.9), glowB = palette === "fire" ? "rgba(255,100,20,0)" : heat(pal, 0.5, 0);
      const ember = palette === "fire" ? "rgba(255,130,40,.9)" : heat(pal, 0.62, 0.9);
      return {
        tick(dt) {
          const prog = vRef.current, g = c.g;
          g.clearRect(0, 0, c.w, c.h);
          const n = matches, gap = Math.min(30, (c.w - 60) / n), x0 = c.w / 2 - (gap * (n - 1)) / 2, base = c.h - 18, L = 92;
          let busy = false;
          M.forEach((m, i) => {
            const x = x0 + i * gap, reached = prog >= ((i + 1) / n) * 100 - 0.01;
            if (!reached) m.lit = -1;
            else if (m.lit < 0) {
              m.lit = 0;
              if (!still) sp.burst(x, base - L, 14, 80, 260);
            }
            if (m.lit >= 0 && !still) m.lit += dt;
            const burnt = m.lit >= 0 && !still ? Math.min(0.92, m.lit / BURN) : 0, top = base - L + L * burnt;
            if (m.lit >= 0 && burnt < 0.92 && !still) {
              busy = true;
              for (let j = 0; j < 2; j++) fire.add(x + rand(-2, 2), top - 4, rand(5, 9), rand(-6, 6), -rand(40, 80), rand(0.25, 0.5), 1);
            }
            drawMatch(g, x, base - L, -Math.PI / 2, L, burnt, 5, m.lit > 0.5);
            if (burnt > 0) {
              g.fillStyle = ember;
              g.fillRect(x - 2.3, top - 2, 4.6, 2.5);
            }
            if (still && m.lit >= 0) {
              g.save();
              g.globalCompositeOperation = "lighter";
              const fg = g.createRadialGradient(x, base - L - 12, 0, x, base - L - 12, 12);
              fg.addColorStop(0, glowA);
              fg.addColorStop(1, glowB);
              g.fillStyle = fg;
              g.fillRect(x - 14, base - L - 26, 28, 28);
              g.restore();
            }
          });
          g.fillStyle = "#2b2421";
          g.fillRect(x0 - 20, base, gap * (n - 1) + 40, 6);
          fire.step(dt);
          fire.draw(g, palette === "fire" ? BB : pal, 0.6);
          sp.step(dt);
          sp.draw(g);
          return !still && (busy || fire.n > 0 || sp.n > 0);
        },
        destroy: () => d.dispose(),
      };
    },
    { enabled: hydrated, paused, key: `${tier}:${still ? 1 : 0}:${palette}:${matches}` },
  );

  useEffect(() => {
    wake();
  }, [v, wake]);

  return (
    <div ref={rootRef} data-frictionborn-item="match-progress" data-tier={tier} className={`fb-match-progress ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        .fb-match-progress { position: relative; display: grid; justify-items: center; gap: 12px; }
        .fb-mp-stage { position: relative; width: 100%; min-width: 220px; height: 150px; }
        .fb-mp-fx { position: absolute; inset: 0; pointer-events: none; }
        .fb-mp-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-mp-bar { position: absolute; left: 0; right: 0; bottom: 18px; height: 6px; border-radius: 3px; background: #2b2421; overflow: hidden; }
        .fb-mp-bar > i { display: block; height: 100%; background: var(--fb-heat-2, #E8590C); }
        .fb-match-progress[data-drawn] .fb-mp-bar { display: none; }
        .fb-mp-val { font: 13px ui-monospace, "Geist Mono", monospace; color: var(--foreground, #E9E5DF); }
      `}</style>
      <div className="fb-mp-stage">
        <div ref={fxRef} className="fb-mp-fx" aria-hidden="true" />
        {/* before the canvas mounts (server HTML, no JavaScript) a plain bar shows the same value */}
        <div className="fb-mp-bar" aria-hidden="true">
          <i style={{ width: `${v}%` }} />
        </div>
      </div>
      <span className="fb-mp-val" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
        {showValue ? `${v}%` : null}
      </span>
    </div>
  );
}

export default MatchProgress;
