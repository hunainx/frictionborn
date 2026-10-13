// Original — Frictionborn Motion FlintButton (ported from the component lab, a1 · Flint Strike Button)
"use client";

import React, { useImperativeHandle, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, type CanvasItemProps } from "@frictionborn/runtime";
import { Sparks, paletteRamp, rand, relBox, trackPointer, stage } from "@frictionborn/runtime/canvas";

export interface FlintButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">, CanvasItemProps {
  /** The button's label while cold. */
  children: React.ReactNode;
  /** The label once the stone has caught (after enough strikes or a fast rub). */
  litLabel?: React.ReactNode;
  /** Visible heat status under the button, announced politely. Pass `null` to hide it. */
  statusText?: { cold: string; warm: string; hot: string; burning: string } | null;
  /** Receives the <button>. */
  ref?: React.Ref<HTMLButtonElement>;
}

const STATUS = { cold: "Cold stone", warm: "Warm", hot: "Hot", burning: "Burning" };

export function FlintButton({ children, litLabel = "Lit", statusText = STATUS, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, onClick, ref, ...rest }: FlintButtonProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const fxRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const steelRef = useRef<HTMLElement>(null);
  const strikeRef = useRef<(() => void) | null>(null);
  /** the heat as words: changes a handful of times per strike, so it is React state (label and status follow it) */
  const [phase, setPhase] = useState<keyof typeof STATUS>("cold");
  const { hydrated, reduced, tier } = useItemEnv(maxTier);
  useImperativeHandle(ref, () => btnRef.current as HTMLButtonElement);

  // the strike: the lab's a1 drawing (steel rakes the flint, sparks, heat that builds until the stone catches)
  const wake = useDrawLoop(
    fxRef,
    (fx, wakeUp) => {
      const root = rootRef.current, btn = btnRef.current, steel = steelRef.current;
      if (!root || !btn || !steel) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      const sp = new Sparks(tier >= 3 ? 900 : 400, palette === "fire" ? null : paletteRamp(palette, readPalette(root, palette)));
      const p = trackPointer(btn, d, { move: () => wakeUp() });
      let heat = 0, strike = -1, lit = 0, shown = "";
      strikeRef.current = () => { strike = 0; wakeUp(); };
      return {
        tick(dt) {
          const b = relBox(btn, fx);
          if (p.in && p.speed > 260) {
            heat += (dt * p.speed) / 2600;
            if (Math.random() < p.speed / 4000) sp.add(b.x + p.x, b.y + p.y, rand(-80, 80), -rand(40, 160), 0.4, 1, 500);
          }
          if (strike >= 0) {
            strike += dt;
            const u = strike / 0.26;
            if (u <= 1) {
              const x = b.w * (0.08 + 0.84 * u);
              steel.style.visibility = "visible";
              steel.style.transform = `translateX(${x - 23}px) rotate(-14deg)`;
              sp.burst(b.x + x, b.y + 2, 9, 250, 820, { dir: -Math.PI / 2 + 0.55, spread: 0.75, l0: 0.25, l1: 0.7 });
              heat = Math.min(1.5, heat + dt * 3.6);
            } else {
              strike = -1;
              steel.style.visibility = "hidden";
            }
          }
          if (heat > 1 && !lit) {
            lit = 2.4;
            sp.burst(b.x + b.w / 2, b.y + b.h / 2, 60, 150, 600, { l1: 1 });
          }
          if (lit > 0) {
            lit -= dt;
            heat = Math.max(heat, 0.95);
            if (Math.random() < dt * 30) sp.add(b.x + rand(10, b.w - 10), b.y + 4, rand(-20, 20), -rand(40, 120), rand(0.6, 1.4), 1, -40, 0.6);
            if (lit <= 0) { lit = 0; heat = 0.9; }
          }
          heat = Math.max(0, heat - dt * (lit ? 0 : 0.32));
          btn.style.setProperty("--fb-fb-h", Math.min(1, heat).toFixed(3));
          const key = lit ? "burning" : heat > 0.5 ? "hot" : heat > 0.15 ? "warm" : "cold";
          if (key !== shown) {
            shown = key;
            setPhase(key);
          }
          p.decay(dt);
          sp.step(dt);
          c.g.clearRect(0, 0, c.w, c.h);
          sp.draw(c.g);
          return heat > 0.001 || strike >= 0 || lit > 0 || sp.n > 0 || p.speed > 1;
        },
        destroy() {
          strikeRef.current = null;
          btn.style.removeProperty("--fb-fb-h");
          setPhase("cold");
          d.dispose();
        },
      };
    },
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}` },
  );

  return (
    <span ref={rootRef} className="fb-flint-button" style={paletteVars(palette)}>
      <style nonce={nonce}>{`
        /* the effect paints up to 200 px around the control without widening the page (no sideways scroll on phones) */
        .fb-flint-button { overflow: clip; overflow-clip-margin: 200px; }
        .fb-flint-button { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 12px; }
        .fb-fl-fx { display: block; position: absolute; left: 50%; top: 34px; width: 420px; height: 300px; transform: translate(-50%, -70%); pointer-events: none; z-index: 2; }
        .fb-fl-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-fl-btn { --fb-fb-h: 0; position: relative; min-width: 210px; height: 68px; padding: 0 28px; border-radius: 18px; border: 0; cursor: pointer; color: #cfc6bd; font-family: inherit; font-weight: 600; font-size: 16px; line-height: 1; letter-spacing: 0.02em;
          background: radial-gradient(120% 90% at 30% 20%, #57504b, #2c2826 55%, #1a1716);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.12), inset 0 -6px 14px rgba(0,0,0,.5), 0 10px 24px rgba(0,0,0,.5),
            inset 0 0 calc(var(--fb-fb-h) * 46px) color-mix(in srgb, var(--fb-heat-2, #E8590C) calc(var(--fb-fb-h) * 95%), transparent),
            0 0 calc(var(--fb-fb-h) * 46px) color-mix(in srgb, var(--fb-heat-2, #E8590C) calc(var(--fb-fb-h) * 55%), transparent); }
        [data-motion="ok"] .fb-fl-btn { transition: transform 0.12s; }
        .fb-fl-btn:active { transform: translateY(1px) scale(0.985); }
        .fb-fl-btn:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 3px; }
        .fb-fl-btn::before { content: ""; position: absolute; inset: 0; border-radius: inherit; opacity: 0.35; pointer-events: none;
          background: repeating-radial-gradient(circle at 70% 60%, transparent 0 3px, rgba(255,255,255,.04) 3px 4px), repeating-linear-gradient(115deg, transparent 0 9px, rgba(0,0,0,.18) 9px 10px); }
        .fb-fl-text { position: relative; z-index: 1; text-shadow: 0 0 calc(var(--fb-fb-h) * 18px) color-mix(in srgb, var(--fb-heat-3, #FFB15C) calc(var(--fb-fb-h) * 100%), transparent); }
        .fb-fl-steel { position: absolute; left: 0; top: -12px; width: 46px; height: 12px; border-radius: 3px; background: linear-gradient(#e9edf0, #8d959c 50%, #555c62); transform-origin: left center; visibility: hidden; pointer-events: none; box-shadow: 0 2px 6px rgba(0,0,0,.6); }
        .fb-fl-status { font: 11px ui-monospace, "Geist Mono", monospace; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted-foreground, GrayText); }
      `}</style>
      <span ref={fxRef} className="fb-fl-fx" aria-hidden="true" />
      <button
        ref={btnRef}
        type="button"
        data-frictionborn-item="flint-button"
        data-tier={tier}
        className={`fb-fl-btn ${className}`}
        style={style}
        onClick={(e) => {
          strikeRef.current?.();
          wake();
          onClick?.(e);
        }}
        {...rest}
      >
        <span className="fb-fl-text">{phase === "burning" ? litLabel : children}</span>
        <i ref={steelRef} className="fb-fl-steel" aria-hidden="true" />
      </button>
      {statusText && (
        <span className="fb-fl-status" aria-live="polite">
          {statusText[phase]}
        </span>
      )}
    </span>
  );
}

export default FlintButton;
