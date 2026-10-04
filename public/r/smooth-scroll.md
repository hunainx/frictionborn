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
- Touchscreens and mobile devices (automatically disabled)

### Alternatives
- **native-scroll**: When standard browser compositor scrolling is sufficient without kinetic interpolation

## Runtime & Server Boundaries

- **Server Output**: `static-layout` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `off` — Disabled completely; 100% native platform momentum scrolling.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Disabled completely; native browser scrolling only
- **Tier 1** (Mid-range mobile): Disabled on coarse pointers and touchscreens; native touch momentum preserved
- **Tier 2** (Standard desktop / modern mobile): Standard smooth inertial scrolling stepped strictly via useFrame
- **Tier 3** (High performance GPU): High-precision smooth scrolling with fine pointer optimization

### Input Interactions
- **Pointer**: Wheel and keyboard events mediated via Lenis on fine pointers
- **Touch**: Native touch momentum scrolling 100% preserved; Lenis is inactive on coarse pointers
- **Keyboard**: Full support for Space, PageUp, PageDown, Arrow keys, Home, and End

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 2.1.1, 2.2.2, 2.3.3
- **Notes**: Native keyboard scrolling is fully preserved. When reduced motion is preferred, smooth scrolling is turned off completely, delegating all scroll behavior to the native platform compositor.

## Composition

- **Max Per Page**: 1
- **Singleton**: true
- **Conflicts With**: smooth-scroll
- **Pairs Well With**: sticky-scroll-story, scroll-reveal, noise-field

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `"undefined"` | Child components wrapped inside the smooth scroll provider. |
| `duration` | `number` | `1.2` | Scroll easing duration in seconds. |
| `orientation` | `"vertical" | "horizontal"` | `"\"vertical\""` | Primary scroll orientation. |
| `smoothWheel` | `boolean` | `true` | Whether to interpolate mouse wheel deltas. |
| `enabled` | `boolean` | `true` | Master toggle to enable or disable smooth scrolling. |
| `onScroll` | `(e: any) => void` | `"undefined"` | Callback invoked synchronously on every scroll update. |
| `prevent` | `(node: HTMLElement) => boolean` | `"undefined"` | Predicate to bypass smooth scrolling for specific nested DOM elements. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/smooth-scroll
# Optional: to pin exact lenis dependency: npm install --save-exact lenis@1.3.26 (registry accepts lenis@^1.3.26)
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
- Do not mount multiple SmoothScroll instances; SmoothScroll is a singleton provider.
- Do not import Lenis directly or create separate requestAnimationFrame loops.
- Do not use on dashboards, forms-heavy pages, or data-dense web applications.
- Registry accepts lenis@^1.3.26 for consumers; use --save-exact if your project enforces exact dependency pinning.

### How to Verify
- Verify keyboard navigation (Space, PageUp/Down, Arrows) works identically to native scrolling.
- Verify hash anchors (#section-id) jump smoothly without layout offsets.
- Verify reduced motion disables Lenis and returns 100% control to the platform.

## Measured Bench Evidence

- **Bench Commit**: `97a198a` (2026-10-03)
- **Size**: 1.6 KB initial / 0.02 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-03 | 14 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-03 | 14 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-03 | 14 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-03 | 14 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-03 | 14 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Derived From**:
  - Lenis smooth scroll engine: [https://github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) (MIT)
