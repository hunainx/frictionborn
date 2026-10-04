# text-reveal — Specification Sheet

> headline: Typography reveal by word/line/char with font-ready splitting (dom, server-safe, <3 KB, reduced motion -> static, mobile -> reduced stagger)

## Overview

- **Item Name**: `text-reveal`
- **Version**: `0.1.0`
- **Slot**: `headline`
- **Kind**: `dom`
- **Install**: `npx shadcn@latest add @frictionborn/text-reveal`

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

- **Server Output**: `final-state` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `none` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Renders plain static text without splitting or animations.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static un-animated text rendered immediately without split tokens
- **Tier 1** (Mid-range mobile): Word-level reveal with reduced stagger duration (40ms)
- **Tier 2** (Standard desktop / modern mobile): Full word or line reveal with standard stagger (60ms)
- **Tier 3** (High performance GPU): Full word, line, or character reveal with high-precision stagger

### Input Interactions
- **Pointer**: None; typography entrance runs once upon mounting
- **Touch**: Same as fine pointer with mobile-optimized stagger timing
- **Keyboard**: Text is fully focusable and selectable with standard native cursor

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
| `children` | `string` | `"undefined"` | Text string to split and reveal. |
| `as` | `React.ElementType` | `"\"h1\""` | HTML tag to render as root container. |
| `by` | `"word" | "character" | "line"` | `"\"word\""` | Token granularity for entrance stagger. |
| `delay` | `number` | `0` | Initial delay in ms before animation begins. |
| `stagger` | `number` | `60` | Delay in ms between subsequent token animations. |
| `duration` | `number` | `400` | Duration in ms for each token entrance. |
| `maxTier` | `number` | `3` | Hard ceiling on device capability tier. |
| `replayKey` | `string | number` | `"undefined"` | Optional key to force replaying the entrance animation. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/text-reveal
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

### How to Verify
- Verify full headline text is present in server HTML before JavaScript executes.
- Verify screen reader reads text as a single coherent sentence without letter-by-letter pauses.
- Verify reduced motion produces immediate static text with zero rAF cycles.

## Measured Bench Evidence

- **Bench Commit**: `5c74d38` (2026-10-04)
- **Size**: 2.86 KB initial / 0.02 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-04 | 13 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-04 | 13 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-04 | 13 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-04 | 13 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-04 | 13 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
