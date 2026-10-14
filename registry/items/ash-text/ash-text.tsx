// Original — Frictionborn Motion AshText (ported from the component lab, c1 · Ash Disintegrate Text)
"use client";

import React, { useCallback, useRef } from "react";
import { paletteVars, readPalette, resolveCssColor, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { heat, markDrawn, noise, offscreen, paletteRamp, rand, relBox, trackPointer, stage } from "@frictionborn/runtime/canvas";

type TextTag = "h1" | "h2" | "h3" | "p" | "span";

export interface AshTextProps extends React.HTMLAttributes<HTMLDivElement>, CanvasItemProps {
  /** The text (one line). It stays in the DOM as real text; the grains are drawn over it. */
  children: string;
  /** The element the text is rendered as. */
  as?: TextTag;
  /** Offer a button that blows the word away (and pointer clicks on the word). `false` keeps it as a still texture. */
  interactive?: boolean;
  /** Accessible name of that button. */
  actionLabel?: string;
  ref?: React.Ref<HTMLDivElement>;
}

interface Grain { hx: number; hy: number; x: number; y: number; vx: number; vy: number; h: number; d: number }

/** sample points of `text` drawn in `el`'s own font at its own size, centred in the text's box `b` on a w × h canvas (step px apart, jittered like the lab) */
function grainsOf(el: HTMLElement, text: string, w: number, h: number, b: { x: number; y: number; w: number; h: number }, step: number): Grain[] {
  const cs = getComputedStyle(el), px = parseFloat(cs.fontSize) || 48;
  const [, x] = offscreen(w, h);
  x.font = `${cs.fontStyle} ${cs.fontWeight} ${px}px ${cs.fontFamily}`;
  try {
    (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  } catch {
    /* older engines: no letter spacing */
  }
  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  const m = x.measureText(text), asc = m.fontBoundingBoxAscent ?? px * 0.8, desc = m.fontBoundingBoxDescent ?? px * 0.2;
  x.fillStyle = "#fff";
  x.fillText(text, b.x + b.w / 2, b.y + (b.h - (asc + desc)) / 2 + asc);
  const d = x.getImageData(0, 0, w, h).data, out: Grain[] = [];
  for (let y = 0; y < h; y += step)
    for (let X = 0; X < w; X += step)
      if (d[(y * w + X) * 4 + 3] > 127) {
        const gx = X + rand(-1, 1), gy = y + rand(-1, 1);
        out.push({ hx: gx, hy: gy, x: gx, y: gy, vx: 0, vy: 0, h: 0, d: Math.random() });
      }
  return out;
}

export function AshText({ children, as: Tag = "h2", interactive = true, actionLabel, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: AshTextProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);
  const blowRef = useRef<((x?: number) => void) | null>(null);
  const { hydrated, reduced, tier } = useItemEnv(maxTier);

  // the grains: the lab's c1 drawing, in the text's own font, colour and place
  const wake = useDrawLoop(
    fxRef,
    (fx, wakeUp) => {
      const root = rootRef.current, el = textRef.current;
      if (!root || !el) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      const pal = paletteRamp(palette, readPalette(root, palette));
      const ink = resolveCssColor(el, getComputedStyle(el).color) ?? [0.93, 0.9, 0.86];
      const inkCss = `rgb(${ink.map((v) => Math.round(v * 255)).join(",")})`;
      // the pointer is tracked on the text itself (the canvas around it never takes pointer events), then moved into canvas space
      const p = trackPointer(el, d, { move: () => wakeUp() });
      let P: Grain[] = [], gone = -1, ox = 0, box = relBox(el, fx);
      const step = tier >= 3 ? 3 : 4;
      const build = () => { box = relBox(el, fx); P = grainsOf(el, children, c.w, c.h, box, step); };
      /*
       * A web font that is still loading would sample as its fallback face, so the word is sampled once its own face is there (the lab
       * also waits for its fonts); until then the DOM text shows as it is.
       */
      let alive = true, ready = false;
      c.onResize(() => { if (ready) { build(); wakeUp(); } });
      const go = () => {
        if (!alive || ready) return;
        ready = true;
        build();
        markDrawn(root, d);
        wakeUp();
      };
      const cs = getComputedStyle(el), face = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      let loading = false;
      try {
        loading = !!document.fonts && !document.fonts.check(face, children);
      } catch {
        /* an invalid font string: sample with what there is */
      }
      if (loading) document.fonts.load(face, children).then(go, go);
      else go();
      blowRef.current = (x) => {
        if (gone >= 0) return;
        gone = 0;
        ox = box.x + (x ?? box.w / 2);
        wakeUp();
      };
      return {
        tick(dt, t) {
          const g = c.g;
          g.clearRect(0, 0, c.w, c.h);
          if (gone >= 0) {
            gone += dt;
            if (gone > 4.2) gone = -1;
          }
          const blowing = gone >= 0 && gone < 2.6;
          let moving = gone >= 0 || p.speed > 1;
          for (const q of P) {
            if (blowing) {
              const delay = (Math.abs(q.hx - ox) / box.w) * 0.9 + q.d * 0.25;
              if (gone > delay) {
                if (q.h === 0) { q.vx = rand(40, 160) * (q.hx < ox ? -1 : 1) * 0.6 + 60; q.vy = -rand(20, 120); q.h = 1; }
                q.vx += (noise(q.x * 0.02, t) - 0.45) * 400 * dt;
                q.vy += (-30 + (noise(q.y * 0.02, t + 9) - 0.5) * 300) * dt;
                q.x += q.vx * dt;
                q.y += q.vy * dt;
                q.h = Math.max(0.05, q.h - dt * 0.7);
              }
            } else {
              q.x += (q.hx - q.x) * Math.min(1, dt * (2.5 + q.d * 2));
              q.y += (q.hy - q.y) * Math.min(1, dt * (2.5 + q.d * 2));
              q.h = Math.max(0, q.h - dt);
              if (p.in) {
                const dx = q.x - (p.x + box.x), dy = q.y - (p.y + box.y), d2 = dx * dx + dy * dy;
                if (d2 < 900) { q.x += (dx / 30) * dt * 40; q.y += (dy / 30) * dt * 40; }
              }
              if (Math.abs(q.hx - q.x) > 0.05 || Math.abs(q.hy - q.y) > 0.05 || q.h > 0) moving = true;
            }
            let col: string;
            if (q.h > 0.55) col = heat(pal, 0.5 + (q.h - 0.55));
            else if (q.h > 0.05) col = `rgba(${(140 + q.h * 120) | 0},${(130 + q.h * 30) | 0},125,${0.4 + q.h})`;
            else col = inkCss;
            g.fillStyle = col;
            const s = q.h > 0.05 ? 1.6 : step - 0.4;
            g.fillRect(q.x, q.y, s, s);
          }
          p.decay(dt);
          return moving;
        },
        destroy() {
          alive = false;
          blowRef.current = null;
          d.dispose();
        },
      };
    },
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}:${children}` },
  );

  const blow = useCallback(
    (x?: number) => {
      blowRef.current?.(x);
      wake();
    },
    [wake],
  );

  return (
    <div ref={rootRef} data-frictionborn-item="ash-text" data-tier={tier} className={`fb-ash-text ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        /* the effect paints up to 200 px around the control without widening the page (no sideways scroll on phones) */
        .fb-ash-text { overflow: clip; overflow-clip-margin: 200px; }
        .fb-ash-text { position: relative; display: inline-block; }
        .fb-at-text { margin: 0; white-space: nowrap; font: inherit; letter-spacing: inherit; color: inherit; }
        .fb-ash-text[data-drawn] .fb-at-text[data-interactive="true"] { cursor: pointer; }
        .fb-ash-text[data-drawn] .fb-at-text { color: transparent; }
        .fb-at-fx { position: absolute; inset: -90px -180px -90px -90px; pointer-events: none; }
        .fb-at-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-at-btn { position: absolute; right: 0; bottom: -2px; transform: translateY(100%); min-height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); background: transparent; color: inherit; font: 12px ui-monospace, "Geist Mono", monospace; opacity: 0.7; cursor: pointer; }
        .fb-at-btn:hover, .fb-at-btn:focus-visible { opacity: 1; }
        .fb-at-btn:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 2px; }
        .fb-ash-text:not([data-drawn]) .fb-at-btn { display: none; }
      `}</style>
      <Tag
        ref={textRef as React.Ref<never>}
        className="fb-at-text"
        data-interactive={interactive}
        onClick={interactive ? (e: React.MouseEvent<HTMLElement>) => blow(e.clientX - e.currentTarget.getBoundingClientRect().left) : undefined}
      >
        {children}
      </Tag>
      <div ref={fxRef} className="fb-at-fx" aria-hidden="true" />
      {interactive && (
        <button type="button" className="fb-at-btn" onClick={() => blow()}>
          {actionLabel ?? `Blow “${children}” away`}
        </button>
      )}
    </div>
  );
}

export default AshText;
