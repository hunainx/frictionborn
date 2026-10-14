// Original — Frictionborn Motion LightLeakTabs (ported from the component lab, q4 · Light Leak Tabs)
"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, useLatest, type CanvasItemProps } from "@frictionborn/runtime";
import { markDrawn, css, paletteRamp, ramp, relBox, stage } from "@frictionborn/runtime/canvas";

export interface LightLeakTab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface LightLeakTabsProps extends React.HTMLAttributes<HTMLDivElement>, CanvasItemProps {
  tabs: LightLeakTab[];
  /** Controlled selected tab id. */
  value?: string;
  /** Initial tab id when uncontrolled (default: the first tab). */
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Accessible name of the tab list. */
  label: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function LightLeakTabs({ tabs, value, defaultValue, onValueChange, label, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: LightLeakTabsProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.id);
  const selected = value ?? inner;
  const selRef = useLatest(selected);
  const uid = useId().replace(/:/g, "");
  const { hydrated, reduced, tier } = useItemEnv(maxTier);

  // the leak: the lab's q4 drawing (a dark slot; the selected tab lets the firelight through and the light slides after it)
  const wake = useDrawLoop(
    fxRef,
    (fx) => {
      const root = rootRef.current, list = listRef.current;
      if (!root || !list) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      // the drawn light marks the selected tab, so the plain underline steps aside
      markDrawn(root, d);
      const pal = paletteRamp(palette, readPalette(root, palette));
      const fire = palette === "fire";
      const a = fire ? [255, 170, 80] : ramp(pal, 0.82), b = fire ? [255, 120, 40] : ramp(pal, 0.6), core = fire ? [255, 230, 170] : ramp(pal, 0.93);
      let lx = 0, lw = 0, init = false;
      return {
        tick(dt) {
          const btn = list.querySelector<HTMLElement>(`[data-tab="${CSS.escape(selRef.current ?? "")}"]`);
          if (!btn) return false;
          const r = relBox(btn, fx), tx = r.x, tw = r.w;
          if (!init) { lx = tx; lw = tw; init = true; }
          lx += (tx - lx) * Math.min(1, dt * 9);
          lw += (tw - lw) * Math.min(1, dt * 9);
          const lb = relBox(list, fx), g = c.g, y = lb.y + lb.h;
          g.fillStyle = "#0b0a09";
          g.fillRect(0, 0, c.w, c.h);
          g.save();
          g.globalCompositeOperation = "lighter";
          const sl = g.createLinearGradient(0, y - 2, 0, y + 120);
          sl.addColorStop(0, css(a, 0.6));
          sl.addColorStop(0.2, css(b, 0.18));
          sl.addColorStop(1, css(b, 0));
          g.fillStyle = sl;
          g.beginPath();
          g.moveTo(lx + 4, y);
          g.lineTo(lx + lw - 4, y);
          g.lineTo(lx + lw + 60, y + 150);
          g.lineTo(lx - 60, y + 150);
          g.closePath();
          g.fill();
          g.fillStyle = css(core, 0.9);
          g.fillRect(lx + 6, y - 1.5, lw - 12, 3);
          g.restore();
          // the light slides after the selected tab, then holds (an idle tab list costs no frames)
          return Math.abs(tx - lx) > 0.3 || Math.abs(tw - lw) > 0.3;
        },
        destroy: () => d.dispose(),
      };
    },
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}` },
  );

  const select = useCallback(
    (id: string) => {
      if (value === undefined) setInner(id);
      onValueChange?.(id);
      wake();
    },
    [value, onValueChange, wake],
  );

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : n ? (i + n + tabs.length) % tabs.length : -1;
    if (to < 0) return;
    e.preventDefault();
    select(tabs[to].id);
    listRef.current?.querySelectorAll<HTMLElement>("[role=tab]")[to]?.focus();
  };

  return (
    <div ref={rootRef} data-frictionborn-item="light-leak-tabs" data-tier={tier} className={`fb-light-leak-tabs ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        .fb-light-leak-tabs { position: relative; isolation: isolate; display: flex; flex-direction: column; padding: 18px; border-radius: 16px; background: #0b0a09; color: #cfc2b6; overflow: hidden; }
        .fb-llt-fx { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
        .fb-llt-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-llt-list { display: flex; gap: 4px; }
        .fb-llt-tab { flex: 1; min-height: 40px; padding: 0 12px; border-radius: 10px 10px 0 0; border: 1px solid rgba(233, 229, 223, 0.08); border-bottom: 0; background: #141210; color: #a39d97; font: inherit; font-size: 13.5px; cursor: pointer; }
        .fb-llt-tab[aria-selected="true"] { color: #fff3e4; background: #1d1714; box-shadow: inset 0 -3px 0 var(--fb-heat-2, #E8590C); }
        .fb-light-leak-tabs[data-drawn] .fb-llt-tab[aria-selected="true"] { box-shadow: none; }
        .fb-llt-tab:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: -2px; }
        .fb-llt-panel { flex: 1 1 auto; min-height: 120px; border: 1px solid rgba(233, 229, 223, 0.08); border-radius: 0 0 12px 12px; padding: 18px; font-size: 14px; line-height: 1.55; }
        .fb-llt-panel:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 2px; }
      `}</style>
      <div ref={fxRef} className="fb-llt-fx" aria-hidden="true" />
      <div ref={listRef} role="tablist" aria-label={label} className="fb-llt-list">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${uid}-t-${t.id}`}
            data-tab={t.id}
            aria-selected={t.id === selected}
            aria-controls={`${uid}-p`}
            tabIndex={t.id === selected ? 0 : -1}
            className="fb-llt-tab"
            onClick={() => select(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${uid}-p`} aria-labelledby={`${uid}-t-${selected}`} tabIndex={0} className="fb-llt-panel">
        {tabs.find((t) => t.id === selected)?.content}
      </div>
    </div>
  );
}

export default LightLeakTabs;
