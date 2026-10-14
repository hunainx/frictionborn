// Original — Frictionborn Motion FuseToast (ported from the component lab, v3 · Undo Fuse Toast)
"use client";

import React, { useEffect, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, useLatest, type CanvasItemProps } from "@frictionborn/runtime";
import { Sparks, paletteRamp, relBox, stage } from "@frictionborn/runtime/canvas";

export interface FuseToastProps extends React.HTMLAttributes<HTMLDivElement>, CanvasItemProps {
  /** Show the toast; the fuse starts burning each time it opens. */
  open: boolean;
  /** What happened ("Message archived."). */
  message: React.ReactNode;
  /** The action offered while the fuse burns. */
  actionLabel?: string;
  /** The visitor pressed the action before the fuse burnt out (undo). */
  onAction?: () => void;
  /** The fuse burnt out: commit the action. */
  onExpire?: () => void;
  /** Shown for a moment after the fuse burns out, before the toast closes. */
  expiredMessage?: React.ReactNode;
  /** Called when the toast should close (after the action, or after the expired message). */
  onClose?: () => void;
  /** Fuse length in ms. The fuse stops while the pointer is over the toast or focus is inside it. */
  duration?: number;
  ref?: React.Ref<HTMLDivElement>;
}

/** the lit fuse head: a soft glow and a white-hot bead (the lab's fbFuseHead) */
function drawHead(g: CanvasRenderingContext2D, x: number, y: number, glow: string, glow0: string, bead: string, bead0: string) {
  g.save();
  g.globalCompositeOperation = "lighter";
  let gr = g.createRadialGradient(x, y, 0, x, y, 26);
  gr.addColorStop(0, glow);
  gr.addColorStop(1, glow0);
  g.fillStyle = gr;
  g.fillRect(x - 26, y - 26, 52, 52);
  gr = g.createRadialGradient(x, y, 0, x, y, 6);
  gr.addColorStop(0, "#fff");
  gr.addColorStop(0.5, bead);
  gr.addColorStop(1, bead0);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, 6, 0, 7);
  g.fill();
  g.restore();
}

