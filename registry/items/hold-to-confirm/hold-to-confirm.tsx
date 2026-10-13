// Original — Frictionborn Motion HoldToConfirm (ported from the component lab, c2 · Hold-to-Delete Ash Button)
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { heat, noise, paletteRamp, rand, relBox, stage } from "@frictionborn/runtime/canvas";

export interface HoldToConfirmProps extends React.HTMLAttributes<HTMLDivElement>, CanvasItemProps {
  /** The button's label ("Hold to delete ember.fig"). */
  children: React.ReactNode;
  /** How long the press must be held, in ms. */
  holdMs?: number;
  /** The hold completed: do the action. */
  onConfirm?: () => void;
  /** Shown (and announced) once confirmed. */
  confirmedText?: React.ReactNode;
  /** Label of the button that takes it back. Pass `null` for no undo. */
  undoLabel?: string | null;
  onUndo?: () => void;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

interface Grain { hx: number; hy: number; x: number; y: number; vx: number; vy: number; t: number; on: number }

export function HoldToConfirm({ children, holdMs = 1000, onConfirm, confirmedText = "Done.", undoLabel = "Undo", onUndo, disabled = false, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: HoldToConfirmProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const fxApi = useRef<{ crumble: () => void; rebuild: () => void } | null>(null);
  const timer = useRef(0);
  const { hydrated, reduced, tier } = useItemEnv(maxTier);
  const cb = useRef({ onConfirm, onUndo });
  cb.current = { onConfirm, onUndo };

  // the ash: the lab's c2 drawing (the button breaks into grains that glow, cool and fall left to right; undo gathers them back)
  const wake = useDrawLoop(
    fxRef,
    (fx, wakeUp) => {
      const root = rootRef.current, btn = btnRef.current;
      if (!root || !btn) return null;
      const s = stage(fx, tier);
      if (!s) return null;
      const { d, c } = s;
      const pal = paletteRamp(palette, readPalette(root, palette));
      const back = palette === "fire" ? [194, 65, 12] : pal[2][1];
      let P: Grain[] = [], state: "idle" | "ash" | "back" = "idle", st = 0;
      const step = tier >= 3 ? 2.5 : 3.5;
      fxApi.current = {
        crumble() {
          const r = relBox(btn, fx);
          P = [];
          for (let y = 0; y < r.h; y += step) for (let x = 0; x < r.w; x += step) P.push({ hx: r.x + x, hy: r.y + y, x: r.x + x, y: r.y + y, vx: 0, vy: 0, t: (x / r.w) * 0.7 + Math.random() * 0.15, on: 0 });
          state = "ash";
          st = 0;
          wakeUp();
        },
        rebuild() {
          if (!P.length) return;
          state = "back";
          st = 0;
          wakeUp();
        },
      };
      return {
        tick(dt, t) {
          const g = c.g;
          g.clearRect(0, 0, c.w, c.h);
          if (state === "idle") return false;
          st += dt;
          for (const q of P) {
            if (state === "ash") {
              if (st > q.t) {
                if (!q.on) { q.on = 1; q.vx = rand(10, 80); q.vy = rand(-40, 10); }
                q.vy += 90 * dt;
                q.vx += (noise(q.x * 0.03, t) - 0.4) * 120 * dt;
                q.x += q.vx * dt;
                q.y += q.vy * dt;
              }
            } else {
              q.x += (q.hx - q.x) * Math.min(1, dt * 6);
              q.y += (q.hy - q.y) * Math.min(1, dt * 6);
            }
            const age = state === "ash" ? st - q.t : 0;
            if (state === "ash" && age > 0 && age < 0.35) g.fillStyle = heat(pal, 0.9 - age * 1.6);
            else if (state === "ash" && age > 0) g.fillStyle = `rgba(120,112,106,${Math.max(0, 1 - (age - 0.35) / 2)})`;
            else g.fillStyle = state === "back" ? `rgba(${back[0]},${back[1]},${back[2]},${0.5 + 0.5 * Math.min(1, st * 2)})` : "#3a1712";
            g.fillRect(q.x, q.y, 2.4, 2.4);
          }
          if (state === "back" && st > 0.7) {
            state = "idle";
            P = [];
            g.clearRect(0, 0, c.w, c.h);
            return false;
          }
          // the grains have fallen and faded about 3 s after the hold
          if (state === "ash" && st > 3.2) {
            g.clearRect(0, 0, c.w, c.h);
            return false;
          }
          return true;
        },
        destroy() {
          fxApi.current = null;
          d.dispose();
        },
      };
    },
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}` },
  );

  const confirm = useCallback(() => {
    setHolding(false);
    setDone(true);
    fxApi.current?.crumble();
    cb.current.onConfirm?.();
  }, []);

  const start = useCallback(() => {
    if (disabled || done) return;
    setHolding(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(confirm, holdMs);
  }, [disabled, done, holdMs, confirm]);
  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    setHolding(false);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // once confirmed, focus moves to Undo (the button it replaced is gone); after undo it comes back to the button
  const wasDone = useRef(false);
  useEffect(() => {
    if (done) undoRef.current?.focus({ preventScroll: true });
    else if (wasDone.current) btnRef.current?.focus({ preventScroll: true });
    wasDone.current = done;
  }, [done]);

  const undo = () => {
    setDone(false);
    fxApi.current?.rebuild();
    wake();
    cb.current.onUndo?.();
  };

  return (
    <div ref={rootRef} data-frictionborn-item="hold-to-confirm" data-tier={tier} className={`fb-hold-to-confirm ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        /* the effect paints up to 200 px around the control without widening the page (no sideways scroll on phones) */
        .fb-hold-to-confirm { overflow: clip; overflow-clip-margin: 200px; }
        .fb-hold-to-confirm { position: relative; display: inline-grid; justify-items: center; gap: 12px; }
        .fb-htc-fx { position: absolute; left: 50%; top: 50%; width: calc(100% + 240px); height: 260px; transform: translate(-50%, -40%); pointer-events: none; z-index: 2; }
        .fb-htc-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-htc-btn { position: relative; min-height: 52px; padding: 0 26px; border-radius: 14px; border: 1px solid color-mix(in srgb, var(--fb-heat-2, #E8590C) 45%, transparent); background: #2a1210; color: #ffd9cf;
          font-family: inherit; font-weight: 600; font-size: 15px; cursor: pointer; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
        .fb-htc-btn:disabled { cursor: not-allowed; opacity: 0.55; }
        .fb-htc-btn:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 3px; }
        .fb-htc-btn > span { position: relative; }
        .fb-htc-btn::before { content: ""; position: absolute; inset: 0; transform-origin: left; transform: scaleX(0); background: linear-gradient(90deg, var(--fb-heat-1, #7A1D10), var(--fb-heat-2, #C2410C)); transition: transform 0.25s ease-out; }
        .fb-htc-btn[data-holding="true"]::before { transform: scaleX(1); transition: transform var(--fb-htc-ms) linear; }
        .fb-htc-btn[hidden] { display: none; }
        .fb-htc-done { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--foreground, #cfc4b9); }
        .fb-htc-undo { min-height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(233, 229, 223, 0.18); background: #1d1a18; color: #E9E5DF; font: inherit; font-size: 13px; cursor: pointer; }
        .fb-htc-undo:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 2px; }
      `}</style>
      <div ref={fxRef} className="fb-htc-fx" aria-hidden="true" />
      <button
        ref={btnRef}
        type="button"
        className="fb-htc-btn"
        hidden={done}
        disabled={disabled}
        data-holding={holding}
        style={{ ["--fb-htc-ms" as string]: `${holdMs}ms` }}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") stop();
        }}
        onBlur={stop}
      >
        <span>{children}</span>
      </button>
      <div role="status" className="fb-htc-done">
        {done && (
          <>
            <span>{confirmedText}</span>
            {undoLabel && (
              <button ref={undoRef} type="button" className="fb-htc-undo" onClick={undo}>
                {undoLabel}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HoldToConfirm;
