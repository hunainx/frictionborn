# particle-field — Specification Sheet

> background: WebGL2 vertex-shader particle drift with pointer repel (webgl2, client-only, reduced motion -> poster, mobile -> tier 2 / tier 1 poster)

## Overview

- **Item Name**: `particle-field`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `webgl`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/particle-field`

## Intent

### Use When
- Hero sections requiring discrete starry or kinetic depth points
- Telemetry or scientific landing pages needing particle drift and fine pointer interaction
- Surfaces seeking subtle stellar motion with constant GPU cost

### Avoid When
- Dense text sections where text contrast over the particles has not been verified
- Pages already running a continuous full-screen shader
- Low-power mobile devices where the static dot pattern is preferred

### Alternatives
- **noise-field**: When continuous organic liquid waves are preferred over discrete points
- **mesh-gradient**: When soft blurred color transitions are preferred

## Runtime & Server Boundaries

- **Server Output**: `poster` (accessible fallback in static HTML; measured CLS 0.0002)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (stepped by the shared runtime `useFrame` loop)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders the static CSS dot-pattern poster with no WebGL context and no animation frames. Under prefers-reduced-motion the runtime tier is 0, so WebGL does not start.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: CSS dot-pattern poster only, no WebGL (server render, prefers-reduced-motion, Save-Data, no WebGL2, or frame-guard downgrade)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: CSS dot-pattern poster only (coarse pointer with low-end hints: deviceMemory <= 2 or <= 4 cores)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: WebGL2 at DPR <= 1.5 with 35% of `count` particles (coarse pointer without low-end hints, or fine pointer with low-end hints or viewport < 480px)
- **T3 Full (fine pointer with hover on a capable machine)**: WebGL2 at DPR <= 2.0 with `count` particles, up to 4,000 (fine pointer with hover, no low-end hints)

### Input Interactions
- **Pointer**: Pointer repulsion within a 140px radius, only when interactive is true and the device reports pointer: fine (window pointermove listener, mouse and pen only)
- **Touch**: No pointer listeners are attached when the device does not report pointer: fine. Coarse pointers with low-end hints get the tier 1 poster; other coarse-pointer devices run the drift at tier 2.
- **Keyboard**: None; the component has no interactive elements. Poster, scrim and canvas layers are aria-hidden; children keep their own semantics.

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `true`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.2.2, 2.3.1
- **Notes**: The poster, scrim and canvas layers are aria-hidden; the root element and children are not. Particle twinkle runs at about 0.3 Hz (sin(phase + time * 1.8) in the vertex shader), well below 3 flashes per second. There is no built-in pause button: pause with the paused prop or the runtime pauseAll()/resumeAll(). The optional scrim lowers background luminance but contrast is not computed; verify text contrast for your colours.

## Composition

- **Max Per Page**: 1
- **Singleton**: false
- **Conflicts With**: noise-field, mesh-gradient
- **Pairs Well With**: text-reveal, magnetic-button, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `color` | `string` | `"var(--primary, CanvasText)"` | Particle CSS colour, resolved from CSS variables or theme tokens and also used for the dot-pattern poster. |
| `speed` | `number` | `1` | Kinematic drift rate multiplier. |
| `count` | `number` | `2000` | Target particle count on Tier 3 (clamped to 4,000). Tier 2 renders 35% of it. |
| `interactive` | `boolean` | `true` | Enables pointer repulsion; only active when the device reports pointer: fine. |
| `scrim` | `boolean` | `false` | Renders a vertical gradient of the host --background token (40% to 75% opacity) over the canvas to lower background luminance behind children. Does not guarantee text contrast; verify for your colours. |
| `paused` | `boolean` | `false` | Freezes this instance's particle loop. The global pauseAll() also stops it. |
| `maxTier` | `number` | `3` | Upper bound on the capability tier (0 to 3); the tier is the minimum of this and the runtime tier. |
| `reducedMotion` | `boolean` | `—` | Optional. No default (follows prefers-reduced-motion). true forces the static poster. false only skips the prop-level check: under prefers-reduced-motion the runtime tier is still 0, so WebGL still does not start. Leave unset. |
| `className` | `string` | `""` | Extra classes on the root div (the built-in class fb-particle-field is kept). |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root div, merged after the built-in layout and background (consumer wins). |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root <div> that holds the poster and the canvas. |
| `children` | `React.ReactNode` | `—` | Optional. No default. Content layered above the poster, canvas and scrim. |
| `palette` | `"fire" \| "ice" \| "neon" \| "mono" \| "custom"` | `—` | Colours from a palette (DESIGN.md A8): fire, ice, neon, mono, or custom (reads --fb-heat-0..4). Overrides color; leave it out to keep the host's tokens. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/particle-field
```

### Usage
```tsx
import { ParticleField } from "@/components/ui/particle-field";

export default function Hero() {
  return (
    <ParticleField count={2000} className="min-h-[600px] flex items-center justify-center">
      <h1 className="text-5xl font-bold tracking-tight text-foreground">Sub-Angstrom Kinematics</h1>
    </ParticleField>
  );
}
```

### Common Mistakes to Avoid
- Do not attach your own window mouse listeners for repulsion; ParticleField already adds one window pointermove listener, only on devices that report pointer: fine.
- Do not combine multiple ParticleField instances in the same viewport.
- scrim defaults to false. It only lowers background luminance and does not guarantee 4.5:1 contrast: verify contrast for your colours and use host foreground tokens for text.
- Do not set reducedMotion={false} to try to force WebGL; it does not override the user's preference (the runtime tier stays 0 under prefers-reduced-motion).
- Never call requestAnimationFrame directly to animate particles.

### How to Verify
- Confirm the static CSS dot-pattern poster renders in server HTML (CLS <= 0.01).
- Confirm that when prefers-reduced-motion is active, the static poster renders with zero WebGL contexts allocated and zero rAF cycles.
- Confirm context lease is released when scrolled out of view.

## Measured Bench Evidence

- **Bench Commit**: `801163e` (2026-10-21)
- **Size**: 2.54 KiB initial / 3.48 KiB deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0.0002`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-21 | 20 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-21 | 19 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-21 | 17 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-21 | 17 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-21 | 17 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
