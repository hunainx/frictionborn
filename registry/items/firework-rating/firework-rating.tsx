// Original — Frictionborn Motion FireworkRating (ported from the component lab, u3 · Firework Star Rating)
"use client";

import React, { useCallback, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { Sparks, TAU, css, offscreen, paletteRamp, rand, ramp, relBox, type RGB, stage } from "@frictionborn/runtime/canvas";

export interface FireworkRatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">, CanvasItemProps {
  /** Controlled rating, 0 (not rated) to 5. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Accessible name of the radio group. */
  label?: string;
  /** Words for 0–5 stars, shown and announced under the stars. Pass `null` to hide them. */
  words?: [string, string, string, string, string, string] | null;
  ref?: React.Ref<HTMLDivElement>;
}

const WORDS: [string, string, string, string, string, string] = ["Not rated", "Poor", "Fair", "Good", "Great", "Spectacular"];
/** the lab's firework colours (FB_PAL) */
const FIRE_PAL: RGB[] = [[255, 196, 96], [255, 120, 44], [255, 238, 214], [255, 72, 44], [255, 160, 70]];

/** the part of the lab's fireworks engine (fbShow) this item uses: peony bursts with a fading trail and a flash of light */
function createShow(sparks: number) {
  const o = { st: new Sparks(sparks), trail: null as HTMLCanvasElement | null, tx: null as CanvasRenderingContext2D | null, w: 0, h: 0, lights: [] as Array<{ x: number; y: number; c: RGB; a: number }> };
  return {
    size(w: number, h: number, dpr: number) {
      o.w = w;
      o.h = h;
      [o.trail, o.tx] = offscreen(w * dpr, h * dpr);
      o.tx.scale(dpr, dpr);
    },
    burst(x: number, y: number, c: RGB, scale = 1) {
      const V = rand(120, 170) * scale;
      for (let i = 0; i < 100; i++) {
        const a = Math.random() * TAU, z = rand(-1, 1), kk = Math.sqrt(1 - z * z), v = V * rand(0.9, 1.05);
        o.st.add(x, y, Math.cos(a) * kk * v, Math.sin(a) * kk * v, rand(1.1, 1.6), 1.7, 110, 1.4, c);
      }
      o.lights.push({ x, y, c, a: 1 });
    },
    step(dt: number) {
      const tx = o.tx;
      if (!tx) return;
      o.st.step(dt);
      o.lights.forEach((L) => (L.a *= Math.exp(-dt * 3)));
      o.lights = o.lights.filter((L) => L.a > 0.02);
      tx.globalCompositeOperation = "destination-out";
      tx.fillStyle = `rgba(0,0,0,${1 - Math.exp(-dt * 7)})`;
      tx.fillRect(0, 0, o.w, o.h);
      tx.globalCompositeOperation = "source-over";
      o.st.draw(tx);
    },
    draw(g: CanvasRenderingContext2D) {
      if (!o.trail) return;
      g.save();
      g.globalCompositeOperation = "lighter";
      for (const L of o.lights) {
        const gr = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, 260);
        gr.addColorStop(0, css(L.c, 0.16 * L.a));
        gr.addColorStop(1, css(L.c, 0));
        g.fillStyle = gr;
        g.fillRect(0, 0, o.w, o.h);
      }
      g.drawImage(o.trail, 0, 0, o.w, o.h);
      g.restore();
    },
    /** still glowing: sparks alive or a flash fading (the trail fades within about a second after) */
    get busy() {
      return o.st.n > 0 || o.lights.length > 0;
    },
  };
}

