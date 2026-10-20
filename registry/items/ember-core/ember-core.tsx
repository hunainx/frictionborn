// Original — Frictionborn Motion EmberCore wrapper (3D ash & ember filament cloud, lazy WebGL2 behind CSS poster)
"use client";

import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  glBudget,
  paletteVars,
  resolveCssColor,
  useCapability,
  useHydrated,
  useInView,
  usePaused,
  useReducedMotion,
  type Lease,
  type PaletteName,
} from "@frictionborn/runtime";
import type { EmberCorePaletteRGB, RGB } from "./ember-core.gl";

const EmberCoreGL = lazy(() => import("./ember-core.gl"));

export type EmberCoreInteractiveMode = "full" | "hero" | "none";

export interface EmberCoreProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Interaction mode: `"hero"` (default, page-safe with decorative canvas and a real Strike button), `"full"` (focusable canvas with all gestures and controls panel), or `"none"` (ambient only). */
  interactive?: EmberCoreInteractiveMode;
  /** Heat intensity multiplier (`0` to `2`, default `1`). */
  heat?: number;
  /** Pointer vortex swirl multiplier (`0` to `2`, default `1`). */
  swirl?: number;
  /** Idle rotation speed multiplier (`0` to `2`, default `1`). */
  spin?: number;
  /** Ash filament density (`0.2` to `1`, default `1`). */
  density?: number;
  /** Post-processing bloom pass (`true` by default; falls back automatically on Tier 2 if frame budget fails). */
  bloom?: boolean;
  /** Synthesized WebAudio crackle and thump on strike/burst (`false` by default; starts only after a user gesture). */
  sound?: boolean;
  /** Colour palette (`"fire"` default, `"ice"`, `"neon"`, `"mono"`, `"custom"`). */
  palette?: PaletteName;
  /** Universal pause prop: stops idle rotation and auto-strikes while allowing direct visitor gestures to play out. */
  paused?: boolean;
  /** Hard ceiling on the capability tier (`0` to `3`, default `3`). */
  maxTier?: number;
  /** Override reduced-motion behaviour (`still-frame` mode). */
  reducedMotion?: boolean;
  /** Horizontal camera framing offset in world units (for example `-0.32` to centre the cloud slightly right on wide screens). */
  offsetX?: number;
  /** CSP nonce for the scoped `<style>` tag. */
  nonce?: string;
  /** Root `<div>` ref. */
  ref?: React.Ref<HTMLDivElement>;
  /** Optional content layered over the ember cloud. */
  children?: React.ReactNode;
}

const PRESET_RGB: Record<Exclude<PaletteName, "custom">, EmberCorePaletteRGB> = {
  fire: {
    ash: [0.66, 0.63, 0.61],
    ember: [1.0, 0.2, 0.04],
    hot: [1.0, 0.7, 0.32],
    gA: [0.95, 0.12, 0.02],
    gB: [1.0, 0.36, 0.08],
  },
  ice: {
    ash: [0.62, 0.67, 0.73],
    ember: [0.16, 0.5, 1.0],
    hot: [0.78, 0.93, 1.0],
    gA: [0.04, 0.2, 0.9],
    gB: [0.3, 0.68, 1.0],
  },
  neon: {
    ash: [0.64, 0.57, 0.72],
    ember: [1.0, 0.17, 0.84],
    hot: [0.36, 0.95, 1.0],
    gA: [0.72, 0.05, 0.85],
    gB: [0.2, 0.85, 1.0],
  },
  mono: {
    ash: [0.6, 0.6, 0.6],
    ember: [0.92, 0.9, 0.88],
    hot: [1.0, 1.0, 1.0],
    gA: [0.55, 0.53, 0.52],
    gB: [0.9, 0.88, 0.86],
  },
};

function rgbToCss(c: RGB): string {
  return `color(srgb ${c[0]} ${c[1]} ${c[2]})`;
}

function sameRgb(a: RGB, b: RGB): boolean {
  return Math.abs(a[0] - b[0]) < 1e-4 && Math.abs(a[1] - b[1]) < 1e-4 && Math.abs(a[2] - b[2]) < 1e-4;
}

