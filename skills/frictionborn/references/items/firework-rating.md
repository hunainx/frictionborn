# firework-rating — Specification Sheet

> control: Five-star rating as a real radio group; hover previews, and each chosen star bursts as a firework (canvas 2D, server-safe, reduced motion -> plain)

## Overview

- **Item Name**: `firework-rating`
- **Version**: `0.1.0`
- **Slot**: `control`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/firework-rating`

## Intent

### Use When
- Asking for a rating at a moment worth celebrating (after a purchase, a finished task, a demo)
- One rating per view

### Avoid When
- Lists of read-only ratings (show plain stars)
- Forms with many ratings in a row

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — The stars light up without bursts; no canvas.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The control alone (server render, reduced motion, Save-Data, no WebGL2): no canvas
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Effect on a canvas at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Effect on a canvas at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: Hover previews, click rates
- **Touch**: Tap rates
- **Keyboard**: A radio group with roving focus: arrows move and rate (Right/Up up, Left/Down down)

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.3.1, 1.4.11, 2.1.1, 4.1.2, 4.1.3
- **Notes**: role=radiogroup with a name and five native buttons with role=radio, aria-checked and names ("3 stars"); one tab stop. The word for the rating is aria-live=polite. Unlit stars keep 3:1 against the dark ground. The firework canvas is aria-hidden.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: flint-button, fuse-toast

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `value` | `number` | `—` | Controlled rating, 0 (not rated) to 5. |
| `defaultValue` | `number` | `0` | Initial rating when uncontrolled. |
| `onValueChange` | `(value: number) => void` | `—` | Called with the new rating. |
| `label` | `string` | `"Rating"` | Accessible name of the radio group. |
| `words` | `[string, string, string, string, string, string] \| null` | `["Not rated", "Poor", "Fair", "Good", "Great", "Spectacular"]` | Words for 0-5 stars, shown and announced; null hides them. |
| `palette` | `"fire" \| "ice" \| "neon" \| "mono" \| "custom"` | `"fire"` | Colours of the effect (DESIGN.md A8). custom reads --fb-heat-0..4 from the page. |
| `paused` | `boolean` | `false` | Universal pause prop: the effect stops drawing; the control keeps working. |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier. |
| `nonce` | `string` | `—` | CSP nonce for the component's <style> element. |
| `className` | `string` | `""` | Extra classes on the root. |
| `style` | `React.CSSProperties` | `—` | Inline styles on the root, merged after the palette variables. |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root element. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/firework-rating
```

### Usage
```tsx
import { useState } from "react";
import { FireworkRating } from "@/components/ui/firework-rating";

export function Feedback() {
  const [stars, setStars] = useState(0);
  return <FireworkRating label="Rate this guide" value={stars} onValueChange={setStars} />;
}
```

### Common Mistakes to Avoid
- The bursts spread about 200 px around the stars: leave room and do not clip the parent.
- It sits on a dark ground by design; on a light page put it on a dark card.
- Give the group a specific label (what is being rated).

### How to Verify
- Server HTML has a radiogroup with five radios and one tab stop.
- ArrowRight rates and moves focus; the word is announced.
- The bursts fade and the loop stops within about two seconds.

## Measured Bench Evidence

- **Bench Commit**: `f845539` (2026-10-16)
- **Size**: 3.61 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-16 | 15 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-16 | 15 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-16 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-16 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-16 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
