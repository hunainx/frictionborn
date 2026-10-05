# noise-field — Specification Sheet

> background: WebGL2 domain-warped noise hero background (webgl2, client-only, reduced motion -> static poster, mobile -> tier 2 / tier 1 poster)

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
- Dense reading passages or documentation tables where text contrast over the canvas has not been verified
- Battery-saver mode or low-tier mobile devices where static poster is preferred
- Pages already running a background canvas effect (one signature moment per viewport)

### Alternatives
- **mesh-gradient**: When soft blurred liquid color transitions are preferred over domain-warped noise
- **particle-field**: When discrete starry or kinetic depth points are needed instead of a continuous field

## Runtime & Server Boundaries

- **Server Output**: `poster` (accessible fallback in static HTML; measured CLS 0.0028)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (stepped by the shared runtime `useFrame` loop)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders the static CSS gradient poster with no WebGL context and no animation frames. Under prefers-reduced-motion the runtime tier is 0, so WebGL does not start.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: CSS gradient poster only, no WebGL (server render, prefers-reduced-motion, Save-Data, no WebGL2, or frame-guard downgrade)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: CSS gradient poster only (coarse pointer with low-end hints: deviceMemory <= 2 or <= 4 cores)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: WebGL2 at DPR <= 1.5, 0.75 render scale, 2 octaves (coarse pointer without low-end hints, or fine pointer with low-end hints or viewport < 480px)
- **T3 Full (fine pointer with hover on a capable machine)**: WebGL2 at DPR <= 2.0, full render scale, 4 octaves (fine pointer with hover, no low-end hints)

### Input Interactions
- **Pointer**: None; ambient animation. Optional `time` prop fixes the clock and `paused` freezes the loop.
- **Touch**: No touch listeners. Coarse pointers with low-end hints get the tier 1 poster; other coarse-pointer devices run WebGL at tier 2.
- **Keyboard**: None; the component has no interactive elements. Poster, scrim and canvas layers are aria-hidden; children keep their own semantics.

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `true`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.2.2, 2.3.1
- **Notes**: The poster, scrim and canvas layers are aria-hidden; the root element and children are not. There is no built-in pause button: pause with the paused prop or the runtime pauseAll()/resumeAll(). The scrim lowers background luminance behind children but contrast is not computed; verify text contrast for your colours.

## Composition

- **Max Per Page**: 1
- **Singleton**: false
- **Conflicts With**: mesh-gradient, particle-field
- **Pairs Well With**: text-reveal, magnetic-button

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `colors` | `[string, string, string]` | `["var(--background, Canvas)","var(--primary, CanvasText)","var(--accent, GrayText)"]` | Three CSS colours: background, primary, accent. Resolved to RGB for the shader and used to build the CSS poster. |
| `speed` | `number` | `1` | Multiplier on animation time. |
| `scale` | `number` | `1.8` | Domain frequency scale for the procedural noise octaves. |
| `intensity` | `number` | `1` | Colour vibrancy and octave blending contrast. |
| `scrim` | `boolean` | `true` | Renders a radial scrim of the first colour (25% centre to 80% edge opacity) over the canvas to lower background luminance behind children. Does not guarantee text contrast; verify for your colours. |
| `paused` | `boolean` | `false` | Freezes this instance's animation loop. The global pauseAll() also stops it. |
| `time` | `number` | `—` | Optional. No default. Overrides the internal clock with a fixed time value (deterministic screenshots and tests). |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier (0 to 3); the tier is the minimum of this and the runtime tier. |
| `reducedMotion` | `boolean` | `—` | Optional. No default (follows prefers-reduced-motion). true forces the static poster. false only skips the prop-level check: under prefers-reduced-motion the runtime tier is still 0, so WebGL still does not start. Leave unset. |
| `className` | `string` | `""` | Extra classes on the root div, appended after the built-in Tailwind utility classes. |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root div, merged after the built-in background colour (consumer wins). |
| `children` | `React.ReactNode` | `—` | Optional. No default. Content layered above the poster, canvas and scrim. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

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
    <NoiseField className="min-h-[600px] flex items-center justify-center">
      <h1 className="text-5xl font-bold tracking-tight text-foreground">Engineered Motion</h1>
    </NoiseField>
  );
}
```

### Common Mistakes to Avoid
- Keep the scrim on when placing text over the canvas, but do not assume it guarantees WCAG 4.5:1 contrast: it only lowers background luminance. Verify contrast for your colours and use host foreground tokens for text.
- Do not set reducedMotion={false} to try to force WebGL; it does not override the user's preference (the runtime tier stays 0 under prefers-reduced-motion).
- Do not combine multiple NoiseField components in the same viewport; follow the one signature moment principle.
- The root element uses Tailwind utility classes (relative, w-full, h-full, min-h-[300px], overflow-hidden); install it in a Tailwind project.
- Never call requestAnimationFrame directly to animate NoiseField props; let the runtime handle the loop.

### How to Verify
- Confirm the static CSS gradient poster renders in server HTML before hydration (CLS <= 0.01).
- Confirm that when prefers-reduced-motion is active, the static poster renders with zero WebGL contexts allocated and zero rAF cycles.
- Confirm context lease is properly released when scrolled out of view.

## Measured Bench Evidence

- **Bench Commit**: `53fd14c` (2026-10-05)
- **Size**: 2.64 KiB initial / 3.48 KiB deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0.0028`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-05 | 18 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 18 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 16 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 16 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 16 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Derived From**:
  - 2D simplex noise (GLSL): [https://github.com/stegu/webgl-noise](https://github.com/stegu/webgl-noise) (MIT)
- **Notice**: Includes 2D Simplex Noise from stegu/webgl-noise (MIT Copyright 2011 Ashima Arts, Stefan Gustavson).
