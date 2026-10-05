# scroll-showcase — Specification Sheet

> Scroll composition: StickyScrollStory + ScrollReveal + optional Marquee; all copy comes from props (DOM, reduced motion -> static/opacity, mobile -> stacked)

## Overview

- **Item Name**: `scroll-showcase`
- **Version**: `0.1.0`
- **Slot**: `composition`
- **Kind**: `composition`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/scroll-showcase`

## Intent

### Use When
- Product feature narrative requiring sticky step progression and reveal on scroll
- Product or engineering deep-dive with step-by-step media and an optional metrics grid
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
- **Notes**: Sections are named through aria-labelledby (the headline, and the specs heading when you pass one) or aria-label (marqueeLabel when you pass one); ids are generated per instance with useId, so two sections on one page never clash. Heading levels run h2 (headline), h2 (each step title, from StickyScrollStory), h3 (specsHeading), h4 (spec labels): place the section under an h1 and check the outline for your page. media.alt applies only to media.type 'image'. Every colour is a host token (--background, --foreground, --primary, --muted-foreground, --card, --border) with a system-colour fallback; contrast follows your theme: measured on real pixels in a fresh Next 16 app with shadcn's default tokens (sample content, light and dark, 1440 and 390 px) every text element was at least 4.7:1 (light) and 6.9:1 (dark); verify your own content.

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
| `specsHeading` | `string` | `—` | Optional. Heading above the specifications grid. Nothing is rendered when omitted. |
| `specsEyebrow` | `string` | `—` | Optional. Small label above the specifications heading. Nothing is rendered when omitted. |
| `showMarquee` | `boolean` | `true` | Shows the marquee ticker when marqueeItems is non-empty. |
| `marqueeItems` | `React.ReactNode[]` | `—` | Optional. Array of items to display in the marquee ticker. |
| `marqueeLabel` | `string` | `—` | Optional. Label above the marquee ticker, also its accessible name. Nothing is rendered when omitted. |
| `smoothScroll` | `boolean` | `false` | Wraps the composition in the SmoothScroll provider (off by default). |
| `paused` | `boolean` | `false` | Universal pause prop. Passed to the reveals, the story, the marquee and SmoothScroll (the reveals only react when the browser lacks CSS scroll-driven animation). |
| `nonce` | `string` | `—` | Optional CSP nonce forwarded to the <style> element of every item the section renders. |
| `className` | `string` | `—` | Optional. No default. Additional CSS class names on the root container. Any other HTML attribute (id, data-*, aria-*, event handlers) is spread on the root element; handlers the item uses itself are composed, not replaced. |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root container, merged last (consumer wins). |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root <div>. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: `@frictionborn/sticky-scroll-story`, `@frictionborn/scroll-reveal`, `@frictionborn/marquee`, `@frictionborn/smooth-scroll`
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/scroll-showcase
```

### Usage
```tsx
// Installing scroll-showcase also installs sticky-scroll-story, scroll-reveal, marquee and smooth-scroll (and therefore lenis@1.3.26), even when smoothScroll stays false.
import { ScrollShowcase } from '@/components/ui/scroll-showcase';

const steps = [
  { id: 'one', title: 'First step', description: 'What happens first.', media: { content: <div>Illustration</div> } },
  { id: 'two', title: 'Second step', description: 'What happens next.', media: { content: <div>Illustration</div> } },
];

export default function Story() {
  return <ScrollShowcase headline="How it works" description="Three plain sentences." steps={steps} />;
}
```

### Common Mistakes to Avoid
- headline, description and steps are required and the component contains no copy of its own: nothing is rendered for specsHeading, specsEyebrow or marqueeLabel unless you pass them.
- StickyScrollStory renders each step's media.content twice (a sticky column and a stacked mobile copy), so do not put ids inside it.
- Do not enable smoothScroll on dashboards or documentation pages, and never when another SmoothScroll is mounted (a second one warns and does nothing).
- Do not place multiple sticky scroll sections immediately adjacent to each other without spacing.
- Under a nonce-based CSP pass nonce: it is forwarded to every <style> the section renders.
- Reveal and marquee animations only run when <html> has data-motion="ok" (MotionReadyScript in Next, initMotionReady() in Vite).

### How to Verify
- Verify that the step sequence is fully accessible in DOM reading order.
- Verify that mobile viewports switch to stacked mode without sticky jumping.
- Verify that reduced-motion preferences stop the marquee animation and reveals remain static.

## Measured Bench Evidence

- **Bench Commit**: `53fd14c` (2026-10-05)
- **Size**: 2.37 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
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
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 18 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 18 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 18 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 18 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
