# magnetic-button — Specification Sheet

> cta: Magnetic spring wrapper for buttons and links with fine-pointer gating (dom, server-safe, <2.5 KB, reduced motion -> static, mobile -> 0 listeners)

## Overview

- **Item Name**: `magnetic-button`
- **Version**: `0.1.0`
- **Slot**: `cta`
- **Kind**: `dom`
- **Install**: `npx shadcn@latest add @frictionborn/magnetic-button`

## Intent

### Use When
- High-priority call-to-action buttons in hero and conversion sections
- Interactive icon triggers and primary action links
- Header navigation actions seeking tactile physical response

### Avoid When
- Dense lists of repeating table buttons or compact toolbar grids
- Touch-first mobile interfaces with coarse pointer navigation
- Disabled or read-only interactive elements

### Alternatives
- **text-reveal**: When animating entrance typography rather than interactive hover responses

## Runtime & Server Boundaries

- **Server Output**: `final-state` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Button retains static position without magnetic cursor tracking.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static unadorned button without pointer listeners or translation
- **Tier 1** (Mid-range mobile): Static button with zero pointer listeners on coarse touch devices
- **Tier 2** (Standard desktop / modern mobile): Gentle magnetic attraction with reduced pull radius (10px)
- **Tier 3** (High performance GPU): Full spring physics loop on fine pointer hover with settling to zero rAF

### Input Interactions
- **Pointer**: Cursor attraction with physical spring settling within 0.01px tolerance
- **Touch**: Zero pointer listeners attached on coarse/touch screens
- **Keyboard**: Focus snaps button to origin immediately; focus rings remain unclipped

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 2.1.1, 2.4.7, 2.5.3
- **Notes**: Preserves native keyboard semantics, focus rings are not clipped by overflow, and keyboard focus immediately resets translation to origin.

## Composition

- **Max Per Page**: 10
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: noise-field, text-reveal, ambient-hero

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactElement` | `"undefined"` | Interactive element (button or link) wrapped by magnetic controller. |
| `strength` | `number` | `16` | Maximum pull translation in pixels. |
| `tension` | `number` | `180` | Spring stiffness coefficient. |
| `damping` | `number` | `16` | Spring velocity damping coefficient. |
| `className` | `string` | `"\"\""` | Additional CSS classes applied to the outer wrapper. |
| `maxTier` | `number` | `3` | Hard ceiling on device capability tier. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/magnetic-button
```

### Usage
```tsx
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function HeroCta() {
  return (
    <MagneticButton strength={16}>
      <button type="button" className="rounded-full bg-primary px-6 py-3 text-white font-medium">
        Get Started
      </button>
    </MagneticButton>
  );
}
```

### Common Mistakes to Avoid
- Do not set overflow: hidden on MagneticButton or parent containers, or focus rings will be clipped.
- Do not wrap non-interactive static text in MagneticButton; reserve for buttons and action links.

### How to Verify
- Verify button is immediately clickable and focusable in server HTML.
- Verify keyboard tabbing triggers focus ring cleanly without clipped edges.
- Verify that on touch screens, zero pointer listeners are registered.

## Measured Bench Evidence

- **Bench Commit**: `d8d51e2` (2026-10-04)
- **Size**: 1.74 KB initial / 0.02 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-04 | 12 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-04 | 12 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-04 | 12 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-04 | 12 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-04 | 12 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
