# sticky-scroll-story — Specification Sheet

> scroll-section: Sticky media column with scrolling steps (dom, server-safe, CLS <= 0.01, reduced motion -> opacity-only (instant swap), mobile -> stacked)

## Overview

- **Item Name**: `sticky-scroll-story`
- **Version**: `0.1.0`
- **Slot**: `scroll-section`
- **Kind**: `dom`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/sticky-scroll-story`

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

- **Server Output**: `static-layout` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `none` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `opacity-only` — Media swaps are instant (inactive media is hidden with opacity 0 and transitions are disabled, so there is no fade); no translation or parallax. Server HTML keeps all media visible.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Not gated by tier: sticky two-column layout above 768px, stacked at 768px and below (same at every tier)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 0; layout depends on viewport width, not tier
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Same as tier 0; layout depends on viewport width, not tier
- **T3 Full (fine pointer with hover on a capable machine)**: Same as tier 0; layout depends on viewport width, not tier

### Input Interactions
- **Pointer**: None; active step is driven solely by scroll position (IntersectionObserver)
- **Touch**: Stacked layout at viewport width 768px and below, with media shown inline under each step
- **Keyboard**: Native focus order and keyboard scrolling; the component adds no focusable elements

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 1.3.1, 1.3.2, 2.2.2
- **Notes**: DOM order matches reading order. The active step has aria-current='step'. Image media (media.type 'image') gets alt from media.alt, falling back to the step title. Custom media (media.content) gets no alt: supply accessible text inside the content yourself. Each step's media is rendered twice (sticky column and inline mobile copy); only one is visible at a time.

## Composition

- **Max Per Page**: 2
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: smooth-scroll, scroll-reveal, text-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `steps` | `StoryStep[]` | `—` | Required. Array of { id: string; title: string; description: string; badge?: string; media: { type?: "image" \| "custom"; src?: string; alt?: string; content?: React.ReactNode } }. |
| `mediaPosition` | `"left" \| "right"` | `"right"` | Alignment of the sticky media column relative to the text narrative. |
| `onStepChange` | `(stepId: string) => void` | `—` | Optional. No default. Called with the step id when a step becomes active. |
| `paused` | `boolean` | `false` | Universal pause prop. Stops tracking the scrolled step: the active step stays where it is. |
| `nonce` | `string` | `—` | Optional CSP nonce forwarded to the internal scoped <style> element. |
| `className` | `string` | `""` | Optional CSS class names to apply to root container. |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles for the root container. |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root <div>. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/sticky-scroll-story
```

### Usage
```tsx
import { StickyScrollStory, type StoryStep } from "@/components/ui/sticky-scroll-story";

const steps: StoryStep[] = [
  {
    id: "step-1",
    title: "Feature One",
    description: "Detailed description of feature one.",
    media: { type: "image", src: "/img1.webp", alt: "Feature 1 preview" },
  },
];

export default function StorySection() {
  return <StickyScrollStory steps={steps} />;
}
```

### Common Mistakes to Avoid
- Do not attach window scroll listeners to calculate sticky step progress; StickyScrollStory uses IntersectionObserver.
- Do not invert DOM order; reading order must match step sequence for assistive technology.
- media.alt is only used when media.type is 'image'; for custom media put accessible text inside media.content.
- The inactive-media hiding only applies under html[data-motion="ok"] (MotionReadyScript in Next, initMotionReady() in Vite) or after hydration with reduced motion.
- Each step's media.content is rendered twice (sticky column and stacked mobile copy): no ids inside it. Step titles are h2 elements; put your section heading above them accordingly.

### How to Verify
- Verify mobile layout (<= 768px) cleanly stacks steps and media without sticky jumps.
- Verify aria-current='step' updates as steps scroll through the viewport center.
- Verify CLS <= 0.01 during rapid scrolling.

## Measured Bench Evidence

- **Bench Commit**: `801163e` (2026-10-21)
- **Size**: 2.81 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
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
| Firefox Desktop | playwright | 3 | pass | 2026-10-21 | 15 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-21 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-21 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
