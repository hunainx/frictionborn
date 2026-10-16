# eclipse-switch — Specification Sheet

> control: Light/dark theme switch: the moon slides across the sun until only the corona remains (canvas 2D, server-safe switch, reduced motion -> still)

## Overview

- **Item Name**: `eclipse-switch`
- **Version**: `0.1.0`
- **Slot**: `control`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/eclipse-switch`

## Intent

### Use When
- The light/dark theme toggle of a site or app, as a feature in a settings card or a hero
- A day/night or on/off choice with a sky metaphor

### Avoid When
- A compact header toggle (it is a 250 px panel)
- Pages that already show a lot of motion near it

### Alternatives
- **flame-switch**: When the toggle is not about light and dark

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: This item reads `[data-motion="ok"]` on `<html>`. Next.js: render `<MotionReadyScript />` from `@frictionborn/runtime` inside `<head>` of the root layout (pass `nonce` under a strict CSP). Vite / SPA: call `initMotionReady()` from `@frictionborn/runtime` once before `createRoot(...).render(...)`. Without it the item stays in its static, fully visible state (no motion).
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `still-frame` — The sky jumps straight to day or totality: one frame per change, no sliding moon.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: One still frame on the canvas (reduced motion, Save-Data, no WebGL2), redrawn only when the value changes
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Animated at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Animated at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: Click the switch
- **Touch**: Tap the switch
- **Keyboard**: A native <button role=switch>: Space and Enter toggle

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.4.3, 2.1.1, 4.1.2, 4.1.3
- **Notes**: A native <button role="switch"> with aria-checked; its visible label is its name. The status (Day / Totality) is aria-live=polite. Before the canvas mounts a CSS sun shows the state. The sky canvas is aria-hidden.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: flame-switch, light-leak-tabs

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `checked` | `boolean` | `—` | Controlled state: true is the eclipse (dark). |
| `defaultChecked` | `boolean` | `false` | Initial state when uncontrolled. |
| `onCheckedChange` | `(checked: boolean) => void` | `—` | Called with the new state. |
| `label` | `string` | `"Eclipse mode"` | Visible label and accessible name of the switch. |
| `statusText` | `{ on: string; off: string } \| null` | `{ on: "Totality", off: "Day" }` | Visible, announced status; null hides it. |
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
npx shadcn@4.21.1 add @frictionborn/eclipse-switch
```

### Usage
```tsx
import { EclipseSwitch } from "@/components/ui/eclipse-switch";

export function ThemeCard({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  return <EclipseSwitch checked={dark} onCheckedChange={setDark} label="Dark mode" statusText={{ on: "Dark", off: "Light" }} />;
}
```

### Common Mistakes to Avoid
- It switches its own sky only: apply your theme in onCheckedChange.
- Give it a full card (at least 250 px tall); it is not a header icon.
- Keep the label short; it sits on the sky.

### How to Verify
- Server HTML has a switch with aria-checked and a CSS sun.
- Space toggles; the status reads Totality or Day.
- The moon slides in about 4 s, then nothing runs.

## Measured Bench Evidence

- **Bench Commit**: `f845539` (2026-10-16)
- **Size**: 3.19 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-16 | 15 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-16 | 15 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-16 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-16 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-16 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
