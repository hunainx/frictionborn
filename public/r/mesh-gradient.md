# mesh-gradient — Specification Sheet

> background: multi-color organic mesh gradient via WebGL2 (webgl2, client-only, ~4.5 KB, reduced motion -> poster, DPR <= 1.5 on mobile/Tier 2)

## Overview

- **Item Name**: `mesh-gradient`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `webgl`
- **Install**: `npx shadcn@latest add @frictionborn/mesh-gradient`

## Intent

### Use When
- Hero sections requiring rich, fluid multi-color ambient backgrounds
- Telemetry or premium landing surfaces needing organic color transitions
- Sections requiring soft chromatic fields with zero server hydration shift

### Avoid When
- Dense text sections without an active contrast scrim
- Surfaces already running another full-screen WebGL shader in the same viewport
- Devices with battery-saver or forced reduced motion enabled

### Alternatives
- **noise-field**: When monochromatic procedural simplex flow lines are desired
- **particle-field**: When discrete kinematic points and pointer repulsion are preferred

## Runtime & Server Boundaries

- **Server Output**: `poster` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `while-visible` (managed via runtime `useFrame`)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders static CSS gradient poster with zero WebGL allocation and zero rAF loops (Decision 14 D-A).

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static CSS multi-radial gradient poster matching mesh colors
- **Tier 1** (Mid-range mobile): Static CSS multi-radial gradient poster for low-end hardware
- **Tier 2** (Standard desktop / modern mobile): WebGL2 rendered at DPR <= 1.5 with reduced pixel target
- **Tier 3** (High performance GPU): Full WebGL2 rendered at DPR <= 2.0 with full organic distortion

### Input Interactions
- **Pointer**: None; ambient background surface
- **Touch**: None; touch passive with no event listener attachment
- **Keyboard**: None; container is non-interactive aria-hidden decorative surface

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `true`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.2.2, 1.4.3
- **Notes**: Canvas element is marked aria-hidden='true'. Optional scrim layer maintains WCAG AA contrast >= 4.5:1 for overlaid text.

## Composition

- **Max Per Page**: 2
- **Singleton**: false
- **Conflicts With**: noise-field, particle-field
- **Pairs Well With**: text-reveal, magnetic-button, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `colors` | `string[]` | `"[\"var(--background, #0B0E14)\", \"var(--primary, #38BDF8)\", \"var(--chart-1, #818CF8)\", \"var(--chart-2, #1E293B)\"]"` | Array of 2-6 color values, dynamically resolved from host tokens. |
| `speed` | `number` | `0.35` | Wave drift speed multiplier. |
| `distortion` | `number` | `0.5` | Amplitude of organic noise distortion. |
| `swirl` | `number` | `0.25` | Vortex swirl strength in the gradient field. |
| `grainMixer` | `number` | `0.08` | Subtle analog grain distortion strength. |
| `grainOverlay` | `number` | `0.04` | Post-processing fine film grain overlay intensity. |
| `scrim` | `boolean` | `false` | Renders an accessible contrast gradient overlay for legibility of child text. |
| `paused` | `boolean` | `false` | Explicitly freezes the shader animation loop. |
| `maxTier` | `number` | `3` | Upper bound cap on the resolved capability tier. |
| `reducedMotion` | `boolean` | `false` | Manual override forcing static poster fallback. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/mesh-gradient
```

### Usage
```tsx
import { MeshGradient } from "@/components/ui/mesh-gradient";

export default function Hero() {
  return (
    <MeshGradient scrim className="min-h-[500px] flex items-center justify-center">
      <h1 className="text-4xl font-bold tracking-tight text-white">Spectral Wavefront</h1>
    </MeshGradient>
  );
}
```

### Common Mistakes to Avoid
- Do not combine multiple MeshGradient instances in the same viewport.
- Do not run MeshGradient without a scrim layer behind small body copy.
- Never call requestAnimationFrame directly to animate the mesh.

### How to Verify
- Confirm static CSS multi-radial gradient poster renders in server HTML with zero CLS.
- Confirm that when prefers-reduced-motion is active, static poster renders with zero WebGL contexts allocated and zero rAF cycles.
- Confirm context lease is released when scrolled out of view.

## Measured Bench Evidence

- **Bench Commit**: `d8d51e2` (2026-10-04)
- **Size**: 2.65 KB initial / 3.39 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0.0001`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-04 | 15 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-04 | 15 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-04 | 14 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-04 | 14 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-04 | 14 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Derived From**:
  - Simplex noise algorithm (GLSL): [https://github.com/stegu/webgl-noise](https://github.com/stegu/webgl-noise) (MIT)
