# lantern-sky — Specification Sheet

> background: Night sky of paper lanterns rising at different depths; the pointer is a warm breeze (canvas 2D, server-safe, reduced motion -> still sky)

## Overview

- **Item Name**: `lantern-sky`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/lantern-sky`

## Intent

### Use When
- A calm closing section, a sign-up or thank-you screen
- Behind a short headline and one call to action

### Avoid When
- Behind long text (it moves for as long as it is on screen)
- Two animated backgrounds on one page

### Alternatives
- **particle-field**: When a WebGL background fits better (many more points, GPU)

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `still-frame` — One still frame of the sky with its lanterns; nothing moves and no pause button is needed.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: One still frame of the sky (reduced motion, Save-Data, no WebGL2)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Animated at DPR <= 1.5 with 60 % of the lanterns
- **T3 Full (fine pointer with hover on a capable machine)**: Animated at DPR <= 2 with every lantern

### Input Interactions
- **Pointer**: Moving through the sky pushes nearby lanterns aside and lights unlit ones
- **Touch**: None
- **Keyboard**: The Pause / Play button

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 1.4.3, 2.2.2
- **Notes**: The canvas is aria-hidden; your children stay real content above it on a dark ground. The sky moves while it is visible, so a visible Pause / Play button is built in (showPauseButton) and the runtime's pauseAll stops it too.

## Composition

- **Max Per Page**: 1
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: ash-text, flint-button

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `—` | Content shown over the sky. |
| `density` | `number` | `1.1` | Lanterns per 10,000 px² of sky. |
| `showPauseButton` | `boolean` | `true` | A visible Pause / Play button (WCAG 2.2.2). |
| `palette` | `"fire" \| "ice" \| "neon" \| "mono" \| "custom"` | `"fire"` | Colours of the effect (DESIGN.md A8). custom reads --fb-heat-0..4 from the page. |
| `paused` | `boolean` | `false` | Universal pause prop: the effect stops drawing; the control keeps working. |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier. |
| `nonce` | `string` | `—` | CSP nonce for the component's <style> element. |
| `className` | `string` | `""` | Extra classes on the root. |
| `style` | `React.CSSProperties` | `—` | Inline styles on the root, merged after the palette variables. |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root element. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/lantern-sky
```

### Usage
```tsx
import { LanternSky } from "@/components/ui/lantern-sky";

export function Closing() {
  return (
    <LanternSky style={{ minHeight: 420 }}>
      <h2>Let it rise.</h2>
      <a href="/start">Start a project</a>
    </LanternSky>
  );
}
```

### Common Mistakes to Avoid
- Keep the content short and on the left or centre; the sky is the point.
- Do not hide the pause button unless the page has its own pause for all motion.
- One per page: it runs for as long as it is visible.

### How to Verify
- Server HTML shows the content on a dark gradient.
- The Pause button stops the sky (no frames) and Play resumes it.
- With reduced motion one still frame is drawn and nothing runs.

## Measured Bench Evidence

- **Bench Commit**: `801163e` (2026-10-21)
- **Size**: 2.91 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
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
| Firefox Desktop | playwright | 3 | pass | 2026-10-21 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-21 | 14 passed, 0 failed, 1 flaky (passed on retry) |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-21 | 14 passed, 0 failed, 1 flaky (passed on retry) |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
