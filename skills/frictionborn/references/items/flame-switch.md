# flame-switch — Specification Sheet

> control: On/off switch with a live pilot flame on its knob (canvas 2D, server-safe switch, reduced motion -> switch only, touch -> same switch)

## Overview

- **Item Name**: `flame-switch`
- **Version**: `0.1.0`
- **Slot**: `control`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/flame-switch`

## Intent

### Use When
- A setting that turns something on or off and deserves a moment of character (a feature flag, a 'live' mode, a heater, a stream)
- Brand or product pages built around fire, heat or energy
- A single prominent toggle in a hero, a settings card or a demo

### Avoid When
- Long settings lists with many toggles in a row (use the host's plain switch)
- Dense tables or toolbars
- Light pages where a dark switch body would look out of place

### Alternatives
- **eclipse-switch**: When the toggle switches between light and dark themes

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — The switch alone: no canvas, no flame, the knob moves without a transition. The state and the status text work as usual.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The switch only (server render, reduced motion, Save-Data, no WebGL2): no canvas
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Flame on a canvas at DPR ≤ 1.5 with half the flame particles
- **T3 Full (fine pointer with hover on a capable machine)**: Flame on a canvas at DPR ≤ 2 with the full particle count

### Input Interactions
- **Pointer**: Click toggles; moving the pointer past a lit flame leans it like a breath
- **Touch**: Tap toggles; no hover effect
- **Keyboard**: A native button with role=switch: Space and Enter toggle, focus ring visible

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.4.11, 2.1.1, 2.4.7, 4.1.2
- **Notes**: A native <button role="switch"> with aria-checked and the required `label` as its accessible name. The flame canvas is aria-hidden; the visible status text under the switch follows the state.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: eclipse-switch, ember-badge

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `label` | `string` | `—` | Required. The switch's accessible name. |
| `checked` | `boolean` | `—` | Controlled state. Leave undefined for an uncontrolled switch. |
| `defaultChecked` | `boolean` | `false` | Initial state when uncontrolled. |
| `onCheckedChange` | `(checked: boolean) => void` | `—` | Called with the new state on every press. |
| `statusText` | `{ on: string; off: string } \| null` | `{ on: "Pilot on", off: "Pilot off" }` | Visible status under the switch; null hides it. |
| `disabled` | `boolean` | `false` | Disables the switch. |
| `palette` | `"fire" \| "ice" \| "neon" \| "mono" \| "custom"` | `"fire"` | Flame colours (DESIGN.md A8). custom reads --fb-heat-0..4 from the page. |
| `paused` | `boolean` | `false` | Universal pause prop: the flame stops drawing; the switch still works. |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier (0 = switch only). |
| `nonce` | `string` | `—` | CSP nonce for the component's <style> element. |
| `className` | `string` | `""` | Extra classes on the root (fb-flame-switch is kept). |
| `style` | `React.CSSProperties` | `—` | Inline styles on the root, merged after the palette variables. |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the root <div>. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/flame-switch
```

### Usage
```tsx
import { useState } from "react";
import { FlameSwitch } from "@/components/ui/flame-switch";

export function LiveMode() {
  const [live, setLive] = useState(false);
  return <FlameSwitch label="Live mode" checked={live} onCheckedChange={setLive} statusText={{ on: "Live", off: "Off" }} />;
}
```

### Common Mistakes to Avoid
- label is required: it is the switch's only accessible name. Do not rely on nearby text.
- The flame draws above the switch (about 140 px): leave room above it and do not clip the parent with overflow: hidden.
- Use it for one or two important toggles, not for every row of a settings list.

### How to Verify
- Server HTML has a <button role="switch"> with aria-checked and the label.
- Space toggles the switch when it has focus and the status text follows.
- With reduced motion there is no canvas and no frame runs; the switch still toggles.

## Measured Bench Evidence

- **Bench Commit**: `801163e` (2026-10-21)
- **Size**: 2.98 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
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
| WebKit Desktop | playwright | 3 | pass | 2026-10-21 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-21 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
