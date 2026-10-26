# flint-button — Specification Sheet

> cta: Button that strikes like flint: a steel rakes the stone and throws sparks; heat builds until it catches (canvas 2D, native button, reduced motion -> plain)

## Overview

- **Item Name**: `flint-button`
- **Version**: `0.1.0`
- **Slot**: `cta`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/flint-button`

## Intent

### Use When
- One primary action with a moment of character (start, ignite, launch, generate)
- Brand pages about fire, energy or making

### Avoid When
- Forms with several buttons in a row
- Destructive actions (use hold-to-confirm)
- Light pages where a dark stone button would look out of place

### Alternatives
- **magnetic-button**: When the button should feel physical without fire

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — A plain stone button: no steel, no sparks, no glow, no canvas. Clicks work as usual.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The control alone (server render, reduced motion, Save-Data, no WebGL2): no canvas
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Effect on a canvas at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Effect on a canvas at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: Click strikes; rubbing fast across the button heats it
- **Touch**: Tap strikes
- **Keyboard**: A native <button>: Enter and Space strike, focus ring visible

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.1.1, 2.4.7, 4.1.2, 4.1.3
- **Notes**: A native <button> with its text label (which becomes litLabel while it burns). The optional heat status under it is aria-live=polite. The spark canvas and the steel are aria-hidden. Sparks last under 3 s per strike.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: flame-switch, hold-to-confirm

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `—` | Required. The button's label while cold. |
| `litLabel` | `React.ReactNode` | `"Lit"` | The label while the stone burns. |
| `statusText` | `{ cold: string; warm: string; hot: string; burning: string } \| null` | `{ cold: "Cold stone", warm: "Warm", hot: "Hot", burning: "Burning" }` | Visible heat status under the button (aria-live polite); null hides it. |
| `onClick` | `React.MouseEventHandler<HTMLButtonElement>` | `—` | Your action; runs on every strike. |
| `palette` | `"fire" \| "ice" \| "neon" \| "mono" \| "custom"` | `"fire"` | Colours of the effect (DESIGN.md A8). custom reads --fb-heat-0..4 from the page. |
| `paused` | `boolean` | `false` | Universal pause prop: the effect stops drawing; the control keeps working. |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier. |
| `nonce` | `string` | `—` | CSP nonce for the component's <style> element. |
| `className` | `string` | `""` | Extra classes on the root. |
| `style` | `React.CSSProperties` | `—` | Inline styles on the root, merged after the palette variables. |
| `ref` | `React.Ref<HTMLButtonElement>` | `—` | Receives the <button>; className, style and the rest of the props go on the button too. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/flint-button
```

### Usage
```tsx
import { FlintButton } from "@/components/ui/flint-button";

export function Start({ onStart }: { onStart: () => void }) {
  return <FlintButton onClick={onStart} litLabel="Started">Start the bench</FlintButton>;
}
```

### Common Mistakes to Avoid
- The sparks fly above the button (about 200 px): leave room and do not clip the parent with overflow: hidden.
- One per view: it is a primary action, not a toolbar button.
- ref, className and style apply to the <button>, not to the wrapper.

### How to Verify
- Server HTML has a native <button> with its label.
- Enter strikes: the steel sweeps, sparks fly and the status warms.
- After the sparks fade and the stone cools, the loop stops.

## Measured Bench Evidence

- **Bench Commit**: `ffd0225` (2026-10-21)
- **Size**: 3.13 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-21 | 16 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-21 | 15 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-21 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-21 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-21 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
