# particle-field — Specification Sheet

> background: WebGL2 vertex-shader particle drift with pointer repel (webgl2, client-only, ~4 KB, reduced motion -> poster, mobile -> tier 2 / tier 1 poster)

## Overview

- **Item Name**: `particle-field`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `webgl`
- **Install**: `npx shadcn@latest add @frictionborn/particle-field`

## Intent

### Use When
- Hero sections requiring discrete starry or kinetic depth points
- Telemetry or scientific landing pages needing particle drift and fine pointer interaction
- Surfaces seeking subtle stellar motion with constant GPU cost

### Avoid When
- Dense text sections without an active contrast scrim
- Pages already running a continuous full-screen shader
- Low-power mobile devices where the static dot pattern is preferred

### Alternatives
- **noise-field**: When continuous organic liquid waves are preferred over discrete points
- **mesh-gradient**: When soft blurred color transitions are preferred

## Runtime & Server Boundaries

- **Server Output**: `poster` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `while-visible` (managed via runtime `useFrame`)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders static CSS dot pattern poster with zero WebGL allocation and zero rAF loops.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static CSS dot pattern poster matching particle color
- **Tier 1** (Mid-range mobile): Static CSS dot pattern poster for low-end hardware
- **Tier 2** (Standard desktop / modern mobile): WebGL2 rendered at DPR <= 1.5 with ~35% particle density and no touch listeners
- **Tier 3** (High performance GPU): Full WebGL2 rendered at DPR <= 2.0 with up to 4,000 particles and fine pointer repulsion

### Input Interactions
- **Pointer**: Fine pointer repulsion within 140px interaction radius
- **Touch**: Zero pointer listeners on touch devices; automatic fallback to Tier 1 poster or Tier 2 drift
- **Keyboard**: None; container is non-interactive aria-hidden decorative surface

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `true`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.2.2, 2.3.1
- **Notes**: Canvas element is marked aria-hidden='true'. Particle twinkle frequency is strictly capped below 3 Hz (WCAG 2.3.1).

## Composition

- **Max Per Page**: 2
- **Singleton**: false
- **Conflicts With**: noise-field, mesh-gradient
- **Pairs Well With**: text-reveal, magnetic-button, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `color` | `string` | `"var(--primary, #FB923C)"` | Particle color, resolved dynamically from CSS variables or theme tokens. |
| `speed` | `number` | `1` | Kinematic drift rate multiplier. |
| `count` | `number` | `2000` | Target particle count on Tier 3 (clamped to max 4,000; scaled down on Tier 2). |
| `interactive` | `boolean` | `true` | Enables fine-pointer repulsion on desktop fine pointers. |
| `scrim` | `boolean` | `false` | Renders an accessible contrast gradient overlay for legibility of child text. |
| `paused` | `boolean` | `false` | Explicitly freezes the particle simulation loop. |
| `maxTier` | `number` | `3` | Upper bound cap on the resolved capability tier. |
| `reducedMotion` | `boolean` | `false` | Manual override forcing static poster fallback. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/particle-field
```

### Usage
```tsx
import { ParticleField } from "@/components/ui/particle-field";

export default function Hero() {
  return (
    <ParticleField count={2000} className="min-h-[600px] flex items-center justify-center">
      <h1 className="text-5xl font-bold tracking-tight text-white">Sub-Angstrom Kinematics</h1>
    </ParticleField>
  );
}
```

### Common Mistakes to Avoid
- Do not attach window mouse listeners; ParticleField handles fine pointer repulsion internally and suppresses listeners on coarse touch pointers.
- Do not combine multiple ParticleField instances in the same viewport.
- Never call requestAnimationFrame directly to animate particles.

### How to Verify
- Confirm static CSS dot pattern poster renders in server HTML with zero CLS.
- Confirm that when prefers-reduced-motion is active, static poster renders with zero WebGL contexts allocated and zero rAF cycles.
- Confirm context lease is released when scrolled out of view.

## Measured Bench Evidence

- **Bench Commit**: `46ae93d` (2026-10-03)
- **Size**: 2.19 KB initial / 3.42 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0.0003`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-03 | 16 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-03 | 16 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-03 | 15 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-03 | 15 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-03 | 15 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
