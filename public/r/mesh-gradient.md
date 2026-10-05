# mesh-gradient — Specification Sheet

> background: multi-color organic mesh gradient via WebGL2 (webgl2, client-only, reduced motion -> static poster, DPR <= 1.5 on mobile/Tier 2)

## Overview

- **Item Name**: `mesh-gradient`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `webgl`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/mesh-gradient`

## Intent

### Use When
- Hero sections requiring rich, fluid multi-color ambient backgrounds
- Telemetry or premium landing surfaces needing organic color transitions
- Sections requiring soft chromatic fields with zero server hydration shift

### Avoid When
- Dense text sections where text contrast over the gradient has not been verified
- Surfaces already running another full-screen WebGL shader in the same viewport
- Devices with battery-saver or forced reduced motion enabled

### Alternatives
- **noise-field**: When monochromatic procedural simplex flow lines are desired
- **particle-field**: When discrete kinematic points and pointer repulsion are preferred

## Runtime & Server Boundaries

- **Server Output**: `poster` (accessible fallback in static HTML; measured CLS 0.0001)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (stepped by the shared runtime `useFrame` loop)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders the static CSS gradient poster with no WebGL context and no animation frames (Decision 14 D-A). Under prefers-reduced-motion the runtime tier is 0, so WebGL does not start.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: CSS multi-radial gradient poster only, no WebGL (server render, prefers-reduced-motion, Save-Data, no WebGL2, or frame-guard downgrade)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: CSS multi-radial gradient poster only (coarse pointer with low-end hints: deviceMemory <= 2 or <= 4 cores)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: WebGL2 at DPR <= 1.5, 0.75 render scale, 2 octaves (coarse pointer without low-end hints, or fine pointer with low-end hints or viewport < 480px)
- **T3 Full (fine pointer with hover on a capable machine)**: WebGL2 at DPR <= 2.0, full render scale, 4 octaves (fine pointer with hover, no low-end hints)

### Input Interactions
- **Pointer**: None; ambient background surface
- **Touch**: None; no touch or pointer listeners. Coarse pointers with low-end hints get the tier 1 poster; other coarse-pointer devices run WebGL at tier 2.
- **Keyboard**: None; the component has no interactive elements. Poster, scrim and canvas layers are aria-hidden; children keep their own semantics.

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `true`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.2.2
- **Notes**: The poster, scrim and canvas layers are aria-hidden; the root element and children are not. There is no built-in pause button: pause with the paused prop or the runtime pauseAll()/resumeAll(). The optional scrim lowers background luminance behind children but contrast is not computed; verify text contrast for your colours.

## Composition

- **Max Per Page**: 1
- **Singleton**: false
- **Conflicts With**: noise-field, particle-field
- **Pairs Well With**: text-reveal, magnetic-button, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `colors` | `string[]` | `["var(--background, Canvas)","var(--primary, CanvasText)","var(--chart-1, var(--accent, GrayText))","var(--chart-2, var(--muted, ButtonFace))"]` | CSS colours resolved from host tokens. Only the first four are used (extra entries are ignored); missing entries reuse earlier ones. The first colour is the background. |
| `speed` | `number` | `1` | Unitless multiplier of the standard drift. 1 is the standard speed, which is already slow (0.35 shader seconds per second); 0.5 is half and 2 is double. |
| `distortion` | `number` | `0.5` | Amplitude of organic noise distortion. |
| `swirl` | `number` | `0.25` | Vortex swirl strength in the gradient field. |
| `grainMixer` | `number` | `0.08` | Subtle analog grain distortion strength. |
| `grainOverlay` | `number` | `0.04` | Post-processing fine film grain overlay intensity. |
| `scrim` | `boolean` | `false` | Renders a radial scrim of the first colour (20% centre to 80% edge opacity) over the canvas to lower background luminance behind children. Does not guarantee text contrast; verify for your colours. |
| `paused` | `boolean` | `false` | Freezes this instance's shader animation loop. The global pauseAll() also stops it. |
| `maxTier` | `number` | `3` | Upper bound on the capability tier (0 to 3); the tier is the minimum of this and the runtime tier. |
| `reducedMotion` | `boolean` | `—` | Optional. No default (follows prefers-reduced-motion). true forces the static poster. false only skips the prop-level check: under prefers-reduced-motion the runtime tier is still 0, so WebGL still does not start. Leave unset. |
| `className` | `string` | `""` | Extra classes on the root div (the built-in class fb-mesh-gradient is kept). |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root div, merged after the built-in layout and background colour (consumer wins). |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root <div> that holds the poster and the canvas. |
| `children` | `React.ReactNode` | `—` | Optional. No default. Content layered above the poster, canvas and scrim. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/mesh-gradient
```

### Usage
```tsx
import { MeshGradient } from "@/components/ui/mesh-gradient";

export default function Hero() {
  return (
    <MeshGradient scrim className="min-h-[500px] flex items-center justify-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Spectral Wavefront</h1>
    </MeshGradient>
  );
}
```

### Common Mistakes to Avoid
- Do not combine multiple MeshGradient instances in the same viewport.
- scrim defaults to false. Turn it on behind text, but it only lowers background luminance and does not guarantee 4.5:1 contrast: verify contrast for your colours and use host foreground tokens for text.
- Do not set reducedMotion={false} to try to force WebGL; it does not override the user's preference (the runtime tier stays 0 under prefers-reduced-motion).
- Never call requestAnimationFrame directly to animate the mesh.

### How to Verify
- Confirm the static CSS multi-radial gradient poster renders in server HTML (CLS <= 0.01).
- Confirm that when prefers-reduced-motion is active, the static poster renders with zero WebGL contexts allocated and zero rAF cycles.
- Confirm context lease is released when scrolled out of view.

## Measured Bench Evidence

- **Bench Commit**: `089a666` (2026-10-05)
- **Size**: 2.77 KiB initial / 3.52 KiB deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0.0001`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-05 | 17 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 17 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 15 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Derived From**:
  - Simplex noise algorithm (GLSL): [https://github.com/stegu/webgl-noise](https://github.com/stegu/webgl-noise) (MIT)
- **Notice**: Includes 2D Simplex Noise from stegu/webgl-noise (MIT Copyright 2011 Ashima Arts, Stefan Gustavson).
