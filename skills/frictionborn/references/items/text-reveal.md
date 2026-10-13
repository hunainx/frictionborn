# text-reveal — Specification Sheet

> headline: word/line/char text reveal (dom, server-safe, SSR text stays static, reduced motion -> static, low-end mobile -> 40 ms stagger)

## Overview

- **Item Name**: `text-reveal`
- **Version**: `0.1.0`
- **Slot**: `headline`
- **Kind**: `dom`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/text-reveal`

## Intent

### Use When
- Hero headlines and section titles requiring editorial typographic reveals
- Marketing landing pages with high-signal opening statements
- Feature headings that need stepped entrance animations

### Avoid When
- Long paragraphs or running prose (> 2 lines of body text)
- Frequently updating real-time data or tickers
- Forms and interactive controls

### Alternatives
- **scroll-reveal**: When revealing whole blocks, cards, or media rather than individual text tokens

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `none` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Renders plain static text without splitting or animations.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Plain static text, no splitting (server render, prefers-reduced-motion, Save-Data, or no WebGL2)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Animated reveal with the stagger capped at 40 ms (coarse pointer with low-end hints)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Animated reveal with the configured stagger (60 ms by default)
- **T3 Full (fine pointer with hover on a capable machine)**: Same as tier 2; the `by` mode (word, character, line) is honoured at every animated tier

### Input Interactions
- **Pointer**: None. The reveal plays once when the component mounts on the client (for example in a Vite SPA or after client-side navigation) or when replayKey changes. A server-rendered instance is painted as static final text and does not animate unless replayKey is set.
- **Touch**: Same as pointer; the stagger is capped at 40 ms only on tier 1 and tier 0 devices
- **Keyboard**: None; the text is not focusable. It stays selectable. Screen readers read a visually hidden copy of the full text; the animated tokens are aria-hidden.

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 1.3.1, 1.4.3, 2.2.2
- **Notes**: Original text is preserved in a visually-hidden span while animated tokens are marked aria-hidden='true', ensuring screen readers never read fragmented letters or words.

## Composition

- **Max Per Page**: 5
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: noise-field, magnetic-button, ambient-hero

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `string` | `—` | Required. Plain text string to split and reveal (not JSX). |
| `as` | `React.ElementType` | `"h1"` | HTML tag to render as root container. |
| `by` | `"word" \| "character" \| "line"` | `"word"` | Token granularity for entrance stagger. |
| `delay` | `number` | `0` | Initial delay in ms before animation begins. |
| `stagger` | `number` | `60` | Delay in ms between subsequent token animations. Capped at 40 ms when the tier is 1 or lower. |
| `duration` | `number` | `400` | Duration in ms for each token entrance. |
| `className` | `string` | `""` | Extra classes on the root element (the built-in class fb-text-reveal is kept). |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root element, merged after position: relative and display: block (consumer wins). |
| `ref` | `React.Ref<any>` | `—` | Receives the root element chosen by `as` (it also contains the scoped <style> and a screen-reader copy of the text). |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier. |
| `replayKey` | `string \| number` | `—` | Optional. No default. When set (or changed), the entrance animation plays after hydration even for a server-rendered instance. |
| `paused` | `boolean` | `false` | Universal pause prop. Renders plain static text instead of the animated tokens; un-pausing replays the reveal from the start (it does not freeze mid-animation). |
| `nonce` | `string` | `—` | Optional CSP nonce forwarded to the internal scoped <style> element. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/text-reveal
```

### Usage
```tsx
import { TextReveal } from "@/components/ui/text-reveal";

export default function HeroHeadline() {
  return (
    <TextReveal as="h1" by="word" className="text-4xl font-bold tracking-tight">
      Engineered Motion for High-Signal Interfaces
    </TextReveal>
  );
}
```

### Common Mistakes to Avoid
- Do not pass complex React elements or JSX as children; TextReveal expects a text string to tokenize.
- Do not hide text with opacity: 0 before hydration; the component handles static visibility safely.
- A server-rendered TextReveal is painted as final static text and does not animate unless replayKey is set; do not expect a reveal on a Next.js server-rendered hero without it.
- Other props (data-*, aria-*, handlers) are spread on the root element; do not pass your own id (the component uses its own to detect a server render).
- The reveal styles apply only when <html> has data-motion="ok" (MotionReadyScript in Next, initMotionReady() in Vite).

### How to Verify
- Verify full headline text is present in server HTML before JavaScript executes.
- Verify screen reader reads text as a single coherent sentence without letter-by-letter pauses.
- Verify reduced motion produces immediate static text with zero rAF cycles.

## Measured Bench Evidence

- **Bench Commit**: `da21af4` (2026-10-05)
- **Size**: 3.14 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-05 | 14 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 14 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 14 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 14 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