function samePalette(a: EmberCorePaletteRGB, b: EmberCorePaletteRGB): boolean {
  return (
    sameRgb(a.ash, b.ash) &&
    sameRgb(a.ember, b.ember) &&
    sameRgb(a.hot, b.hot) &&
    sameRgb(a.gA, b.gA) &&
    sameRgb(a.gB, b.gB)
  );
}

const FULL_ARIA_LABEL =
  "Ember Core interactive 3D ember cloud. Drag to spin, scroll or pinch to zoom, click or tap to strike, hold to charge and release to burst. Keyboard: arrow keys spin, Space or Enter strikes (hold to charge), plus and minus zoom, P pauses.";

export function EmberCore({
  interactive = "hero",
  heat = 1,
  swirl = 1,
  spin = 1,
  density = 1,
  bloom = true,
  sound = false,
  palette = "fire",
  paused = false,
  maxTier = 3,
  reducedMotion: reducedMotionProp,
  offsetX = 0,
  nonce,
  className = "",
  style,
  children,
  ref,
  ...rest
}: EmberCoreProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const uid = useId();
  const hydrated = useHydrated();
  const cap = useCapability();
  const sysReduced = useReducedMotion();
  const globalPaused = usePaused();
  const inView = useInView(hostRef);

  const isReduced = reducedMotionProp !== undefined ? reducedMotionProp : sysReduced;

  // Internal overrides for "full" interactive controls panel + strike triggers
  const propKey = `${heat}:${swirl}:${spin}:${density}:${bloom}:${sound}:${palette}`;
  const [overrides, setOverrides] = useState<{
    key: string;
    heat?: number;
    swirl?: number;
    spin?: number;
    density?: number;
    bloom?: boolean;
    sound?: boolean;
    palette?: PaletteName;
  }>({ key: propKey });

  const activeOverrides = overrides.key === propKey ? overrides : { key: propKey };
  const curHeat = activeOverrides.heat ?? heat;
  const curSwirl = activeOverrides.swirl ?? swirl;
  const curSpin = activeOverrides.spin ?? spin;
  const curDensity = activeOverrides.density ?? density;
  const curBloom = activeOverrides.bloom ?? bloom;
  const curSound = activeOverrides.sound ?? sound;
  const curPalette = activeOverrides.palette ?? palette;

  const setCurHeat = useCallback((v: number) => {
    setOverrides((prev) => ({ ...(prev.key === propKey ? prev : { key: propKey }), heat: v }));
  }, [propKey]);
  const setCurSwirl = useCallback((v: number) => {
    setOverrides((prev) => ({ ...(prev.key === propKey ? prev : { key: propKey }), swirl: v }));
  }, [propKey]);
  const setCurSpin = useCallback((v: number) => {
    setOverrides((prev) => ({ ...(prev.key === propKey ? prev : { key: propKey }), spin: v }));
  }, [propKey]);
  const setCurDensity = useCallback((v: number) => {
    setOverrides((prev) => ({ ...(prev.key === propKey ? prev : { key: propKey }), density: v }));
  }, [propKey]);
  const setCurBloom = useCallback((updater: boolean | ((b: boolean) => boolean)) => {
    setOverrides((prev) => {
      const base = prev.key === propKey ? prev : { key: propKey };
      const current = base.bloom ?? bloom;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...base, bloom: next };
    });
  }, [propKey, bloom]);
  const setCurSound = useCallback((updater: boolean | ((s: boolean) => boolean)) => {
    setOverrides((prev) => {
      const base = prev.key === propKey ? prev : { key: propKey };
      const current = base.sound ?? sound;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...base, sound: next };
    });
  }, [propKey, sound]);
  const setCurPalette = useCallback((v: PaletteName) => {
    setOverrides((prev) => ({ ...(prev.key === propKey ? prev : { key: propKey }), palette: v }));
  }, [propKey]);

  const [localPaused, setLocalPaused] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [strikeTrigger, setStrikeTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (typeof window !== "undefined") {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToastMsg(""), 1400);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Calm mode attribute observer
  const [calmMode, setCalmMode] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const syncCalm = () => {
      setCalmMode(document.documentElement.hasAttribute("data-fb-calm"));
    };
    syncCalm();
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(syncCalm);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-fb-calm"] });
    return () => mo.disconnect();
  }, []);

  const [leaseGranted, setLeaseGranted] = useState(false);
  const leaseHandleRef = useRef<Lease | null>(null);
  const leaseIdRef = useRef("ember-core-" + uid);
  const [ctxLost, setCtxLost] = useState(false);
  const [stepDowns, setStepDowns] = useState(0);

  // Under prefers-reduced-motion, useCapability().tier is 0, but EmberCore's reduced-motion mode is `still-frame`
  // (renders one static WebGL frame with 0 loop frames when WebGL2 is available and maxTier >= 2).
  const baseCapTier = isReduced && cap.webgl2 && !cap.saveData ? Math.min(2, maxTier) : Math.min(cap.tier, maxTier);
  const effectiveTier = hydrated && !calmMode ? Math.max(0, baseCapTier - stepDowns) : 0;

  const [resolvedColors, setResolvedColors] = useState<EmberCorePaletteRGB>(PRESET_RGB.fire);
  const [isLightTheme, setIsLightTheme] = useState(false);

  const refreshPaletteColors = useCallback(() => {
    const el = hostRef.current;
    const rootEl = typeof document !== "undefined" ? document.documentElement : null;
    const dataTheme = rootEl?.getAttribute("data-theme") || rootEl?.getAttribute("data-mode") || "";
    let nextLight = false;
    if (dataTheme === "light" || rootEl?.classList.contains("light")) {
      nextLight = true;
    } else if (dataTheme === "dark" || rootEl?.classList.contains("dark")) {
      nextLight = false;
    } else if (rootEl && typeof getComputedStyle === "function") {
      const csBg =
        getComputedStyle(el?.parentElement ?? rootEl).backgroundColor ||
        getComputedStyle(rootEl).backgroundColor ||
        "";
      const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(csBg);
      if (m && (m[4] === undefined || Number(m[4]) > 0)) {
        const lum = (0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])) / 255;
        nextLight = lum > 0.5;
      } else {
        const bg =
          resolveCssColor(el?.parentElement ?? rootEl, "var(--background, Canvas)") ??
          resolveCssColor(rootEl, "Canvas");
        if (bg) {
          const lum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
          nextLight = lum > 0.5;
        }
      }
    }
    setIsLightTheme((prev) => (prev === nextLight ? prev : nextLight));

    const fallback = PRESET_RGB[curPalette === "custom" ? "fire" : curPalette] ?? PRESET_RGB.fire;
    if (curPalette !== "custom") {
      setResolvedColors((prev) => (samePalette(prev, fallback) ? prev : fallback));
      return;
    }

    const next: EmberCorePaletteRGB = {
      ash: resolveCssColor(el, `var(--fb-heat-0, ${rgbToCss(fallback.ash)})`) ?? fallback.ash,
      ember: resolveCssColor(el, `var(--fb-heat-2, ${rgbToCss(fallback.ember)})`) ?? fallback.ember,
      hot: resolveCssColor(el, `var(--fb-heat-4, ${rgbToCss(fallback.hot)})`) ?? fallback.hot,
      gA: resolveCssColor(el, `var(--fb-heat-1, ${rgbToCss(fallback.gA)})`) ?? fallback.gA,
      gB: resolveCssColor(el, `var(--fb-heat-3, ${rgbToCss(fallback.gB)})`) ?? fallback.gB,
    };

    setResolvedColors((prev) => (samePalette(prev, next) ? prev : next));
  }, [curPalette]);

  useEffect(() => {
    refreshPaletteColors();
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(refreshPaletteColors);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode", "style"],
    });
    return () => mo.disconnect();
  }, [refreshPaletteColors]);

  const isStopped = paused || localPaused || globalPaused;

  // Release lease when off-screen or low tier so active contexts match budget rules
  const wantsWebGL = hydrated && inView && !calmMode && effectiveTier >= 2;

  useEffect(() => {
    if (!wantsWebGL) {
      if (leaseHandleRef.current) {
        leaseHandleRef.current.release();
        leaseHandleRef.current = null;
        setLeaseGranted(false);
      }
      return;
    }

    const requestLease = () => {
      if (leaseHandleRef.current) return;
      const acquired = glBudget.acquire({
        id: leaseIdRef.current,
        priority: interactive === "hero" ? 2 : 1,
        onEvict: () => {
          leaseHandleRef.current = null;
          setLeaseGranted(false);
        },
      });
      if (acquired) {
        leaseHandleRef.current = acquired;
        setLeaseGranted(true);
        setCtxLost(false);
      }
    };

    requestLease();
    const unsub =
      typeof glBudget.subscribe === "function"
        ? glBudget.subscribe(() => {
            if (!leaseHandleRef.current) requestLease();
          })
        : () => {};

    return () => {
      unsub();
    };
  }, [wantsWebGL, interactive, ctxLost]);

  useEffect(() => {
    return () => {
      if (leaseHandleRef.current) {
        leaseHandleRef.current.release();
        leaseHandleRef.current = null;
      }
    };
  }, []);

  const handleDowngrade = useCallback(() => {
    setStepDowns((d) => d + 1);
  }, []);

  const handleContextLost = useCallback(() => {
    setCtxLost(true);
  }, []);

  const handleContextRestored = useCallback(() => {
    setCtxLost(false);
  }, []);

  const handleStrike = useCallback(() => {
    setStrikeTrigger((n) => n + 1);
  }, []);

  const handleTogglePause = useCallback(() => {
    setLocalPaused((prev) => {
      const next = !(paused || prev);
      showToast(next ? "Paused" : "Playing");
      return next;
    });
  }, [paused, showToast]);

  const handleReset = useCallback(() => {
    setOverrides({
      key: propKey,
      heat: 1,
      swirl: 1,
      spin: 1,
      density: 1,
      bloom: true,
      palette: "fire",
    });
    setLocalPaused(false);
    setResetTrigger((n) => n + 1);
    showToast("Reset");
  }, [propKey, showToast]);

  useImperativeHandle(ref, () => hostRef.current as HTMLDivElement);

  const showGL = leaseGranted && effectiveTier >= 2;
  const emberCss = rgbToCss(resolvedColors.ember);
  const hotCss = rgbToCss(resolvedColors.hot);
  const ashCss = rgbToCss(resolvedColors.ash);
  const gACss = rgbToCss(resolvedColors.gA);
  const posterGradient = isLightTheme
    ? [
        `radial-gradient(28% 26% at var(--ec-px1, 50%) 52%, color-mix(in srgb, ${hotCss} 38%, transparent) 0%, color-mix(in srgb, ${emberCss} 22%, transparent) 44%, transparent 72%)`,
        `radial-gradient(38% 36% at var(--ec-px2, 50%) 48%, color-mix(in srgb, ${gACss} 28%, transparent) 0%, color-mix(in srgb, ${ashCss} 16%, transparent) 52%, transparent 76%)`,
        "radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--fb-heat-0, black) 96%, transparent) 0%, color-mix(in srgb, var(--fb-heat-0, black) 93%, transparent) 34%, color-mix(in srgb, var(--fb-heat-0, black) 82%, transparent) 45%, color-mix(in srgb, var(--fb-heat-0, black) 63%, transparent) 55%, color-mix(in srgb, var(--fb-heat-0, black) 41%, transparent) 64%, color-mix(in srgb, var(--fb-heat-0, black) 21%, transparent) 72%, color-mix(in srgb, var(--fb-heat-0, black) 8%, transparent) 79%, color-mix(in srgb, var(--fb-heat-0, black) 1.5%, transparent) 83%, transparent 86%)",
      ].join(", ")
    : [
        `radial-gradient(38% 36% at var(--ec-px1, 50%) 54%, color-mix(in srgb, ${hotCss} 46%, transparent) 0%, color-mix(in srgb, ${emberCss} 32%, transparent) 38%, transparent 74%)`,
        `radial-gradient(54% 50% at var(--ec-px2, 50%) 48%, color-mix(in srgb, ${gACss} 38%, transparent) 0%, color-mix(in srgb, ${ashCss} 22%, transparent) 54%, transparent 82%)`,
        "radial-gradient(90% 80% at 50% 50%, color-mix(in srgb, var(--fb-heat-0, black) 38%, black) 0%, color-mix(in srgb, var(--fb-heat-0, black) 18%, black) 72%, black 100%)",
      ].join(", ");

  const controlsPanelId = `fb-ec-controls-${uid}`;

  return (
    <div
      ref={hostRef}
      data-frictionborn-item="ember-core"
      data-tier={ isReduced ? 0 : effectiveTier }
      data-interactive={interactive}
      data-theme-mode={isLightTheme ? "light" : "dark"}
      className={`fb-ember-core ${className}`}
      style={{
        ...paletteVars(curPalette),
        "--ec-px1": offsetX < 0 ? "58%" : "50%",
        "--ec-px2": offsetX < 0 ? "56%" : "50%",
        position: "relative",
        width: "100%",
        minHeight: interactive === "full" ? "540px" : "360px",
        overflow: "hidden",
        backgroundColor: isLightTheme
          ? "transparent"
          : "color-mix(in srgb, var(--fb-heat-0, black) 18%, black)",
        color: "color-mix(in srgb, var(--fb-heat-4, white) 92%, silver)",
        ...style,
      } as React.CSSProperties}
      {...rest}
    >
      <style nonce={nonce}>{`
        .fb-ember-core {
          --ec-ink: color-mix(in srgb, var(--fb-heat-4, white) 94%, silver);
          --ec-muted: color-mix(in srgb, var(--fb-heat-4, white) 74%, gray);
          --ec-ember: var(--fb-heat-2, orange);
          --ec-glass: color-mix(in srgb, var(--fb-heat-0, black) 82%, transparent);
          --ec-line: color-mix(in srgb, var(--fb-heat-4, white) 16%, transparent);
          --text: var(--ec-ink);
          --text-2: var(--ec-muted);
          --foreground: var(--ec-ink);
          --muted-foreground: var(--ec-muted);
          isolation: isolate;
          user-select: none;
          -webkit-user-select: none;
          font-family: var(--font-geist), ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        @media (max-width: 767px) {
          .fb-ember-core {
            --ec-px1: 50% !important;
            --ec-px2: 50% !important;
          }
        }
        .fb-ember-core[data-theme-mode="light"] {
          --ec-ink: color-mix(in srgb, var(--fb-heat-0, black) 92%, black);
          --ec-muted: color-mix(in srgb, var(--fb-heat-0, black) 72%, gray);
          --ec-glass: color-mix(in srgb, var(--fb-heat-4, white) 90%, transparent);
          --ec-line: color-mix(in srgb, var(--fb-heat-0, black) 16%, transparent);
        }
        .fb-ember-core[data-theme-mode="light"] .fb-ec-brand,
        .fb-ember-core[data-theme-mode="light"] .fb-ec-caption,
        .fb-ember-core[data-theme-mode="light"] .fb-ec-hints,
        .fb-ember-core[data-theme-mode="light"] .fb-ec-hero-hint,
        .fb-ember-core[data-theme-mode="light"] .fb-ec-panel,
        .fb-ember-core[data-theme-mode="light"] .fb-ec-toast {
          background: var(--ec-glass);
          border-color: var(--ec-line);
          color: var(--ec-ink);
        }
        .fb-ember-core[data-theme-mode="light"] .fb-ec-btn:hover {
          border-color: color-mix(in srgb, var(--fb-heat-2, orange) 55%, transparent);
          background: color-mix(in srgb, var(--fb-heat-4, white) 96%, transparent);
        }
        .fb-ember-core[data-theme-mode="light"] .fb-ec-btn[aria-pressed="true"],
        .fb-ember-core[data-theme-mode="light"] .fb-ec-btn[aria-expanded="true"] {
          border-color: color-mix(in srgb, var(--fb-heat-2, orange) 68%, transparent);
          background: color-mix(in srgb, var(--fb-heat-2, orange) 14%, var(--ec-glass));
          color: var(--ec-ink);
        }
        .fb-ec-poster {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .fb-ec-gl-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .fb-ember-core[data-theme-mode="light"] .fb-ec-gl-wrap {
          -webkit-mask-image: radial-gradient(
            50% 50% at 50% 50%,
            black 0%,
            black 42%,
            color-mix(in srgb, black 82%, transparent) 54%,
            color-mix(in srgb, black 48%, transparent) 65%,
            color-mix(in srgb, black 16%, transparent) 75%,
            transparent 82%
          );
          mask-image: radial-gradient(
            50% 50% at 50% 50%,
            black 0%,
            black 42%,
            color-mix(in srgb, black 82%, transparent) 54%,
            color-mix(in srgb, black 48%, transparent) 65%,
            color-mix(in srgb, black 16%, transparent) 75%,
            transparent 82%
          );
        }
        .fb-ember-core[data-interactive="hero"] .fb-ec-gl-wrap {
          touch-action: pan-y;
        }
        .fb-ember-core[data-interactive="full"] .fb-ec-gl-wrap {
          touch-action: none;
        }
        .fb-ember-core[data-interactive="none"] .fb-ec-gl-wrap {
          pointer-events: none;
        }
        .fb-ec-gl-wrap canvas:focus-visible {
          outline: 2px solid var(--fb-heat-2, orange);
          outline-offset: -3px;
        }
        .fb-ec-vignette {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 44%, color-mix(in srgb, black 52%, transparent) 82%, color-mix(in srgb, black 86%, transparent) 100%);
        }
        .fb-ember-core[data-theme-mode="light"] .fb-ec-vignette {
          background: none;
        }
        .fb-ec-stage {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          min-height: inherit;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(28px, 3.2vw, 36px);
          box-sizing: border-box;
          pointer-events: none;
        }
        .fb-ec-children {
          position: relative;
          z-index: 2;
          pointer-events: none;
        }
        .fb-ec-children a,
        .fb-ec-children button,
        .fb-ec-children input,
        .fb-ec-children select,
        .fb-ec-children textarea,
        .fb-ec-children [role="button"],
        .fb-ec-children [tabindex] {
          pointer-events: auto;
        }
        .fb-ec-hero-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px 16px;
          margin-top: auto;
          padding-top: 16px;
          pointer-events: none;
        }
        .fb-ec-hero-hint {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ec-muted);
          background: color-mix(in srgb, var(--fb-heat-0, black) 76%, transparent);
          border: 1px solid var(--ec-line);
          border-radius: 999px;
          padding: 7px 13px;
        }
        .fb-ec-hint-touch { display: none; }
        @media (pointer: coarse) {
          .fb-ec-hint-fine { display: none; }
          .fb-ec-hint-touch { display: inline; }
        }
        .fb-ec-btn {
          pointer-events: auto;
          appearance: none;
          border: 1px solid var(--ec-line);
          background: var(--ec-glass);
          color: var(--ec-ink);
          padding: 8px 14px;
          min-height: 36px;
          border-radius: 999px;
          font: 500 12px/1 var(--font-geist), ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: border-color 0.2s, background 0.2s, transform 0.12s;
        }
        .fb-ec-btn:hover {
          border-color: color-mix(in srgb, var(--fb-heat-2, orange) 55%, transparent);
          background: color-mix(in srgb, var(--fb-heat-1, black) 32%, var(--ec-glass));
        }
        .fb-ec-btn:active {
          transform: scale(0.97);
        }
        .fb-ec-btn[aria-pressed="true"],
        .fb-ec-btn[aria-expanded="true"] {
          border-color: color-mix(in srgb, var(--fb-heat-2, orange) 72%, transparent);
          background: color-mix(in srgb, var(--fb-heat-2, orange) 24%, transparent);
        }
        .fb-ec-btn:focus-visible {
          outline: 2px solid var(--fb-heat-2, orange);
          outline-offset: 2px;
        }
        .fb-ec-full-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .fb-ec-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ec-ink);
          background: color-mix(in srgb, var(--fb-heat-0, black) 76%, transparent);
          border: 1px solid var(--ec-line);
          border-radius: 999px;
          padding: 7px 13px;
        }
        .fb-ec-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--ec-ember);
          box-shadow: 0 0 10px var(--ec-ember);
        }
        .fb-ec-caption {
          max-width: 390px;
          background: color-mix(in srgb, var(--fb-heat-0, black) 78%, transparent);
          border: 1px solid var(--ec-line);
          border-radius: 14px;
          padding: 12px 15px;
        }
        .fb-ember-core .fb-ec-kicker {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ec-muted);
          margin: 0 0 5px;
        }
        .fb-ember-core .fb-ec-sub {
          font-size: 13px;
          line-height: 1.45;
          color: var(--ec-ink);
          margin: 0;
        }
        .fb-ec-full-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: auto;
        }
        .fb-ec-hints {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ec-ink);
          background: color-mix(in srgb, var(--fb-heat-0, black) 78%, transparent);
          border: 1px solid var(--ec-line);
          border-radius: 12px;
          padding: 8px 12px;
        }
        .fb-ec-hints span {
          color: var(--ec-muted);
          margin-left: 3px;
        }
        .fb-ec-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          pointer-events: auto;
        }
        .fb-ec-panel {
          pointer-events: auto;
          width: min(320px, calc(100vw - 40px));
          background: color-mix(in srgb, var(--fb-heat-0, black) 92%, transparent);
          border: 1px solid var(--ec-line);
          border-radius: 16px;
          padding: 14px 16px;
          display: grid;
          gap: 11px;
          margin-left: auto;
          margin-block: 12px;
        }
        .fb-ec-panel[hidden] {
          display: none !important;
        }
        .fb-ec-row {
          display: grid;
          grid-template-columns: 92px 1fr 38px;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ec-muted);
        }
        .fb-ec-row output {
          text-align: right;
          font-variant-numeric: tabular-nums;
          color: var(--ec-ink);
        }
        .fb-ec-row input[type="range"] {
          width: 100%;
          accent-color: var(--ec-ember);
          cursor: pointer;
        }
        .fb-ec-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding-top: 2px;
        }
        .fb-ec-chip {
          flex: 1;
          min-width: 56px;
          justify-content: center;
          padding: 7px 10px;
          font-size: 11px;
        }
        .fb-ec-toast {
          position: absolute;
          left: 50%;
          bottom: 72px;
          transform: translateX(-50%);
          padding: 6px 12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--fb-heat-0, black) 90%, transparent);
          border: 1px solid var(--ec-line);
          color: var(--ec-ink);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          pointer-events: none;
        }
        .fb-ec-toast[data-show="false"] {
          display: none;
        }
        @media (max-width: 640px) {
          .fb-ec-hints { display: none; }
          .fb-ec-caption { max-width: 100%; }
        }
      `}</style>

      <div
        data-frictionborn-poster="true"
        aria-hidden="true"
        className="fb-ec-poster"
        style={{ background: posterGradient }}
      />

      {showGL && (
        <Suspense fallback={null}>
          <EmberCoreGL
            colors={resolvedColors}
            interactive={interactive}
            heat={curHeat}
            swirl={curSwirl}
            spin={curSpin}
            density={curDensity}
            bloom={curBloom}
            sound={curSound}
            paused={isStopped}
            reducedMotion={isReduced}
            tier={effectiveTier}
            offsetX={offsetX}
            lightTheme={isLightTheme}
            suspended={ctxLost}
            strikeTrigger={strikeTrigger}
            resetTrigger={resetTrigger}
            ariaLabel={interactive === "full" ? FULL_ARIA_LABEL : undefined}
            onToast={showToast}
            onTogglePause={handleTogglePause}
            onDowngrade={handleDowngrade}
            onContextLost={handleContextLost}
            onContextRestored={handleContextRestored}
          />
        </Suspense>
      )}

      <div aria-hidden="true" className="fb-ec-vignette" />

      <div className="fb-ec-stage">
        {interactive === "full" ? (
          <>
            <div className="fb-ec-full-top">
              <div className="fb-ec-brand">
                <span className="fb-ec-dot" aria-hidden="true" />
                <span>Ember Core</span>
              </div>
              {children ? (
                <div className="fb-ec-children">{children}</div>
              ) : (
                <div className="fb-ec-caption">
                  <p className="fb-ec-kicker">Three-dimensional ash &amp; ember field · real-time WebGL</p>
                  <p className="fb-ec-sub">
                    Drag to spin in any direction. Hover to stir a vortex. Click for a shockwave; hold to charge and release to burst.
                  </p>
                </div>
              )}
            </div>

            <section
              id={controlsPanelId}
              className="fb-ec-panel"
              aria-label="Controls"
              hidden={!controlsOpen}
            >
              <div className="fb-ec-row">
                <label htmlFor={`${uid}-heat`}>Heat</label>
                <input
                  id={`${uid}-heat`}
                  type="range"
                  min={0}
                  max={2}
                  step={0.02}
                  value={curHeat}
                  onChange={(e) => setCurHeat(parseFloat(e.target.value))}
                />
                <output htmlFor={`${uid}-heat`}>{curHeat.toFixed(2)}</output>
              </div>
              <div className="fb-ec-row">
                <label htmlFor={`${uid}-swirl`}>Swirl</label>
                <input
                  id={`${uid}-swirl`}
                  type="range"
                  min={0}
                  max={2}
                  step={0.02}
                  value={curSwirl}
                  onChange={(e) => setCurSwirl(parseFloat(e.target.value))}
                />
                <output htmlFor={`${uid}-swirl`}>{curSwirl.toFixed(2)}</output>
              </div>
              <div className="fb-ec-row">
                <label htmlFor={`${uid}-spin`}>Spin</label>
                <input
                  id={`${uid}-spin`}
                  type="range"
                  min={0}
                  max={2}
                  step={0.02}
                  value={curSpin}
                  onChange={(e) => setCurSpin(parseFloat(e.target.value))}
                />
                <output htmlFor={`${uid}-spin`}>{curSpin.toFixed(2)}</output>
              </div>
              <div className="fb-ec-row">
                <label htmlFor={`${uid}-density`}>Ash density</label>
                <input
                  id={`${uid}-density`}
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.02}
                  value={curDensity}
                  onChange={(e) => setCurDensity(parseFloat(e.target.value))}
                />
                <output htmlFor={`${uid}-density`}>{ `${Math.round(curDensity * 100)}%` }</output>
              </div>
              <div className="fb-ec-chips" role="group" aria-label="Colour palette">
                {(["fire", "ice", "neon", "mono"] as const).map((pName) => (
                  <button
                    key={pName}
                    type="button"
                    aria-pressed={curPalette === pName}
                    className="fb-ec-btn fb-ec-chip"
                    onClick={() => {
                      setCurPalette(pName);
                      showToast(`Palette: ${pName}`);
                    }}
                  >
                    {pName.charAt(0).toUpperCase() + pName.slice(1)}
                  </button>
                ))}
              </div>
              <div className="fb-ec-chips">
                <button
                  type="button"
                  className="fb-ec-btn fb-ec-chip"
                  aria-pressed={curSound}
                  onClick={() => {
                    setCurSound((s) => {
                      const next = !s;
                      showToast(next ? "Sound on" : "Sound off");
                      return next;
                    });
                  }}
                >
                  {curSound ? "Sound on" : "Sound off"}
                </button>
                <button
                  type="button"
                  className="fb-ec-btn fb-ec-chip"
                  aria-pressed={curBloom}
                  onClick={() => {
                    setCurBloom((b) => {
                      const next = !b;
                      showToast(next ? "Glow on" : "Glow off");
                      return next;
                    });
                  }}
                >
                  {curBloom ? "Glow on" : "Glow off"}
                </button>
                <button type="button" className="fb-ec-btn fb-ec-chip" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </section>

            <div className="fb-ec-full-bottom">
              <div className="fb-ec-hints" aria-hidden="true">
                <div>Drag <span>spin</span></div>
                <div>Scroll / Pinch <span>zoom</span></div>
                <div>Click / Tap <span>strike</span></div>
                <div>Hold <span>charge</span></div>
                <div>Move <span>stir the ash</span></div>
              </div>
              <div className="fb-ec-actions">
                <button
                  type="button"
                  className="fb-ec-btn"
                  aria-expanded={controlsOpen}
                  aria-controls={controlsPanelId}
                  onClick={() => setControlsOpen((o) => !o)}
                >
                  Controls
                </button>
                <button
                  type="button"
                  className="fb-ec-btn"
                  aria-pressed={isStopped}
                  onClick={handleTogglePause}
                >
                  {isStopped ? "Play" : "Pause"}
                </button>
                <button
                  type="button"
                  className="fb-ec-btn"
                  onClick={handleStrike}
                >
                  Strike
                </button>
              </div>
            </div>

            <div
              className="fb-ec-toast"
              role="status"
              aria-live="polite"
              data-show={toastMsg ? "true" : "false"}
            >
              {toastMsg}
            </div>
          </>
        ) : (
          <>
            {children && <div className="fb-ec-children">{children}</div>}
            {interactive === "hero" ? (
              <div className="fb-ec-hero-bar">
                <span className="fb-ec-hero-hint" aria-hidden="true">
                  <span className="fb-ec-hint-fine">Move to stir · Click to strike</span>
                  <span className="fb-ec-hint-touch">Tap to strike</span>
                </span>
                <button
                  type="button"
                  className="fb-ec-btn fb-ec-strike-btn"
                  onClick={handleStrike}
                >
                  Strike
                </button>
              </div>
            ) : (
              !children && <span className="sr-only">Ember Core ambient background</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EmberCore;
