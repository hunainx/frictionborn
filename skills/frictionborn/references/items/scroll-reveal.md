# scroll-reveal — Specification Sheet

> media: Scroll-driven entrance (CSS view() timeline, IntersectionObserver fallback) (dom, server-safe, reduced motion -> static, low-end mobile -> 12px)

## Overview

- **Item Name**: `scroll-reveal`
- **Version**: `0.1.0`
- **Slot**: `media`
- **Kind**: `dom`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/scroll-reveal`

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

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `none` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Content is rendered in its final visible state without transition delays or scroll triggers.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Content fully visible and static, no reveal classes (server render, prefers-reduced-motion, Save-Data, or no WebGL2)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Reveal with the travel distance capped at 12px (coarse pointer with low-end hints)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Reveal with the configured travel distance (24px by default)
- **T3 Full (fine pointer with hover on a capable machine)**: Same as tier 2. At every animated tier, browsers that support animation-timeline use the scroll-linked CSS animation; others use the IntersectionObserver fallback. The observer hook is mounted in both cases.

### Input Interactions
- **Pointer**: Scroll-linked entrance as the container enters the viewport. Where animation-timeline: view() is supported the animation is scroll-linked and reverses when scrolling back up.
- **Touch**: Same scroll trigger; the travel distance is capped at 12px only on tier 1 and tier 0 devices
- **Keyboard**: Focus-within guard forces element visible immediately when tabbed into

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 1.3.1, 1.4.3, 2.2.2
- **Notes**: Focus guard forces any element containing active focus visible immediately, preventing keyboard traps during scroll. Hidden-before-reveal styles exist only under html[data-motion="ok"]; server HTML and reduced-motion users see the content visible.

## Composition

- **Max Per Page**: 20
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: noise-field, text-reveal, magnetic-button

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `—` | Required. Content elements wrapped and revealed on scroll. |
| `as` | `React.ElementType` | `"div"` | HTML tag rendered as root container. |
| `animation` | `"fade-up" \| "fade" \| "scale-up"` | `"fade-up"` | Visual entrance variant. |
| `distance` | `number` | `24` | Vertical travel distance in pixels (half of it for scale-up); capped at 12 when the tier is 1 or lower. |
| `duration` | `number` | `400` | Transition duration in ms. Applies only to the IntersectionObserver fallback; the native view-timeline animation is scroll-linked and ignores it. |
| `once` | `boolean` | `true` | In the IntersectionObserver fallback, true keeps the content revealed after the first entry. The native view-timeline path is scroll-linked and reverses when scrolling back up regardless of this prop. |
| `className` | `string` | `""` | Extra classes on the root element (the built-in class fb-scroll-reveal is kept). |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root element, merged after display: block and position: relative (consumer wins). |
| `ref` | `React.Ref<any>` | `—` | Receives the root element chosen by `as`. |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier. |
| `paused` | `boolean` | `false` | Universal pause prop. Forces the content visible and still. Where the browser supports CSS scroll-driven animation the reveal is driven by the scroll position and this prop has no effect. |
| `nonce` | `string` | `—` | Optional CSP nonce forwarded to the internal scoped <style> element (one is rendered per instance). |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/scroll-reveal
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
- The reveal only runs when <html> has data-motion="ok" (MotionReadyScript in Next, initMotionReady() in Vite); without it the content is static.
- Other props (id, data-*, aria-*, handlers) are spread on the root element.

### How to Verify
- Verify content is visible in server HTML without JavaScript execution.
- Verify tabbing into hidden cards forces them visible immediately via focus guard.
- Verify reduced motion renders final visible content with zero animation delays.

## Measured Bench Evidence

- **Bench Commit**: `538b855` (2026-10-20)
- **Size**: 2 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-20 | 14 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-20 | 13 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-20 | 13 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-20 | 13 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-20 | 13 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
