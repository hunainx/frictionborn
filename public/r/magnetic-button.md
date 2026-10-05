# magnetic-button — Specification Sheet

> cta: Magnetic spring wrapper for buttons and links with fine-pointer gating (dom, server-safe, reduced motion -> static, mobile -> 0 listeners)

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

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (stepped by the shared runtime `useFrame` loop)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Button retains static position without magnetic cursor tracking.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Static wrapper without pointer handlers or translation (server render, prefers-reduced-motion, Save-Data, or no WebGL2)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Static wrapper without pointer handlers (coarse pointer with low-end hints)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Magnetic pull with the configured strength, only when the device reports (hover: hover) and (pointer: fine)
- **T3 Full (fine pointer with hover on a capable machine)**: Same behaviour as tier 2: spring physics on the shared frame loop while the pointer is over the wrapper, settling to zero frames

### Input Interactions
- **Pointer**: Cursor attraction with physical spring settling within 0.01px tolerance
- **Touch**: Zero pointer handlers attached on coarse/touch screens
- **Keyboard**: Focus snaps the wrapper to its origin immediately and the child's own onFocus still runs; the wrapper uses overflow: visible

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 2.1.1, 2.4.7, 2.5.3
- **Notes**: The wrapped button or link keeps its native semantics. The wrapper div uses overflow: visible so it does not clip focus rings, and keyboard focus immediately resets translation to origin.

## Composition

- **Max Per Page**: 10
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: noise-field, text-reveal, ambient-hero

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactElement` | `—` | Required. A single interactive element (button or link) wrapped by the magnetic controller. |
| `pullDistance` | `number` | `16` | Maximum pull translation in pixels (replaces deprecated strength). |
| `paused` | `boolean` | `false` | Universal pause prop. Freezes magnetic displacement calculation. |
| `tension` | `number` | `180` | Spring stiffness coefficient. |
| `damping` | `number` | `16` | Spring velocity damping coefficient. |
| `className` | `string` | `""` | Additional CSS classes applied to the outer wrapper div (the built-in class fb-magnetic-button is kept). |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the wrapper div, merged after display: inline-block and position: relative (consumer wins). |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

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
      <button type="button" className="rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium">
        Get Started
      </button>
    </MagneticButton>
  );
}
```

### Common Mistakes to Avoid
- Do not set overflow: hidden on MagneticButton or parent containers, or focus rings will be clipped.
- Do not wrap non-interactive static text in MagneticButton; reserve for buttons and action links.
- MagneticButton renders a wrapper div (display: inline-block) around the child, so do not place it inside a <p> or another <button>.
- It accepts only the listed props; data-* and aria-* attributes are not forwarded to the wrapper (put them on the child).

### How to Verify
- Verify button is immediately clickable and focusable in server HTML.
- Verify keyboard tabbing triggers focus ring cleanly without clipped edges.
- Verify that on touch screens, zero pointer handlers are registered.

## Measured Bench Evidence

- **Bench Commit**: `53fd14c` (2026-10-05)
- **Size**: 1.92 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-05 | 13 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 13 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 13 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 13 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 13 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
