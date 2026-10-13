// Original — Frictionborn Motion TemperSlider (ported from the component lab, g2 · Temper Colour Slider)
"use client";

import React, { useCallback, useRef, useState } from "react";
import { paletteVars, readPalette, useDrawLoop, useItemEnv, useItemRef, type CanvasItemProps } from "@frictionborn/runtime";
import { markDrawn, css, stage } from "@frictionborn/runtime/canvas";

export interface TemperSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">, CanvasItemProps {
  /** Controlled temperature in °C (180–360). */
  value?: number;
  /** Initial temperature when uncontrolled. */
  defaultValue?: number;
  onValueChange?: (celsius: number) => void;
  /** Accessible name of the slider. */
  label?: string;
  step?: number;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const MIN = 180, MAX = 360;
/** the oxide colours of tempered steel by temperature (°C), as in the lab */
const T: Array<[number, [number, number, number], string]> = [
  [180, [196, 200, 206], "Bright steel"], [200, [232, 214, 160], "Pale straw"], [220, [222, 186, 110], "Straw"], [240, [196, 140, 60], "Dark straw"],
  [255, [168, 96, 52], "Bronze"], [265, [140, 60, 70], "Purple"], [285, [70, 70, 160], "Dark blue"], [300, [70, 120, 200], "Blue"],
  [330, [120, 150, 170], "Grey blue"], [360, [128, 132, 136], "Grey"],
];
/** the oxide colour and its name at v °C */
export function temperAt(v: number): [number[], string] {
  for (let i = 1; i < T.length; i++)
    if (v <= T[i][0]) {
      const a = T[i - 1], b = T[i], f = (v - a[0]) / (b[0] - a[0]);
      return [[0, 1, 2].map((j) => a[1][j] + (b[1][j] - a[1][j]) * f), f < 0.5 ? a[2] : b[2]];
    }
  return [T[T.length - 1][1], "Grey"];
}

/** the oxide colour, lightened just enough to read at 4.5:1 on the slider's near-black ground (WCAG 1.4.3) */
function readable(c: number[]): number[] {
  const lum = (x: number[]) => x.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  let out = c;
  for (let k = 0; k <= 1 && (lum(out) + 0.05) / 0.0545 < 4.5; k += 0.05) out = c.map((v) => v + (255 - v) * k);
  return out;
}

