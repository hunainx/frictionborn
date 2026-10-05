# scroll-showcase — Specification Sheet

> Scroll composition: StickyScrollStory + ScrollReveal + optional Marquee, fixed demo copy (DOM, reduced motion -> static/opacity, mobile -> stacked)

## Overview

- **Item Name**: `scroll-showcase`
- **Version**: `0.1.0`
- **Slot**: `composition`
- **Kind**: `composition`
- **Install**: `npx shadcn@latest add @frictionborn/scroll-showcase`

## Intent

### Use When
- Product feature narrative requiring sticky step progression and reveal on scroll
- Architecture or engineering deep-dive with technical media and metrics (replace the built-in demo copy first)
- Multi-section storytelling with accessible scroll-driven reveals

### Avoid When
- Short single-screen pages without scroll depth
- Mobile web apps requiring dense vertical list views
- Documentation sites where uninterrupted linear reading is essential

### Alternatives
- **sticky-scroll-story**: When you only need the sticky step column without accompanying feature grids or marquee
- **scroll-reveal**: When you only need basic reveal-on-scroll animations for individual cards

## Runtime & Server Boundaries

- **Server Output**: `static-layout` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `none` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `opacity-only` — StickyScrollStory swaps media instantly (no transition, no translation); ScrollReveal elements are immediately visible; Marquee stops animating and renders a static row (no duplicate copy, no pause button)

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Not gated by tier: layout stacks at viewport width 768px and below; ScrollReveal content is static; Marquee is paused with no duplicate copy
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: ScrollReveal travel capped at 12px; Marquee still animates; layout depends on viewport width, not tier
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Sticky story with CSS crossfades, scroll-linked or IntersectionObserver reveals, animated marquee
- **T3 Full (fine pointer with hover on a capable machine)**: Same as tier 2

### Input Interactions
- **Pointer**: Hovering the marquee pauses it; the sticky story is driven by scroll position
- **Touch**: At viewport width 768px and below the story is stacked without sticky positioning
- **Keyboard**: DOM order matches visual order; the only added focusable element is the marquee pause button, and focus inside the marquee pauses it

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 2.1.1, 2.2.2, 2.4.1, 2.4.6
- **Notes**: Sections carry aria-labelledby / aria-label with hard-coded ids (architecture-heading, performance-heading). Heading levels run h2 (section and step titles), h3, h4. The default step media is aria-hidden SVG inside visible caption cards; the `alt` strings in the default steps are not rendered because alt applies only to media.type 'image'. Colours are hard-coded: fixed light text and dark cards on a var(--background) section, so contrast is only suitable for a dark host theme and is not verified.

## Composition

- **Max Per Page**: 1
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: ambient-hero

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `headline` | `string` | `—` | Required. Primary section headline rendered as an h2. |
| `description` | `string` | `—` | Required. Section narrative description below the headline. |
| `steps` | `StoryStep[]` | `—` | Required. Narrative steps for StickyScrollStory ({ id, title, description, badge?, media }). |
| `eyebrow` | `string` | `—` | Optional. Eyebrow badge above the headline. |
| `specs` | `ScrollShowcaseSpec[]` | `—` | Optional. Specifications / highlights grid items ({ metric, label, detail }). |
| `specsHeading` | `string` | `"Laboratory verification standards"` | Optional. Specifications section heading. |
| `specsEyebrow` | `string` | `"Measured Tolerances"` | Optional. Specifications eyebrow badge. |
| `showMarquee` | `boolean` | `true` | Includes the reference marquee ticker. |
| `marqueeItems` | `React.ReactNode[]` | `—` | Optional. Array of items to display in the marquee ticker. |
| `marqueeLabel` | `string` | `"Reference deployments in critical listening rooms"` | Optional. Label above the marquee ticker. |
| `smoothScroll` | `boolean` | `false` | Wraps the composition in the SmoothScroll provider (off by default). |
| `paused` | `boolean` | `false` | Universal pause prop. Freezes all internal motion. |
| `className` | `string` | `—` | Optional. No default. Additional CSS class names on the root container. |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root container, merged last (consumer wins). |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: `@frictionborn/sticky-scroll-story`, `@frictionborn/scroll-reveal`, `@frictionborn/marquee`, `@frictionborn/smooth-scroll`
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/scroll-showcase
```

### Usage
```tsx
// Installing scroll-showcase also installs sticky-scroll-story, scroll-reveal, marquee and smooth-scroll (and therefore lenis@1.3.26), even when smoothScroll stays false.
import { ScrollShowcase } from '@/components/ui/scroll-showcase';

<ScrollShowcase showMarquee={true} />
```

### Common Mistakes to Avoid
- The section headings, the three lab-spec numbers (±0.8 dB, < 0.04%, 0.2 ms), the marquee's eight studio names and the stat-card and step-card colours are hard-coded (text on the host background uses --primary and --muted-foreground) demo content and cannot be overridden through props. Edit the copied source before shipping to a client; do not publish the numbers or studio names as real claims.
- Do not enable smoothScroll on dashboards or documentation pages.
- Do not place multiple sticky scroll sections immediately adjacent to each other without spacing.
- Element ids are hard-coded, so use at most one ScrollShowcase per page.
- Reveal and marquee animations only run when <html> has data-motion="ok" (MotionReadyScript in Next, initMotionReady() in Vite).

### How to Verify
- Verify that the step sequence is fully accessible in DOM reading order.
- Verify that mobile viewports switch to stacked mode without sticky jumping.
- Verify that reduced-motion preferences stop the marquee animation and reveals remain static.

## Measured Bench Evidence

- **Bench Commit**: `7f3e58a` (2026-10-04)
- **Size**: 3.68 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-04 | 17 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-04 | 17 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-04 | 17 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-04 | 17 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-04 | 17 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
