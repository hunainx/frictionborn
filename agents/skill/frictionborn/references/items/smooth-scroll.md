# smooth-scroll — Specification Sheet

> page-provider: Lenis provider stepped strictly via useFrame with autoRaf false (dom, server-safe, singleton, reduced motion -> off, mobile -> off)

## Overview

- **Item Name**: `smooth-scroll`
- **Version**: `0.1.0`
- **Slot**: `page-provider`
- **Kind**: `scroll-provider`
- **Install**: `npx shadcn@latest add @frictionborn/smooth-scroll`

## Intent

### Use When
- Marketing landing pages requiring unified cinematic scroll feel
- Editorial feature stories paired with sticky scroll narratives
- Desktop viewports with fine pointers and high-refresh displays

### Avoid When
- Dashboards and data-dense productivity software
- Documentation sites and code-heavy portals
- Forms-heavy pages and modal-only checkout flows
- Touchscreens and mobile devices (automatically disabled on coarse pointers)

### Alternatives
- **native-scroll**: When standard browser compositor scrolling is sufficient without kinetic interpolation

## Runtime & Server Boundaries

- **Server Output**: `static-layout` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (stepped by the shared runtime `useFrame` loop)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `off` — Disabled completely; 100% native platform momentum scrolling.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Not gated by tier. Smooth scrolling runs unless reduced motion, enabled={false} or a coarse pointer disables it; Save-Data and no-WebGL2 (tier 0) do not disable it
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Coarse pointer: disabled, native touch momentum scrolling preserved
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Coarse pointer: disabled. On a fine or absent pointer (low-end hints or viewport < 480px) smooth scrolling runs, stepped via useFrame
- **T3 Full (fine pointer with hover on a capable machine)**: Smooth scrolling runs (fine pointer with hover), stepped via useFrame; same behaviour as tier 2 on fine pointers

### Input Interactions
- **Pointer**: Wheel input is interpolated by Lenis (smoothWheel) unless the pointer is coarse, reduced motion is set, or enabled is false
- **Touch**: Native touch momentum scrolling is preserved; Lenis is inactive on coarse pointers
- **Keyboard**: Keys (Space, PageUp, PageDown, arrows, Home, End) scroll natively; Lenis does not intercept them and a keydown only wakes the shared frame loop

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 2.1.1, 2.2.2, 2.3.3
- **Notes**: Native keyboard scrolling is preserved. When reduced motion is preferred, smooth scrolling is turned off completely, delegating all scroll behavior to the native platform compositor.

## Composition

- **Max Per Page**: 1
- **Singleton**: true
- **Conflicts With**: None
- **Pairs Well With**: sticky-scroll-story, scroll-reveal, noise-field

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `—` | Optional. No default. Child components wrapped inside the provider (rendered in a display: contents div). |
| `duration` | `number` | `1200` | Scroll easing duration in milliseconds (e.g. 1200 means 1.2 seconds). |
| `paused` | `boolean` | `false` | Universal pause prop. Freezes kinetic smooth scrolling. |
| `easing` | `(t: number) => number` | `"(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))"` | Easing function (default is a module-level function). Read through a ref, so an inline function does not recreate Lenis. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Primary scroll orientation. |
| `gestureOrientation` | `"vertical" \| "horizontal" \| "both"` | `"vertical"` | Gesture direction Lenis listens to. |
| `smoothWheel` | `boolean` | `true` | Whether to interpolate mouse wheel deltas. |
| `touchMultiplier` | `number` | `1` | Lenis touch multiplier (touch scrolling is not smoothed on coarse pointers because SmoothScroll is disabled there). |
| `infinite` | `boolean` | `false` | Lenis infinite scroll option. |
| `enabled` | `boolean` | `true` | Master toggle to enable or disable smooth scrolling. |
| `onScroll` | `(e: any) => void` | `—` | Called with the Lenis scroll event (not the DOM scroll event, even though the root is a <div>). |
| `prevent` | `(node: HTMLElement) => boolean` | `—` | Optional. No default. Predicate to bypass smooth scrolling for specific DOM nodes. Nested scrollers (allowNestedScroll) and [role="dialog"], [aria-modal="true"], dialog[open], [data-lenis-prevent] are always bypassed. |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root <div>, which is display: contents, so its bounding box is empty (use it for data attributes, not geometry). |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: `lenis@1.3.26`

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/smooth-scroll
```

### Usage
```tsx
import { SmoothScroll } from "@/components/ui/smooth-scroll";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      {children}
    </SmoothScroll>
  );
}
```

### Common Mistakes to Avoid
- Do not mount multiple SmoothScroll instances; SmoothScroll is a singleton provider (a second mount warns and does nothing).
- Do not import Lenis directly or create separate requestAnimationFrame loops.
- Do not use on dashboards, forms-heavy pages, or data-dense web applications.
- The registry installs lenis@1.3.26 and consumers accept lenis@^1.3.26; to pin exactly run: npm install --save-exact lenis@1.3.26 (or the equivalent for your package manager).
- SmoothScroll is stepped by the shared useFrame loop. While the runtime pauseAll() is active (the runtime global pause; AmbientHero's own pause button no longer triggers it) that loop, and therefore SmoothScroll's stepping, is stopped; verify wheel scrolling on pages that combine them.
- duration is in milliseconds (1200 = 1.2 s). A seconds value such as 1.2 now means 1.2 ms and the scroll looks instant.

### How to Verify
- Verify keyboard navigation (Space, PageUp/Down, Arrows) works identically to native scrolling.
- Verify hash anchors (#section-id) jump smoothly without layout offsets.
- Verify reduced motion disables Lenis and returns 100% control to the platform.

## Measured Bench Evidence

- **Bench Commit**: `53fd14c` (2026-10-05)
- **Size**: 2.6 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-05 | 18 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 13 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 18 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 18 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 13 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Derived From**:
  - Lenis smooth scroll engine: [https://github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) (MIT)
