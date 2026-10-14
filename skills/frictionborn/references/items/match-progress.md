# match-progress — Specification Sheet

> feedback: Progress bar drawn as a row of matches, each catching from the last as the job advances (canvas 2D, server-safe bar, reduced motion -> still)

## Overview

- **Item Name**: `match-progress`
- **Version**: `0.1.0`
- **Slot**: `feedback`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/match-progress`

## Intent

### Use When
- A job with real progress the visitor waits for (an upload, a build, an import)
- A hero or onboarding step where progress is the moment

### Avoid When
- Indeterminate waits with no real percentage
- Many progress bars in a table

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `still-frame` — The reached matches stand lit with a steady glow; no flame, no sparks, no burning down. One frame per change.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: One still frame on the canvas (reduced motion, Save-Data, no WebGL2), redrawn only when the value changes
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Animated at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Animated at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: None (it shows progress)
- **Touch**: None
- **Keyboard**: None (not focusable)

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 1.1.1, 1.3.1, 4.1.2
- **Notes**: role=progressbar with aria-valuenow/min/max and a required accessible name; the visible percentage is its text. The canvas is aria-hidden; before it mounts a plain bar shows the same value. Each burn lasts 7 s and stops.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: fuse-toast, flame-switch

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `value` | `number` | `—` | Required. Progress 0-100; each match catches as the value passes its share. |
| `label` | `string` | `—` | Required. Accessible name of the progress bar. |
| `matches` | `number` | `12` | Number of matches in the row. |
| `showValue` | `boolean` | `true` | Show the percentage under the row. |
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
npx shadcn@4.21.1 add @frictionborn/match-progress
```

### Usage
```tsx
import { MatchProgress } from "@/components/ui/match-progress";

export function Upload({ percent }: { percent: number }) {
  return <MatchProgress value={percent} label="Uploading your files" />;
}
```

### Common Mistakes to Avoid
- Pass real progress (0-100). For an unknown wait, use the host's spinner instead.
- label is required: it names the progress bar.
- Leave about 150 px of height for the standing matches.

### How to Verify
- Server HTML has a progressbar with aria-valuenow and a plain bar.
- Raising value lights matches in order with a burst.
- Burning stops within 7 s and the loop goes quiet.

## Measured Bench Evidence

- **Bench Commit**: `605ef63` (2026-10-13)
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
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-13 | 15 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-13 | 15 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-13 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-13 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-13 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