export function FireworkRating({ value, defaultValue = 0, onValueChange, label = "Rating", words = WORDS, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: FireworkRatingProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const rate = Math.max(0, Math.min(5, value ?? inner));
  const [preview, setPreview] = useState(0);
  const celebrate = useRef<((n: number) => void) | null>(null);
  const { hydrated, reduced, tier } = useItemEnv(maxTier);

  // the bursts: the lab's u3 drawing (each chosen star bursts in turn, 90 ms apart)
  const wake = useDrawLoop(
    fxRef,
    (fx, wakeUp) => {
      const root = rootRef.current, group = groupRef.current;
      if (!root || !group) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      const F = createShow(tier >= 3 ? 1600 : 700);
      c.onResize(() => F.size(c.w, c.h, c.dpr));
      F.size(c.w, c.h, c.dpr);
      const cols: RGB[] = palette === "fire" ? FIRE_PAL : ((r) => [0.95, 0.6, 1, 0.45, 0.75].map((t) => ramp(r, t)))(paletteRamp(palette, readPalette(root, palette)));
      const timers: number[] = [];
      d.add(() => timers.forEach((t) => window.clearTimeout(t)));
      let fading = 0;
      celebrate.current = (n) => {
        const stars = group.querySelectorAll<HTMLElement>("[role=radio]");
        for (let i = 0; i < n; i++)
          timers.push(
            window.setTimeout(() => {
              const r = relBox(stars[i], fx);
              F.burst(r.x + r.w / 2, r.y + r.h / 2, cols[i % 5], 0.45 + n * 0.08);
              wakeUp();
            }, i * 90),
          );
        wakeUp();
      };
      return {
        tick(dt) {
          F.step(dt);
          c.g.clearRect(0, 0, c.w, c.h);
          F.draw(c.g);
          // keep drawing about a second after the last spark so the trail can fade out
          fading = F.busy ? 1.2 : Math.max(0, fading - dt);
          return F.busy || fading > 0;
        },
        destroy() {
          celebrate.current = null;
          d.dispose();
        },
      };
    },
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}` },
  );

  const set = useCallback(
    (n: number) => {
      if (value === undefined) setInner(n);
      onValueChange?.(n);
      setPreview(0);
      celebrate.current?.(n);
      wake();
    },
    [value, onValueChange, wake],
  );

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const j = Math.max(0, Math.min(4, i + dir));
    set(j + 1);
    groupRef.current?.querySelectorAll<HTMLElement>("[role=radio]")[j]?.focus();
  };

  return (
    <div ref={rootRef} data-frictionborn-item="firework-rating" data-tier={tier} className={`fb-firework-rating ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        /* the effect paints up to 200 px around the control without widening the page (no sideways scroll on phones) */
        .fb-firework-rating { overflow: clip; overflow-clip-margin: 200px; }
        .fb-firework-rating { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 12px; }
        .fb-fr-fx { position: absolute; left: 50%; top: 23px; width: 520px; height: 360px; transform: translate(-50%, -50%); pointer-events: none; z-index: 2; }
        .fb-fr-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-fr-group { display: flex; gap: 8px; }
        .fb-fr-star { width: 46px; height: 46px; padding: 0; border: 0; border-radius: 10px; background: transparent; cursor: pointer; font-size: 38px; line-height: 1; color: #6b645d; }
        [data-motion="ok"] .fb-fr-star { transition: transform 0.15s, color 0.15s; }
        .fb-fr-star:hover { transform: scale(1.12); }
        .fb-fr-star[data-on="true"] { color: var(--fb-heat-3, #ffc46a); text-shadow: 0 0 18px color-mix(in srgb, var(--fb-heat-2, #E8590C) 80%, transparent); }
        .fb-fr-star[data-preview="true"] { color: color-mix(in srgb, var(--fb-heat-3, #ffc46a) 60%, #6b645d); }
        .fb-fr-star:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 2px; }
        .fb-fr-words { font: 11px ui-monospace, "Geist Mono", monospace; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted-foreground, GrayText); }
      `}</style>
      <div ref={fxRef} className="fb-fr-fx" aria-hidden="true" />
      <div ref={groupRef} role="radiogroup" aria-label={label} className="fb-fr-group" onPointerLeave={() => setPreview(0)}>
        {[1, 2, 3, 4, 5].map((n, i) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rate === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            tabIndex={(rate || 1) === n ? 0 : -1}
            className="fb-fr-star"
            data-on={n <= rate}
            data-preview={preview > 0 && n <= preview && n > rate}
            onClick={() => set(n)}
            onPointerEnter={() => setPreview(n)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span aria-hidden="true">★</span>
          </button>
        ))}
      </div>
      {words && (
        <span className="fb-fr-words" aria-live="polite">
          {words[rate]}
        </span>
      )}
    </div>
  );
}

export default FireworkRating;