export function TemperSlider({ value, defaultValue = 250, onValueChange, label = "Tempering temperature in degrees Celsius", step = 1, disabled = false, palette = "fire", paused = false, maxTier = 3, nonce, className = "", style, ref, ...rest }: TemperSliderProps) {
  const rootRef = useItemRef(ref);
  const fxRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const v = Math.min(MAX, Math.max(MIN, value ?? inner));
  const vRef = useRef(v);
  vRef.current = v;
  const focusRef = useRef(false);
  const { hydrated, tier } = useItemEnv(maxTier);
  const [col, name] = temperAt(v);

  // the steel: the lab's g2 drawing. Nothing moves on its own, so every tier draws it; one frame per change
  const wake = useDrawLoop(
    fxRef,
    (fx) => {
      const root = rootRef.current;
      if (!root) return null;
      const s = stage(fx, tier >= 2 ? 3 : tier);
      if (!s) return null;
      const { d, c } = s;
      const ring = palette === "fire" ? [232, 89, 12] : readPalette(root, palette)[2];
      markDrawn(root, d);
      c.onResize(() => draw());
      function draw() {
        const g = c!.g, x0 = 34, x1 = c!.w - 34, y = 78, val = vRef.current, focus = focusRef.current;
        g.clearRect(0, 0, c!.w, c!.h);
        g.font = "500 11px 'Geist Mono', ui-monospace, monospace";
        for (let x = x0; x < x1; x += 2) {
          const [cc] = temperAt(MIN + ((x - x0) / (x1 - x0)) * (MAX - MIN));
          const sh = 0.82 + 0.18 * Math.sin(x * 0.9) * 0.3;
          g.fillStyle = css(cc.map((q) => q * sh));
          g.fillRect(x, y - 26, 2.2, 52);
        }
        const sh = g.createLinearGradient(0, y - 26, 0, y + 26);
        sh.addColorStop(0, "rgba(255,255,255,.35)");
        sh.addColorStop(0.3, "rgba(255,255,255,0)");
        sh.addColorStop(0.7, "rgba(0,0,0,.1)");
        sh.addColorStop(1, "rgba(0,0,0,.45)");
        g.fillStyle = sh;
        g.fillRect(x0, y - 26, x1 - x0, 52);
        g.fillStyle = "rgba(0,0,0,.3)";
        for (const tv of [200, 240, 280, 320]) {
          const x = x0 + ((tv - MIN) / (MAX - MIN)) * (x1 - x0);
          g.fillRect(x, y + 28, 1, 8);
          g.fillStyle = "#8a8580";
          g.fillText(tv + "°", x - 10, y + 50);
          g.fillStyle = "rgba(0,0,0,.3)";
        }
        const X = x0 + ((val - MIN) / (MAX - MIN)) * (x1 - x0), [kc] = temperAt(val);
        g.fillStyle = "rgba(0,0,0,.45)";
        g.beginPath();
        g.ellipse(X, y + 34, 16, 4, 0, 0, 7);
        g.fill();
        g.fillStyle = css(kc);
        g.strokeStyle = focus ? css(ring) : "#f2ede6";
        g.lineWidth = focus ? 3 : 2;
        g.beginPath();
        g.moveTo(X, y - 36);
        g.lineTo(X + 12, y - 48);
        g.lineTo(X - 12, y - 48);
        g.closePath();
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(X, y - 28);
        g.lineTo(X, y + 28);
        g.stroke();
      }
      return {
        tick() {
          draw();
          return false;
        },
        destroy: () => d.dispose(),
      };
    },
    { enabled: hydrated, paused, key: `${tier}:${palette}` },
  );

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (value === undefined) setInner(n);
      onValueChange?.(n);
      wake();
    },
    [value, onValueChange, wake],
  );
  const onFocus = (f: boolean) => () => {
    focusRef.current = f;
    wake();
  };

  return (
    <div ref={rootRef} data-frictionborn-item="temper-slider" data-tier={tier} className={`fb-temper-slider ${className}`} style={{ ...paletteVars(palette), ...style }} {...rest}>
      <style nonce={nonce}>{`
        .fb-temper-slider { position: relative; padding: 24px 24px 22px; border-radius: 16px; background: #0c0b0a; color: #E9E5DF; }
        .fb-ts-kick { font: 500 11px ui-monospace, "Geist Mono", monospace; letter-spacing: 0.12em; color: #8a8580; }
        .fb-ts-stage { position: relative; height: 140px; margin: 0 -24px; }
        .fb-ts-fx { position: absolute; inset: 0; pointer-events: none; }
        .fb-ts-fx > canvas { position: absolute; inset: 0; display: block; }
        .fb-ts-range { position: absolute; left: 24px; right: 24px; top: 56px; width: calc(100% - 48px); height: 44px; margin: 0; cursor: pointer; accent-color: var(--fb-heat-2, #E8590C); }
        /* once the steel is drawn, the native range stays (focus, keys, pointer, screen readers) but paints nothing over it */
        .fb-temper-slider[data-drawn] .fb-ts-range { -webkit-appearance: none; appearance: none; background: transparent; }
        .fb-temper-slider[data-drawn] .fb-ts-range::-webkit-slider-runnable-track { background: transparent; border: 0; }
        .fb-temper-slider[data-drawn] .fb-ts-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 44px; background: transparent; border: 0; }
        .fb-temper-slider[data-drawn] .fb-ts-range::-moz-range-track { background: transparent; border: 0; }
        .fb-temper-slider[data-drawn] .fb-ts-range::-moz-range-thumb { width: 28px; height: 44px; background: transparent; border: 0; }
        .fb-ts-range:disabled { cursor: not-allowed; }
        .fb-ts-range:focus-visible { outline: none; }
        .fb-temper-slider:not([data-drawn]) .fb-ts-range:focus-visible { outline: 2px solid var(--ring, var(--fb-heat-2, #E8590C)); outline-offset: 2px; }
        .fb-ts-out { display: flex; justify-content: space-between; align-items: baseline; }
        .fb-ts-out b { font-weight: 600; font-size: 20px; }
        .fb-ts-out span { font: 13px ui-monospace, "Geist Mono", monospace; }
      `}</style>
      <div className="fb-ts-kick" aria-hidden="true">TEMPER</div>
      <div className="fb-ts-stage">
        <div ref={fxRef} className="fb-ts-fx" aria-hidden="true" />
        <input
          type="range"
          className="fb-ts-range"
          min={MIN}
          max={MAX}
          step={step}
          value={v}
          disabled={disabled}
          aria-label={label}
          aria-valuetext={`${v} degrees, ${name}`}
          onChange={onInput}
          onFocus={onFocus(true)}
          onBlur={onFocus(false)}
        />
      </div>
      <div className="fb-ts-out" aria-hidden="true">
        <b style={{ color: css(readable(col)) }}>{name}</b>
        <span>{v} °C</span>
      </div>
    </div>
  );
}

export default TemperSlider;
