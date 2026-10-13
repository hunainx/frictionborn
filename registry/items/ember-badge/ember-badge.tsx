// Original — Frictionborn Motion EmberBadge (ported from the component lab, e2 · Ember Notification Badge)
"use client";

import React, { useEffect, useRef } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { Sparks, heat, paletteRamp, rand, relBox, stage } from "@frictionborn/runtime/canvas";

export interface EmberBadgeProps extends React.HTMLAttributes<HTMLDivElement>, CanvasItemProps {
  /** The unread count. A rise makes the ember flare; 0 lets it cool to ash and hides the number. */
  count: number;
  /** Counts above this show as `max+`. */
  max?: number;
  /** What the count counts, for screen readers ("unread messages" → "3 unread messages"). */
  label?: string;
  /** The element the badge sits on (an icon button, an avatar). */
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

/** seconds the ember flickers after a change before it holds steady */
const BREATHE = 3;

export function EmberBadge({ count, max = 99, label = "unread", children, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: EmberBadgeProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef(count);
  const flareRef = useRef<(() => void) | null>(null);
  const { hydrated, reduced, tier } = useItemEnv(maxTier);
  const shown = count > max ? `${max}+` : String(count);

  // the ember: the lab's e2 drawing (heat, flicker, rising sparks); the number's colours are written straight to the element
  const wake = useDrawLoop(
    fxRef,
    (fx, wakeUp) => {
      const root = rootRef.current, num = numRef.current;
      if (!root || !num) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      const pal = paletteRamp(palette, readPalette(root, palette));
      const sp = new Sparks(tier >= 3 ? 300 : 150, palette === "fire" ? null : pal);
      const level = (n: number) => (n ? Math.min(1, 0.6 + n * 0.06) : 0);
      // mounted at rest: steady at the count's heat (it flickers after a change, not on arrival)
      let flare = 0, h0 = level(countRef.current), last = countRef.current, since = BREATHE + 1;
      const pos = () => { const b = relBox(num, fx); return [b.x + b.w / 2, b.y + b.h / 2]; };
      flareRef.current = () => {
        flare = 1;
        h0 = 1;
        const [x, y] = pos();
        sp.burst(x, y, 26, 80, 300);
        num.style.transform = "scale(1.3)";
        window.setTimeout(() => (num.style.transform = ""), 160);
        wakeUp();
      };
      return {
        tick(dt, t) {
          const n = countRef.current;
          if (n !== last) { last = n; since = 0; }
          since += dt;
          flare = Math.max(0, flare - dt * 1.5);
          h0 += (level(n) - h0) * Math.min(1, dt * (n ? 3 : 0.8));
          // the lab's flicker, for a few seconds after each change; then the ember holds steady (an idle badge costs no frames)
          const fade = Math.max(0, 1 - Math.max(0, since - BREATHE) / 0.6);
          const fl = 1 - fade * 0.12 * (1 - Math.sin(t * 7) * Math.sin(t * 2.3));
          const h = Math.min(1, h0 * fl + flare * 0.4);
          num.style.opacity = h0 < 0.05 && !n ? "0" : "1";
          num.style.background = h > 0.08 ? `radial-gradient(circle at 40% 35%, ${heat(pal, 0.75 + h * 0.25)}, ${heat(pal, 0.35 + h * 0.35)})` : "#4a4440";
          num.style.boxShadow = `0 0 ${8 + h * 26}px ${heat(pal, 0.5, h * 0.9)}`;
          num.style.color = h > 0.3 ? "#2a0f04" : "#cfc6bd";
          const [x, y] = pos();
          if (h > 0.3 && fade > 0 && Math.random() < dt * 6 * h) sp.add(x, y - 10, rand(-20, 20), -rand(40, 110), rand(0.5, 1), 1, -30, 0.6);
          sp.step(dt);
          c.g.clearRect(0, 0, c.w, c.h);
          sp.draw(c.g);
          return fade > 0 || sp.n > 0 || flare > 0 || Math.abs(level(n) - h0) > 0.004;
        },
        destroy() {
          flareRef.current = null;
          num.style.cssText = "";
          d.dispose();
        },
      };
    },
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}` },
  );

  // a rise in the count flares the ember; any change wakes the loop
  useEffect(() => {
    if (count > countRef.current) flareRef.current?.();
    countRef.current = count;
    wake();
  }, [count, wake]);

  return (
    <div ref={rootRef} data-frictionborn-item="ember-badge" data-tier={tier} className={`fb-ember-badge ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        /* the effect paints up to 200 px around the control without widening the page (no sideways scroll on phones) */
        .fb-ember-badge { overflow: clip; overflow-clip-margin: 200px; }
        .fb-ember-badge { position: relative; display: inline-grid; place-items: center; }
        .fb-eb-fx { position: absolute; left: 50%; top: 50%; width: 220px; height: 220px; transform: translate(-30%, -70%); pointer-events: none; }
        .fb-eb-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-eb-num { position: absolute; top: -10px; right: -12px; min-width: 30px; height: 30px; padding: 0 8px; border-radius: 999px; display: grid; place-items: center;
          font: 700 14px ui-monospace, "Geist Mono", monospace; color: #2a0f04; pointer-events: none;
          background: radial-gradient(circle at 40% 35%, var(--fb-heat-3, #FFB15C), var(--fb-heat-2, #E8590C)); box-shadow: 0 0 18px color-mix(in srgb, var(--fb-heat-2, #E8590C) 70%, transparent); }
        [data-motion="ok"] .fb-eb-num { transition: transform 0.2s; }
        .fb-eb-num[data-zero="true"] { visibility: hidden; }
        .fb-eb-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }
      `}</style>
      {children}
      <div ref={fxRef} className="fb-eb-fx" aria-hidden="true" />
      <span ref={numRef} className="fb-eb-num" aria-hidden="true" data-zero={count === 0}>
        {count ? shown : ""}
      </span>
      <span className="fb-eb-sr" role="status">
        {`${shown} ${label}`}
      </span>
    </div>
  );
}

export default EmberBadge;