export function FuseToast({ open, message, actionLabel = "Undo", onAction, onExpire, expiredMessage, onClose, duration = 5000, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: FuseToastProps) {
  const rootRef = useItemRef(ref);
  const cardRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const [expired, setExpired] = useState(false);
  const hold = useRef(false);
  /** burnt share of the fuse, 0..1, advanced by the timer below (so it expires at every tier, canvas or not) */
  const burnt = useRef(0);
  /** the action was taken: the fuse stops and nothing commits */
  const acted = useRef(false);
  const { hydrated, reduced, tier } = useItemEnv(maxTier);
  const cb = useLatest({ onExpire, onClose });
  // a fresh fuse each time the toast opens (state reset when the prop changes, during render: React's documented pattern)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setExpired(false);
  }

  // the fuse: the lab's v3 drawing along the toast's bottom edge
  const wake = useDrawLoop(
    fxRef,
    (fx) => {
      const root = rootRef.current, card = cardRef.current;
      if (!root || !card) return null;
      const s = stage(fx, tier, root);
      if (!s) return null;
      const { d, c } = s;
      const fire = palette === "fire";
      const pal = paletteRamp(palette, readPalette(root, palette));
      const sp = new Sparks(tier >= 3 ? 300 : 150, fire ? null : pal);
      const glow = fire ? "rgba(255,150,60,.5)" : `rgba(${pal[3][1].join(",")},.5)`;
      const glow0 = fire ? "rgba(255,100,30,0)" : `rgba(${pal[2][1].join(",")},0)`;
      const bead = fire ? "rgba(255,210,120,.9)" : `rgba(${pal[3][1].join(",")},.9)`;
      const bead0 = fire ? "rgba(255,140,40,0)" : `rgba(${pal[2][1].join(",")},0)`;
      return {
        tick(dt) {
          const g = c.g;
          g.clearRect(0, 0, c.w, c.h);
          if (!card.isConnected || card.hidden) return sp.n > 0;
          const r = relBox(card, fx), x0 = r.x + 10, x1 = r.x + r.w - 10, y = r.y + r.h - 5;
          const u = Math.min(1, burnt.current), hx = x1 - (x1 - x0) * u;
          g.lineCap = "round";
          g.strokeStyle = "#7d5d3b";
          g.lineWidth = 3.4;
          g.beginPath();
          g.moveTo(x0, y);
          g.lineTo(hx, y);
          g.stroke();
          g.strokeStyle = "#4e3822";
          g.setLineDash([2, 3]);
          g.stroke();
          g.setLineDash([]);
          g.strokeStyle = "#8a7f74";
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(hx, y);
          g.lineTo(x1, y);
          g.stroke();
          const burning = u < 1 && !hold.current;
          if (u < 1) drawHead(g, hx, y, glow, glow0, bead, bead0);
          if (burning) sp.burst(hx, y, 3, 50, 220, { l0: 0.1, l1: 0.35, w0: 0.5, w1: 1, grav: 400 });
          sp.step(dt);
          sp.draw(g);
          return burning || sp.n > 0;
        },
        destroy: () => d.dispose(),
      };
    },
    { enabled: hydrated && tier > 0 && !reduced, paused, key: `${tier}:${palette}` },
  );

  // the timer: a fresh fuse each time the toast opens; it stops while hovered or focused; at the end it commits
  useEffect(() => {
    if (!open) return;
    burnt.current = 0;
    acted.current = false;
    let last = performance.now(), closeT = 0;
    const id = window.setInterval(() => {
      const now = performance.now();
      if (acted.current) return window.clearInterval(id);
      if (!hold.current && !paused) burnt.current += (now - last) / duration;
      last = now;
      if (burnt.current >= 1) {
        window.clearInterval(id);
        setExpired(true);
        cb.current.onExpire?.();
        closeT = window.setTimeout(() => cb.current.onClose?.(), 1200);
      }
    }, 50);
    wake();
    return () => {
      window.clearInterval(id);
      window.clearTimeout(closeT);
    };
  }, [open, duration, paused, wake, cb]);

  const holdStart = () => {
    hold.current = true;
    wake();
  };
  const holdEnd = () => {
    hold.current = false;
    wake();
  };

  return (
    <div ref={rootRef} data-frictionborn-item="fuse-toast" data-tier={tier} className={`fb-fuse-toast ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        /* the effect paints up to 200 px around the control without widening the page (no sideways scroll on phones) */
        .fb-fuse-toast { overflow: clip; overflow-clip-margin: 200px; }
        .fb-fuse-toast { position: relative; }
        .fb-ft-fx { position: absolute; inset: -30px -20px; pointer-events: none; z-index: 3; }
        .fb-ft-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-ft-card { position: relative; display: flex; align-items: center; gap: 10px; padding: 12px 14px 16px; border-radius: 12px; background: #efe6d6; color: #2a2018; font-size: 14px; z-index: 2; }
        .fb-ft-card[hidden] { display: none; }
        .fb-ft-card > span { flex: 1; }
        .fb-ft-btn { min-height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid #2a2018; background: #2a2018; color: #efe6d6; font: inherit; font-size: 13px; cursor: pointer; }
        .fb-ft-btn:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 2px; }
        .fb-ft-card::after { content: ""; position: absolute; left: 10px; right: 10px; bottom: 4px; height: 2px; border-radius: 2px; background: #8a7f74; }
        .fb-fuse-toast[data-drawn] .fb-ft-card::after { display: none; }
      `}</style>
      <div ref={fxRef} className="fb-ft-fx" aria-hidden="true" />
      <div role="status" aria-live="polite">
        <div ref={cardRef} className="fb-ft-card" hidden={!open} onPointerEnter={holdStart} onPointerLeave={holdEnd} onFocus={holdStart} onBlur={holdEnd}>
          <span>{expired && expiredMessage ? expiredMessage : message}</span>
          {!expired && (
            <button
              type="button"
              className="fb-ft-btn"
              onClick={() => {
                acted.current = true;
                onAction?.();
                onClose?.();
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FuseToast;
