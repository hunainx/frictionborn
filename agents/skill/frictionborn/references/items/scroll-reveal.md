# scroll-reveal — Specification Sheet

> media: Scroll-driven entrance using view-timeline with pooled IntersectionObserver fallback (dom, server-safe, <2 KB, reduced motion -> static, mobile -> 12px)

## Overview

- **Item Name**: `scroll-reveal`
- **Version**: `0.1.0`
- **Slot**: `media`
- **Kind**: `dom`
- **Install**: `npx shadcn@latest add @frictionborn/scroll-reveal`

## Intent

### Use When
- Feature cards, images, and marketing content blocks entering the viewport
- Staggered grid items revealing progressively during downward scroll
- Sections where scroll-triggered visibility enhances progressive narrative

### Avoid When
- Above-the-fold hero elements that must paint immediately for LCP
- Sticky navigation bars or persistent floating controls
- Dense data tables and interactive form fields

### Alternatives
- **text-reveal**: When revealing headline text tokens rather than containers or media elements

## Runtime & Server Boundaries

- **Server Output**: `final-state` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `none` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Content is rendered in its final visible state without transition delays or scroll triggers.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static fully-visible content rendered without transitions
- **Tier 1** (Mid-range mobile): Single-threshold intersection observer with reduced 12px distance
- **Tier 2** (Standard desktop / modern mobile): Pooled intersection observer with standard 24px travel distance
- **Tier 3** (High performance GPU): Native animation-timeline: view() with zero JS overhead where supported

### Input Interactions
- **Pointer**: Scroll-linked entrance triggered as container enters viewport
- **Touch**: Same scroll trigger with mobile travel distance capped at 12px
- **Keyboard**: Focus-within guard forces element visible immediately when tabbed into

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 1.3.1, 1.4.3, 2.2.2
- **Notes**: Focus guard forces any element containing active focus visible immediately, preventing keyboard traps during scroll.

## Composition

- **Max Per Page**: 20
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: noise-field, text-reveal, magnetic-button

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `"undefined"` | Content elements wrapped and revealed on scroll. |
| `as` | `React.ElementType` | `"\"div\""` | HTML tag rendered as root container. |
| `animation` | `"fade-up" | "fade" | "scale-up"` | `"\"fade-up\""` | Visual entrance curve variant. |
| `distance` | `number` | `24` | Vertical travel distance in pixels. |
| `duration` | `number` | `400` | Transition duration in ms. |
| `once` | `boolean` | `true` | When true, entrance triggers once and remains visible. |
| `maxTier` | `number` | `3` | Hard ceiling on device capability tier. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/scroll-reveal
```

### Usage
```tsx
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function CardGrid() {
  return (
    <ScrollReveal animation="fade-up" distance={24}>
      <div className="rounded-lg border p-6">
        <h3>Feature Title</h3>
        <p>Feature description.</p>
      </div>
    </ScrollReveal>
  );
}
```

### Common Mistakes to Avoid
- Do not use ScrollReveal on above-the-fold hero elements; hero text should be visible immediately for LCP.
- Do not nest ScrollReveal components inside each other; keep entrance containers flat.

### How to Verify
- Verify content is visible in server HTML without JavaScript execution.
- Verify tabbing into hidden cards forces them visible immediately via focus guard.
- Verify reduced motion renders final visible content with zero animation delays.

## Measured Bench Evidence

- **Bench Commit**: `e6725ba` (2026-10-01)
- **Size**: 1.39 KB initial / 0.02 KB deferred (gzip, via gzip-9)
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
