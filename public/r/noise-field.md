# noise-field — Specification Sheet

> background: WebGL2 domain-warped noise hero background (webgl2, client-only, ~4.5 KB, reduced motion -> static poster, mobile -> tier 2 / tier 1 poster)

## Overview

- **Item Name**: `noise-field`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `webgl`
- **Install**: `npx shadcn@latest add @frictionborn/noise-field`

## Intent

### Use When
- Hero sections requiring a calm, generative ambient backdrop
- Modern dark-theme landing pages needing tactile organic motion
- Brand surfaces looking for rich visual texture without video overhead

### Avoid When
- Dense reading passages or documentation tables without high-contrast scrim
- Battery-saver mode or low-tier mobile devices where static poster is preferred
- Pages already running a background canvas effect (one signature moment per viewport)

### Alternatives
- **mesh-gradient**: When soft blurred liquid color transitions are preferred over domain-warped noise
- **particle-field**: When discrete starry or kinetic depth points are needed instead of a continuous field

## Runtime & Server Boundaries

- **Server Output**: `poster` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `while-visible` (managed via runtime `useFrame`)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders static CSS gradient poster matching shader palette with zero WebGL allocation and zero rAF loops.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static CSS gradient poster matching shader palette
- **Tier 1** (Mid-range mobile): Static CSS gradient poster for coarse pointers on low-end hardware
- **Tier 2** (Standard desktop / modern mobile): WebGL2 rendered at DPR <= 1.5 with 2 octaves and 0.75 render scale
- **Tier 3** (High performance GPU): Full WebGL2 rendered at DPR <= 2.0 with 4 octaves and high-precision flow

### Input Interactions
- **Pointer**: Ambient animation with optional time/paused override
- **Touch**: Falls back to Tier 1 poster on low-end hardware, or Tier 2 WebGL without touch listeners
- **Keyboard**: None; container is non-interactive aria-hidden decorative surface

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `true`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.2.2, 2.3.1
- **Notes**: Canvas element is marked aria-hidden='true'. The built-in scrim preserves >= 4.5:1 WCAG AA contrast for any overlaid text elements.

## Composition

- **Max Per Page**: 2
- **Singleton**: false
- **Conflicts With**: mesh-gradient, particle-field
- **Pairs Well With**: text-reveal, magnetic-button, ambient-hero

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `colors` | `[string, string, string]` | `"[\"var(--background)\", \"var(--primary)\", \"var(--accent)\"]"` | Three-color palette interpolated across procedural noise field and poster. |
| `speed` | `number` | `1` | Multiplies animation evolution rate. Ambient defaults keep cycle >= 8 seconds. |
| `scale` | `number` | `1.8` | Domain frequency scale for the procedural noise octaves. |
| `intensity` | `number` | `1` | Color vibrancy and octave blending contrast. |
| `scrim` | `boolean` | `true` | Renders radial contrast scrim preserving >= 4.5:1 text contrast. |
| `paused` | `boolean` | `false` | Freezes animation loop; used for deterministic screenshots and global pause. |
| `time` | `number` | `"undefined"` | Overrides internal clock with fixed time value for deterministic visual tests. |
| `maxTier` | `number` | `3` | Hard ceiling on device capability tier (0 to 3). |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/noise-field
```

### Usage
```tsx
import { NoiseField } from "@/components/ui/noise-field";

export default function Hero() {
  return (
    <NoiseField colors={["var(--background)", "var(--primary)", "var(--accent)"]} className="min-h-[600px] flex items-center justify-center">
      <h1 className="text-5xl font-bold tracking-tight text-white">Engineered Motion</h1>
    </NoiseField>
  );
}
```

### Common Mistakes to Avoid
- Do not remove the scrim prop when rendering body text over the canvas, or text contrast will fall below WCAG AA 4.5:1.
- Do not combine multiple NoiseField components in the same viewport; follow the one signature moment principle.
- Never call requestAnimationFrame directly to animate NoiseField props; let the runtime handle the loop.

### How to Verify
- Confirm static CSS gradient poster renders in server HTML before hydration with zero CLS.
- Confirm that when prefers-reduced-motion is active, static poster renders with zero WebGL contexts allocated and zero rAF cycles.
- Confirm context lease is properly released when scrolled out of view.

## Measured Bench Evidence

- **Bench Commit**: `018423e` (2026-10-01)
- **Size**: 2.75 KB initial / 3.5 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0.0017`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-01 | 14 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-01 | 14 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-01 | 13 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-01 | 13 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-01 | 13 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Derived From**:
  - undefined: [https://github.com/stegu/webgl-noise](https://github.com/stegu/webgl-noise) (MIT)
