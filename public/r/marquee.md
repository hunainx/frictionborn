# marquee — Specification Sheet

> strip: Infinite marquee with inert duplicate, hover/focus pause, and pause button (dom, server-safe, reduced motion -> static, mobile -> animates)

## Overview

- **Item Name**: `marquee`
- **Version**: `0.1.0`
- **Slot**: `strip`
- **Kind**: `dom`
- **Install**: `npx shadcn@latest add @frictionborn/marquee`

## Intent

### Use When
- Logo clouds, customer testimonials, and partner strips
- Continuous market tickers, tech badges, and announcement banners
- Visual social proof ribbons requiring smooth continuous transit

### Avoid When
- Critical action buttons or primary call-to-action links that users must click immediately
- Dense paragraphs of essential reading material
- Pages where multiple moving strips compete for visual attention

### Alternatives
- **scroll-reveal**: When cards or media should reveal progressively upon scrolling rather than auto-looping

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — The animation does not run: the track is rendered static (not animated), with no duplicate copy and no pause button.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Animation paused and no duplicate copy rendered; the track is a static row, not animated (server render, prefers-reduced-motion, Save-Data, or no WebGL2)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: CSS marquee animation; same behaviour as tiers 2 and 3 (speed does not vary by tier)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: CSS marquee animation with hover/focus pause, width-based duration calibration and the pause button
- **T3 Full (fine pointer with hover on a capable machine)**: Same as tier 2

### Input Interactions
- **Pointer**: Hovering over the marquee pauses the animation when pauseOnHover is true
- **Touch**: No touch-specific behaviour; the animation runs on touch devices unless reduced motion is set
- **Keyboard**: Focus inside the marquee pauses it when pauseOnFocus is true; duplicate items are inert so each item is tabbed once

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 2.2.2
- **Notes**: The duplicate copy is aria-hidden and inert so screen readers and keyboard users encounter each element once. A built-in pause/play button is shown unless showPauseButton is false or reduced motion is set.

## Composition

- **Max Per Page**: 4
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: noise-field, text-reveal, scroll-reveal, scroll-showcase

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `—` | Required. Content elements repeated across the strip (rendered twice; avoid fixed ids). |
| `speed` | `number` | `40` | Approximate transit rate in pixels per second (duration = track width / speed, at least 5 s). |
| `direction` | `"left" \| "right"` | `"left"` | Scroll direction of the ticker. |
| `pauseOnHover` | `boolean` | `true` | Freezes scroll transit while the pointer hovers over the strip. |
| `pauseOnFocus` | `boolean` | `true` | Freezes scroll transit while any element inside the strip holds keyboard focus. |
| `showPauseButton` | `boolean` | `true` | Renders a pause/play button (not rendered under reduced motion). Keep it for marquees that run longer than 5 s. |
| `gap` | `string \| number` | `"2rem"` | Spacing between items (a number is treated as px). |
| `className` | `string` | `""` | CSS classes applied to the outer container (the built-in class fb-marquee is kept). |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the outer container, merged last (consumer wins). |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/marquee
```

### Usage
```tsx
import { Marquee } from "@/components/ui/marquee";

export default function PartnerStrip() {
  return (
    <Marquee speed={40} gap="2rem">
      <span>Partner A</span>
      <span>Partner B</span>
      <span>Partner C</span>
    </Marquee>
  );
}
```

### Common Mistakes to Avoid
- Do not remove the inert attribute from duplicate tracks or screen readers will double-read every item.
- Do not hide the pause control if the marquee runs continuously for more than 5 seconds (WCAG 2.2.2).
- The animation only runs when <html> has data-motion="ok" (MotionReadyScript in Next, initMotionReady() in Vite); without it the strip is static.
- Children are rendered twice, so do not give them fixed id attributes. Marquee accepts only the listed props; data-* and aria-* attributes are not forwarded.

### How to Verify
- Verify screen reader encounters each badge/item exactly once.
- Verify hovering or focusing an item pauses animation transit.
- Verify reduced motion stops the animation and renders a static row without a duplicate copy or pause button.
- Confirm Pause then Play resumes the animation while the pointer or keyboard focus is still on the button.

## Measured Bench Evidence

- **Bench Commit**: `7f3e58a` (2026-10-04)
- **Size**: 2.23 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-04 | 15 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-04 | 14 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-04 | 15 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-04 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-04 | 14 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
