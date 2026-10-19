# ember-core — Specification Sheet

> background: 3D ash filament sphere with inner ember glow, vortex stir, shockwave strike and hold-to-charge burst (WebGL2, still under reduced motion)

## Overview

- **Item Name**: `ember-core`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `webgl`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/ember-core`

## Intent

### Use When
- Flagship hero backgrounds needing a 3D interactive ember and ash sphere that never traps page scroll
- Standalone interactive showcases where visitors can spin, zoom, stir, strike and charge the core
- Dark-stage brand surfaces pairing headline typography with a tactile real-time WebGL focal point

### Avoid When
- Dense data tables or long-form reading sections where a 3D focal point distracts from copy
- Pages already running another WebGL background in the same viewport (one signature moment per screen)
- Surfaces without a dark ground or contrast backing behind foreground text

### Alternatives
- **particle-field**: When a lighter field of discrete depth points fits better than a 3D filament sphere
- **lantern-sky**: When a calm 2D canvas background of rising lanterns is preferred over WebGL2

## Runtime & Server Boundaries

- **Server Output**: `poster` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (stepped by the shared runtime `useFrame` loop)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `still-frame` — Renders one still frame of the 3D ember cloud with no animation loop; activating Strike shows one flared frame and returns to the still frame.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: CSS radial-gradient poster on dark obsidian ground; under prefers-reduced-motion on a WebGL2 browser, renders one still WebGL frame with 0 loop frames
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: CSS radial-gradient poster only (coarse pointer with low-end hardware hints)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: WebGL2 at DPR <= 1.5 with 2,200 strands x 48 steps and 1,100 inner glow points; bloom falls back automatically if the frame budget fails
- **T3 Full (fine pointer with hover on a capable machine)**: WebGL2 at DPR <= 2.0 with 4,600 strands x 62 steps, 2,000 inner glow points and 2-pass Gaussian bloom

### Input Interactions
- **Pointer**: Hover stirs a local vortex and lights a pointer flame; drag spins the sphere on a world-axis quaternion with inertia; click (< 280 ms, < 6 px) fires a strike flare and shockwave ring; hold (>= 280 ms) charges and pulls the cloud inward, releasing into an outward burst; wheel zooms in 'full' mode (never in 'hero' mode).
- **Touch**: In 'hero' mode, touch-action is pan-y so vertical swipes scroll the page normally; only horizontal touch drags spin the sphere and hold-to-charge is disabled on touch. In 'full' mode, single-finger drag spins, two-finger pinch zooms, tap strikes and hold charges.
- **Keyboard**: In 'hero' mode, Tab reaches the real Strike button. In 'full' mode, the canvas has tabIndex=0 (arrow keys spin, Space or Enter strikes or charges when held, + and - zoom, P pauses) and Tab reaches the Controls, Pause and Strike buttons plus native sliders and palette chips.

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 1.4.3, 2.1.1, 2.2.2
- **Notes**: In 'hero' mode (the default), the canvas is aria-hidden and a real <button>Strike</button> is provided alongside any children. In 'full' mode, the canvas is focusable with an aria-label listing all gestures, accompanied by native range inputs, toggle buttons and a polite status live region.

## Composition

- **Max Per Page**: 1
- **Singleton**: false
- **Conflicts With**: noise-field, mesh-gradient, particle-field, ambient-hero
- **Pairs Well With**: text-reveal, magnetic-button, flint-button

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `interactive` | `"full" \| "hero" \| "none"` | `"hero"` | Selects the interaction mode. 'hero' is page-safe (no wheel zoom, touch-action: pan-y, decorative canvas, real Strike button); 'full' adds focusable canvas keyboard controls, wheel/pinch zoom and the Controls panel; 'none' disables pointer and touch handlers. |
| `heat` | `number` | `1` | Heat intensity multiplier (0 to 2). |
| `swirl` | `number` | `1` | Pointer vortex swirl multiplier (0 to 2). |
| `spin` | `number` | `1` | Idle rotation speed multiplier (0 to 2). |
| `density` | `number` | `1` | Fraction of ash filaments and inner glow points drawn (0.2 to 1). |
| `bloom` | `boolean` | `true` | Enables the 2-pass Gaussian bloom (strength 0.75, radius 0.6, threshold 0.18). Falls back automatically on Tier 2 if the frame budget fails. |
| `sound` | `boolean` | `false` | Enables synthesized WebAudio crackle and low thump on user gestures (never plays before a user gesture; no audio files). |
| `palette` | `"fire" \| "ice" \| "neon" \| "mono" \| "custom"` | `"fire"` | Colours of the ash, ember, hot core and inner glow (DESIGN.md A8). 'custom' reads --fb-heat-0..4 via resolveCssColor. |
| `paused` | `boolean` | `false` | Universal pause prop: stops idle rotation and auto-strikes while allowing a visitor's direct gesture to play out and settle. |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier (0 to 3). |
| `reducedMotion` | `boolean` | `—` | Optional override for prefers-reduced-motion (still-frame mode). |
| `offsetX` | `number` | `0` | Horizontal camera framing offset in world units (for example -0.32 to place the sphere slightly right of centre on wide screens). |
| `nonce` | `string` | `—` | Optional CSP nonce forwarded to the scoped <style> element. |
| `className` | `string` | `""` | Additional CSS classes on the root <div>. |
| `style` | `React.CSSProperties` | `—` | Inline styles on the root <div>, merged after palette variables. |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root <div> element. |
| `children` | `React.ReactNode` | `—` | Optional foreground content layered above the ember cloud. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/ember-core
```

### Usage
```tsx
import { EmberCore } from "@/components/ui/ember-core";

export default function Hero() {
  return (
    <EmberCore interactive="hero" style={{ minHeight: "600px" }}>
      <h1 style={{ color: "#E9E5DF" }}>We build what others call impossible.</h1>
    </EmberCore>
  );
}
```

### Common Mistakes to Avoid
- Use interactive="hero" (the default) when placing EmberCore at the top of a scrollable page so wheel events and vertical touch swipes never trap scrolling.
- Use interactive="full" only for dedicated interactive stages where wheel and pinch zoom are intended.
- Do not place a second WebGL background in the same viewport; EmberCore acquires a glBudget lease while visible.
- Keep foreground text in high-contrast light ink (#E9E5DF) with a dark backing over the glowing core so WCAG 4.5:1 contrast holds even during a strike flare.

### How to Verify
- Confirm the CSS poster renders in server HTML before hydration with zero layout shift (CLS <= 0.01).
- Confirm that in interactive="hero" mode, mouse wheel and vertical touch swipes scroll the page normally.
- Confirm that under prefers-reduced-motion, one still frame is drawn with 0 ongoing animation frames.

## Measured Bench Evidence

- **Bench Commit**: `d6c9000` (2026-10-19)
- **Size**: 8.02 KiB initial / 13.68 KiB deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-19 | 23 passed, 0 failed, 1 flaky (passed on retry) |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-19 | 18 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-19 | 15 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-19 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-19 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Derived From**:
  - 3D simplex noise (GLSL): [https://github.com/stegu/webgl-noise](https://github.com/stegu/webgl-noise) (MIT)
- **Notice**: Includes 3D Simplex Noise from stegu/webgl-noise (MIT Copyright 2011 Ashima Arts, Stefan Gustavson).
