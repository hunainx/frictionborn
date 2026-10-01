# marquee — Specification Sheet

> strip: Infinite marquee with inert duplicate, hover/focus pause, and WCAG pause button (dom, server-safe, <2.5 KB, reduced motion -> static, mobile -> ok)

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

- **Server Output**: `final-state` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `while-visible` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Animation ceases and track displays as a static, horizontally scrollable row.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static horizontally scrollable row without CSS keyframe animation
- **Tier 1** (Mid-range mobile): CSS marquee running at conservative speed without extra rAF hooks
- **Tier 2** (Standard desktop / modern mobile): Standard CSS marquee with hover/focus pause listeners
- **Tier 3** (High performance GPU): Full CSS marquee with dynamic width calibration and accessible pause controls

### Input Interactions
- **Pointer**: Hovering pauses animation loop automatically
- **Touch**: Touch-scrollable row under reduced motion or static tiers
- **Keyboard**: Tabbing into items pauses marquee; duplicate items are inert

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 2.2.2
- **Notes**: Duplicate copy is marked aria-hidden='true' and inert so screen readers and keyboard users encounter each element exactly once. Built-in pause button satisfies WCAG 2.2.2.

## Composition

- **Max Per Page**: 4
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: noise-field, text-reveal, scroll-reveal, scroll-showcase

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `"undefined"` | Content elements repeated across scrolling strip. |
| `speed` | `number` | `40` | Transit rate in pixels per second. |
| `direction` | `"left" | "right"` | `"\"left\""` | Scroll direction of the ticker. |
| `pauseOnHover` | `boolean` | `true` | Freezes scroll transit while pointer hovers over strip. |
| `pauseOnFocus` | `boolean` | `true` | Freezes scroll transit while any child element holds keyboard focus. |
| `showPauseButton` | `boolean` | `true` | Renders accessible button allowing users to pause animation (WCAG 2.2.2). |
| `gap` | `string | number` | `"\"2rem\""` | Spacing between subsequent items. |
| `className` | `string` | `"\"\""` | CSS classes applied to outer container. |
| `maxTier` | `number` | `3` | Hard ceiling on device capability tier. |

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

### How to Verify
- Verify screen reader encounters each badge/item exactly once.
- Verify hovering or focusing an item pauses animation transit.
- Verify reduced motion pauses marquee into a static scrollable row.

## Measured Bench Evidence

- **Bench Commit**: `e6725ba` (2026-10-01)
- **Size**: 1.91 KB initial / 0.02 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-01 | 12 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-01 | 12 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-01 | 12 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-01 | 12 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-01 | 12 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
