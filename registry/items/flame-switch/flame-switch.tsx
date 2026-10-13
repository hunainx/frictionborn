// Original — Frictionborn Motion FlameSwitch (ported from the component lab, b3 · Pilot Flame Switch)
"use client";

import React, { useCallback, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { Fire, Smoke, css, paletteRamp, ramp, rand, relBox, trackPointer, stage } from "@frictionborn/runtime/canvas";

export interface FlameSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">, CanvasItemProps {
  /** Controlled state. Leave undefined to let the switch keep its own state. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called with the new state when the switch is pressed. */
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible name of the switch (required: it is the only name the control has). */
  label: string;
  /** Visible status under the switch, by state. Pass `null` to hide it. */
  statusText?: { on: string; off: string } | null;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const STATUS = { on: "Pilot on", off: "Pilot off" };

export function FlameSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  statusText = STATUS,
  disabled = false,
  palette = "fire",
  paused = false,
  maxTier = 3,
  nonce,
  className = "",
  style,
  ref,
  ...rest
}: FlameSwitchProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const onRef = useRef(on);
  onRef.current = on;
  const puff = useRef<(() => void) | null>(null);

  const { hydrated, reduced, tier } = useItemEnv(maxTier);

  // the flame: the lab's b3 drawing, on its own canvas around the switch
  const wake = useDrawLoop(
    fxRef,
    (fx, wakeUp) => {
      const root = rootRef.current, btn = btnRef.current;
      const knob = btn?.querySelector("i");
      if (!root || !btn || !knob) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      const pal = paletteRamp(palette, readPalette(root, palette));
      // the lab's own glow colours for `fire`; other palettes take the same positions on their ramp
      const fire1 = palette === "fire";
      const glow = fire1 ? [255, 120, 40] : ramp(pal, 0.62);
      const fire = new Fire(tier >= 3 ? 300 : 150), smoke = new Smoke(60);
      const p = trackPointer(root, d, { move: () => wakeUp() });
      let f = onRef.current ? 1 : 0, lean = 0;
      const at = () => { const k = relBox(knob, fx); return { x: k.x + 16, y: k.y + 10 }; };
      puff.current = () => {
        const k = relBox(knob, fx);
        for (let i = 0; i < 6; i++) smoke.add(k.x + 16, k.y, 8, { vy: -rand(30, 60), a: 0.3 });
        wakeUp();
      };
      return {
        tick(dt) {
          const want = onRef.current ? 1 : 0;
          f += (want - f) * Math.min(1, dt * (want ? 4 : 9));
          const { x, y } = at();
          let wind = 0;
          if (p.in) {
            const dx = x - p.x, dy = y - p.y, dd = Math.hypot(dx, dy);
            if (dd < 140) wind = (dx / (dd + 1)) * Math.min(400, p.speed) * (1 - dd / 140);
          }
          lean += (wind * 0.25 - lean) * Math.min(1, dt * 6);
          if (f > 0.05) for (let i = 0; i < 3; i++) fire.add(x + rand(-3, 3), y, rand(5, 9) * f, lean * 0.4 + rand(-6, 6), -rand(40, 80) * f, rand(0.3, 0.55), 1);
          const g = c.g;
          g.clearRect(0, 0, c.w, c.h);
          if (f > 0.02) {
            const gl = g.createRadialGradient(x, y - 10, 0, x, y - 10, 120 * f);
            gl.addColorStop(0, css(glow, 0.2 * f));
            gl.addColorStop(1, css(glow, 0));
            g.fillStyle = gl;
            g.fillRect(0, 0, c.w, c.h);
          }
          fire.step(dt, -40, lean);
          fire.draw(g, pal, 0.6);
          smoke.step(dt, lean * 0.3);
          smoke.draw(g);
          p.decay(dt);
          // keep going while the flame burns (motion allowed), while it is still fading, or while smoke and flame blobs remain
          const settling = Math.abs(want - f) > 0.002 || Math.abs(lean) > 0.01 || p.speed > 1;
          return want === 1 || settling || fire.n > 0 || smoke.n > 0;
        },
        destroy() {
          puff.current = null;
          d.dispose();
        },
      };
    },
    // reduced motion, Save-Data and tier 0: the switch alone (DESIGN.md A3 `static`)
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}` },
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !onRef.current;
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
    if (!next) puff.current?.();
    wake();
  }, [checked, disabled, onCheckedChange, wake]);

  return (
    <div
      ref={rootRef}
      data-frictionborn-item="flame-switch"
      data-tier={tier}
      className={`fb-flame-switch ${className}`}
      style={{ ...paletteVars(palette), ...style }}
      {...rest}
    >
      <style nonce={nonce}>{`
        /* the effect paints up to 200 px around the control without widening the page (no sideways scroll on phones) */
        .fb-flame-switch { overflow: clip; overflow-clip-margin: 200px; }
        .fb-flame-switch { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 12px; }
        .fb-flame-switch .fb-fs-fx { position: absolute; left: 50%; top: 22px; width: 340px; height: 260px; transform: translate(-50%, -62%); pointer-events: none; }
        .fb-flame-switch .fb-fs-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-fs-btn { position: relative; width: 96px; height: 44px; padding: 0; border-radius: 999px; border: 1px solid rgba(233, 229, 223, 0.18); background: #191614; cursor: pointer; transition: background 0.3s, border-color 0.3s; }
        .fb-fs-btn[aria-checked="true"] { background: color-mix(in srgb, var(--fb-heat-1, #7A1D10) 45%, #191614); border-color: color-mix(in srgb, var(--fb-heat-2, #E8590C) 55%, transparent); }
        .fb-fs-btn:disabled { cursor: not-allowed; opacity: 0.55; }
        .fb-fs-btn:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 3px; }
        .fb-fs-btn i { position: absolute; top: 5px; left: 6px; width: 32px; height: 32px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #f5efe6, #b8b0a6); }
        [data-motion="ok"] .fb-fs-btn i { transition: transform 0.35s cubic-bezier(0.3, 1.4, 0.5, 1); }
        .fb-fs-btn[aria-checked="true"] i { transform: translateX(50px); }
        .fb-fs-status { font-family: ui-monospace, "Geist Mono", monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted-foreground, GrayText); }
      `}</style>
      <div ref={fxRef} className="fb-fs-fx" aria-hidden="true" />
      <button ref={btnRef} type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className="fb-fs-btn" onClick={toggle}>
        <i />
      </button>
      {statusText && <span className="fb-fs-status">{on ? statusText.on : statusText.off}</span>}
    </div>
  );
}

export default FlameSwitch;
