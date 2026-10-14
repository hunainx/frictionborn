# light-leak-tabs — Specification Sheet

> navigation: ARIA tabs over a furnace slot: the selected tab lets the firelight through and the light slides as you switch (canvas 2D, server-safe tabs)

## Overview

- **Item Name**: `light-leak-tabs`
- **Version**: `0.1.0`
- **Slot**: `navigation`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/light-leak-tabs`

## Intent

### Use When
- Three to five sections of related content in one card (features, plans, steps)
- A product or brand page where the tabs are a focal element

### Avoid When
- Navigation between pages (use links)
- More than about six tabs, or tabs that must wrap onto two rows

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — The tabs alone with a plain underline on the selected tab; no canvas, no sliding light.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The control alone (server render, reduced motion, Save-Data, no WebGL2): no canvas
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Effect on a canvas at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Effect on a canvas at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: Click a tab to select it; the light slides after it
- **Touch**: Tap a tab
- **Keyboard**: Roving tabindex: ArrowLeft/ArrowRight (wrapping), Home and End move and select; Tab moves into the panel

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.3.1, 2.1.1, 2.4.3, 2.4.7, 4.1.2
- **Notes**: WAI-ARIA tabs: a named tablist of native buttons with role=tab, aria-selected and aria-controls, one tabpanel labelled by the selected tab and focusable. The light canvas is aria-hidden.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: flame-switch, temper-slider

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `tabs` | `{ id: string; label: React.ReactNode; content: React.ReactNode }[]` | `—` | Required. The tabs, in order. |
| `label` | `string` | `—` | Required. Accessible name of the tab list. |
| `value` | `string` | `—` | Controlled selected tab id. |
| `defaultValue` | `string` | `—` | Initial tab id when uncontrolled (the first tab if omitted). |
| `onValueChange` | `(id: string) => void` | `—` | Called with the newly selected tab id. |
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
npx shadcn@4.21.1 add @frictionborn/light-leak-tabs
```

### Usage
```tsx
import { LightLeakTabs } from "@/components/ui/light-leak-tabs";

const tabs = [
  { id: "heat", label: "Heat", content: <p>How hot it runs.</p> },
  { id: "light", label: "Light", content: <p>What it shows.</p> },
];

export function Features() {
  return <LightLeakTabs label="Features" tabs={tabs} />;
}
```

### Common Mistakes to Avoid
- Keep tabs to a handful of short labels: they share one row.
- Give every tab a stable, unique id; the selection is tracked by id.
- label is required: it names the tab list for screen readers.

### How to Verify
- Server HTML has a tablist with one selected tab and its panel.
- ArrowRight, ArrowLeft, Home and End move the selection and focus.
- The light slides to the new tab and then the loop stops.

## Measured Bench Evidence

- **Bench Commit**: `1c40cb9` (2026-10-14)
- **Size**: 2.59 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-14 | 15 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-14 | 15 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-14 | 14 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-14 | 15 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-14 | 15 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
