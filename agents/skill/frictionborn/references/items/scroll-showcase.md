# scroll-showcase — Specification Sheet

> Scroll composition: StickyScrollStory + ScrollReveal + optional Marquee (DOM, ~6 KB gz, reduced motion -> static/opacity, mobile -> stacked)

## Overview

- **Item Name**: `scroll-showcase`
- **Version**: `0.1.0`
- **Slot**: `composition`
- **Kind**: `composition`
- **Install**: `npx shadcn@latest add @frictionborn/scroll-showcase`

## Intent

### Use When
- Product feature narrative requiring sticky step progression and reveal on scroll
- Architecture or engineering deep-dive with synchronized technical media and metrics
- Multi-section storytelling with accessible scroll-driven reveals

### Avoid When
- Short single-screen pages without scroll depth
- Mobile web apps requiring dense vertical list views
- Documentation sites where uninterrupted linear reading is essential

### Alternatives
- **sticky-scroll-story**: When you only need the sticky step column without accompanying feature grids or marquee
- **scroll-reveal**: When you only need basic reveal-on-scroll animations for individual cards

## Runtime & Server Boundaries

- **Server Output**: `static-layout` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19.0.0`, Frameworks: next-app-router, next-pages, vite-react

## Behavior & Tiers

- **Animation Loop**: `none` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `opacity-only` — StickyScrollStory transitions with quick opacity swap <= 150ms; ScrollReveal elements are immediately visible; Marquee is rendered as a manually scrollable row with autoscroll disabled

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static stacked layout, all cards and text fully visible, static marquee row
- **Tier 1** (Mid-range mobile): Static stacked layout, touch-safe scroll, marquee autoscroll off
- **Tier 2** (Standard desktop / modern mobile): Sticky scroll progression, CSS scroll reveal, smooth marquee ticker
- **Tier 3** (High performance GPU): Full sticky scroll progression, CSS view-timeline reveals, interactive marquee

### Input Interactions
- **Pointer**: Fine pointer hover pauses marquee and enables interactive media exploration
- **Touch**: Coarse pointer falls back to stacked layout on mobile without sticky jumps
- **Keyboard**: Fully keyboard navigable: Tab lands in reading order through all steps, cards, and marquee items

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 1.4.3, 2.1.1, 2.2.2, 2.4.1, 2.4.6
- **Notes**: Semantic landmark sections with aria-labelledby and aria-label. DOM reading order matches visual order. Heading hierarchy (h2 -> h3 -> h4) maintained. Alt text provided on all media items.

## Composition

- **Max Per Page**: 2
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: ambient-hero

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `steps` | `StickyScrollStep[]` | `null` | Array of story steps with id, title, description, and media. |
| `showMarquee` | `boolean` | `true` | Includes the partner and studio reference marquee ticker. |
| `smoothScroll` | `boolean` | `false` | Wraps the composition in SmoothScroll provider (disabled by default). |
| `className` | `string` | `null` | Additional CSS class names on root container. |
| `style` | `React.CSSProperties` | `null` | Inline styles applied to root container. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/scroll-showcase
```

### Usage
```tsx
import { ScrollShowcase } from '@/components/ui/scroll-showcase';

<ScrollShowcase showMarquee={true} />
```

### Common Mistakes to Avoid
- Do not enable smoothScroll on dashboards or documentation pages.
- Do not place multiple sticky scroll sections immediately adjacent to each other without spacing.

### How to Verify
- Verify that the step sequence is fully accessible in DOM reading order.
- Verify that mobile viewports switch to stacked mode without sticky jumping.
- Verify that reduced-motion preferences disable autoscroll on marquee and reveals remain static.

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
