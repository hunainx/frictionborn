# ambient-hero — Specification Sheet

> Hero composition: ambient canvas (mesh/noise/particles) + TextReveal + MagneticButton (DOM+WebGL, ~8 KB, reduced motion -> static, mobile -> T2)

## Overview

- **Item Name**: `ambient-hero`
- **Version**: `0.1.0`
- **Slot**: `composition`
- **Kind**: `composition`
- **Install**: `npx shadcn@latest add @frictionborn/ambient-hero`

## Intent

### Use When
- Primary landing page hero section requiring an ambient signature moment with high contrast
- Marketing page header with animated headline text reveal and magnetic action buttons
- Showcasing a flagship product release with accessible ambient background motion

### Avoid When
- Secondary pages or documentation headers where ambient motion distracts from content
- Dense data dashboards or form-heavy internal tools
- Pages already containing another full-viewport WebGL context above the fold

### Alternatives
- **noise-field**: When you only need a standalone background canvas without integrated typography or CTAs
- **text-reveal**: When you only need headline text reveal animation without ambient background or CTAs

## Runtime & Server Boundaries

- **Server Output**: `poster` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19.0.0`, Frameworks: next-app-router, next-pages, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (managed via runtime `useFrame`)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders static CSS gradient poster background with 0 WebGL canvases and 0 animation frames; headline renders immediately without splitting or keyframes; buttons remain static

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static gradient poster background, plain un-split headline, static buttons
- **Tier 1** (Mid-range mobile): Static gradient poster background, plain un-split headline, touch-safe static buttons
- **Tier 2** (Standard desktop / modern mobile): WebGL ambient background at DPR <= 1.5, word-level text reveal, touch-safe static buttons
- **Tier 3** (High performance GPU): Full WebGL ambient background at DPR <= 2, word-level text reveal, fine pointer magnetic pull

### Input Interactions
- **Pointer**: Fine pointer activates magnetic CTA attraction and interactive pause control
- **Touch**: Touch devices disable magnetic spring pull; CTA buttons and pause control respond to direct tap
- **Keyboard**: Fully keyboard navigable: Tab lands on pause control and CTAs with prominent focus rings; Enter/Space activates

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 1.4.3, 2.1.1, 2.2.2, 2.3.1
- **Notes**: Single semantic h1 heading for the document. Text overlay preserves >= 4.5:1 contrast against ambient canvas via multi-stop scrim. WCAG 2.2.2 pause button controls ambient motion. All text stays in the accessibility tree.

## Composition

- **Max Per Page**: 1
- **Singleton**: true
- **Conflicts With**: noise-field, mesh-gradient, particle-field
- **Pairs Well With**: scroll-showcase, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `variant` | `"mesh" | "noise" | "particles"` | `"mesh"` | Selects which ambient background generator to mount (at most 1 WebGL context). |
| `eyebrow` | `string` | `"Studio Series · Gen 3"` | Small pill tag displayed above the headline. |
| `title` | `string` | `"Acoustic precision, sculpted in aluminum."` | Primary document h1 heading revealed word by word. |
| `description` | `string` | `"Near-field studio monitors engineered for uncoloured listening environments."` | Supporting description copy below the headline. |
| `primaryCta` | `AmbientHeroCta` | `"{ label: \"Explore engineering\", href: \"#engineering\" }"` | Primary action button with magnetic pull. |
| `secondaryCta` | `AmbientHeroCta` | `"{ label: \"Technical specifications\", href: \"#specifications\" }"` | Secondary action button with magnetic pull. |
| `showPauseButton` | `boolean` | `true` | Renders an accessible pause/resume button for ambient background motion. |
| `className` | `string` | `null` | Additional CSS class names on root header. |
| `style` | `React.CSSProperties` | `null` | Inline styles applied to root header. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/ambient-hero
```

### Usage
```tsx
import { AmbientHero } from '@/components/ui/ambient-hero';

<AmbientHero variant="mesh" title="Acoustic precision, sculpted in aluminum." />
```

### Common Mistakes to Avoid
- Do not place a second WebGL item above the fold alongside AmbientHero (violates single signature moment rule).
- Do not remove the scrim layer; it guarantees >= 4.5:1 text contrast across light and dark modes.

### How to Verify
- Verify that exactly one <h1> element exists in the rendered DOM.
- Verify that the pause button toggles motion and has valid aria-label.
- Verify that reduced-motion preferences render a static poster with 0 canvases.

## Measured Bench Evidence

- **Bench Commit**: `d8d51e2` (2026-10-04)
- **Size**: 2.77 KB initial / 0.02 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-04 | 17 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-04 | 17 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-04 | 17 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-04 | 17 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-04 | 17 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
