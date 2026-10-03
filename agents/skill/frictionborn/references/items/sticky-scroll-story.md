# sticky-scroll-story — Specification Sheet

> scroll-section: Sticky media column with scrolling steps (dom, server-safe, 0 CLS, reduced motion -> opacity-only, mobile -> stacked)

## Overview

- **Item Name**: `sticky-scroll-story`
- **Version**: `0.1.0`
- **Slot**: `scroll-section`
- **Kind**: `dom`
- **Install**: `npx shadcn@latest add @frictionborn/sticky-scroll-story`

## Intent

### Use When
- Editorial feature walk-throughs with accompanying media illustrations
- Product showcase stories highlighting sequential capabilities
- Multi-step walkthroughs where media changes as user reads through text

### Avoid When
- Short single-paragraph descriptions without multi-step progression
- Galleries where media should scroll freely rather than remain sticky
- Dense data tables and forms

### Alternatives
- **scroll-reveal**: When revealing standalone cards or sections without pinned media

## Runtime & Server Boundaries

- **Server Output**: `static-layout` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `none` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `opacity-only` — Instant media crossfades (<=150ms) without vertical translation or parallax motion.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Stacked static layout with immediate visibility
- **Tier 1** (Mid-range mobile): Mobile stacked layout with media paired per step
- **Tier 2** (Standard desktop / modern mobile): Sticky two-column layout with CSS crossfades
- **Tier 3** (High performance GPU): Full sticky two-column layout with CSS crossfades

### Input Interactions
- **Pointer**: None; progress driven solely by scroll position
- **Touch**: Stacked layout below 768px for zero-jump native mobile scrolling
- **Keyboard**: Full native focus progression and keyboard scrolling support

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 1.3.1, 1.3.2, 2.2.2
- **Notes**: DOM order strictly matches reading order. The active story step is decorated with aria-current='step'. All media elements have descriptive accessible text.

## Composition

- **Max Per Page**: 2
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: smooth-scroll, scroll-reveal, text-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `steps` | `StoryStep[]` | `"undefined"` | Array of story steps containing id, title, description, badge, and media. |
| `mediaPosition` | `"left" | "right"` | `"\"right\""` | Alignment of the sticky media column relative to the text narrative. |
| `className` | `string` | `"\"\""` | Optional CSS class names to apply to root container. |
| `style` | `React.CSSProperties` | `"undefined"` | Optional inline CSS styles for root container. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/sticky-scroll-story
```

### Usage
```tsx
import { StickyScrollStory } from "@/components/ui/sticky-scroll-story";

const steps = [
  {
    id: "step-1",
    title: "Feature One",
    description: "Detailed description of feature one.",
    media: { type: "image", src: "/img1.webp", alt: "Feature 1 preview" }
  }
];

export default function StorySection() {
  return <StickyScrollStory steps={steps} />;
}
```

### Common Mistakes to Avoid
- Do not attach window scroll listeners to calculate sticky step progress; StickyScrollStory uses IntersectionObserver.
- Do not invert DOM order; reading order must match step sequence for assistive technology.

### How to Verify
- Verify mobile layout (< 768px) cleanly stacks steps and media without sticky jumps.
- Verify aria-current='step' updates as steps scroll through the viewport center.
- Verify 0 layout shifts (CLS = 0) during rapid scrolling.

## Measured Bench Evidence

- **Bench Commit**: `d5e811d` (2026-10-03)
- **Size**: 2.58 KB initial / 0.02 KB deferred (gzip, via gzip-9)
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
- **Origin**: Original implementation for Frictionborn Motion.
