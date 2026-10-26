# temper-slider — Specification Sheet

> control: Native range input across polished steel; the knob shows the oxide colour that forms at that temperature (canvas 2D, server-safe input)

## Overview

- **Item Name**: `temper-slider`
- **Version**: `0.1.0`
- **Slot**: `control`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/temper-slider`

## Intent

### Use When
- A temperature, intensity or heat setting where the value has a colour meaning
- A brand or product page about heat, metal or making

### Avoid When
- Generic numeric settings with no colour meaning (use the host's slider)
- Ranges outside 180-360 (the oxide scale is physical and fixed)

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0.0001)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `still-frame` — The steel and the knob are drawn once per change, as at every tier; nothing animates.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The same drawing: nothing moves on its own, so every tier draws one frame per change
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Same at DPR <= 2
- **T3 Full (fine pointer with hover on a capable machine)**: Same at DPR <= 2

### Input Interactions
- **Pointer**: Drag along the steel (a real range input sits over the drawing)
- **Touch**: Drag
- **Keyboard**: Native range keys: arrows, PageUp/PageDown, Home, End; the knob outline turns hot when focused

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.3.1, 1.4.3, 2.1.1, 2.4.7, 4.1.2
- **Notes**: A native <input type=range> with an accessible name and aria-valuetext ("250 degrees, Bronze"). Before the canvas mounts the input is visible; after, it sits transparent over the drawing. The oxide name is lightened only as needed to reach 4.5:1.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: light-leak-tabs, flame-switch

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `value` | `number` | `—` | Controlled temperature in °C (clamped to 180-360). |
| `defaultValue` | `number` | `250` | Initial temperature when uncontrolled. |
| `onValueChange` | `(celsius: number) => void` | `—` | Called with the new temperature as the knob moves. |
| `label` | `string` | `"Tempering temperature in degrees Celsius"` | Accessible name of the slider. |
| `step` | `number` | `1` | Step of the range input. |
| `disabled` | `boolean` | `false` | Disables the input. |
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
npx shadcn@4.21.1 add @frictionborn/temper-slider
```

### Usage
```tsx
import { useState } from "react";
import { TemperSlider } from "@/components/ui/temper-slider";

export function Tempering() {
  const [c, setC] = useState(250);
  return <TemperSlider value={c} onValueChange={setC} />;
}
```

### Common Mistakes to Avoid
- The scale is fixed at 180-360 °C: it is a themed control, not a general slider.
- Give it at least 280 px of width so the tick labels fit.
- Use onValueChange (a number), not onChange.

### How to Verify
- Server HTML has a visible native range input with its name.
- Arrow keys change the value and aria-valuetext names the colour.
- One frame is drawn per change; nothing runs while idle.

## Measured Bench Evidence

- **Bench Commit**: `99012b7` (2026-10-20)
- **Size**: 3.31 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0.0001`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-20 | 16 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-20 | 15 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-20 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-20 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-20 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
