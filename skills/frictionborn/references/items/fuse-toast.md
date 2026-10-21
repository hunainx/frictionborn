# fuse-toast — Specification Sheet

> feedback: Undo toast whose time runs out as a fuse burning along its edge; it pauses while hovered or focused (canvas 2D, server-safe toast)

## Overview

- **Item Name**: `fuse-toast`
- **Version**: `0.1.0`
- **Slot**: `feedback`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/fuse-toast`

## Intent

### Use When
- Undo after a reversible action (archive, delete to trash, move)
- A single, important confirmation that commits after a few seconds

### Avoid When
- Errors or messages that must not disappear on their own
- Several toasts stacked at once (one fuse at a time reads best)

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — The toast works and times out the same; the fuse is a plain line with no flame, sparks or canvas.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The control alone (server render, reduced motion, Save-Data, no WebGL2): no canvas
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Effect on a canvas at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Effect on a canvas at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: The action button; the fuse stops while the pointer is over the toast
- **Touch**: The action button
- **Keyboard**: The action is a native button; the fuse stops while focus is inside the toast

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.2.1, 2.1.1, 4.1.3
- **Notes**: The toast sits in a role=status live region, so its message is announced. The time limit stops while the pointer is over it or focus is inside it (WCAG 2.2.1), and `duration` sets its length. The fuse canvas is aria-hidden.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: match-progress, hold-to-confirm

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `open` | `boolean` | `—` | Required. Shows the toast; a fresh fuse starts each time it opens. |
| `message` | `React.ReactNode` | `—` | Required. What happened. |
| `actionLabel` | `string` | `"Undo"` | The action offered while the fuse burns. |
| `onAction` | `() => void` | `—` | The action was pressed before the fuse burnt out. |
| `onExpire` | `() => void` | `—` | The fuse burnt out: commit the action. |
| `expiredMessage` | `React.ReactNode` | `—` | Shown for 1.2 s after the fuse burns out. |
| `onClose` | `() => void` | `—` | The toast should close (after the action, or after the expired message). |
| `duration` | `number` | `5000` | Fuse length in ms (paused while hovered or focused). |
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
npx shadcn@4.21.1 add @frictionborn/fuse-toast
```

### Usage
```tsx
import { useState } from "react";
import { FuseToast } from "@/components/ui/fuse-toast";

export function ArchiveRow({ onArchive, onRestore }: { onArchive: () => void; onRestore: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Archive</button>
      <FuseToast open={open} message="Message archived." onAction={onRestore} onExpire={onArchive} onClose={() => setOpen(false)} />
    </>
  );
}
```

### Common Mistakes to Avoid
- Commit the action in onExpire, not when the toast opens: Undo must really undo.
- Close it from onClose (set open to false); the toast does not unmount itself.
- Do not use it for errors: it disappears on its own.

### How to Verify
- Opening it announces the message (role=status).
- The action button calls onAction and onClose, and onExpire never fires.
- Hovering or focusing the toast stops the fuse.

## Measured Bench Evidence

- **Bench Commit**: `801163e` (2026-10-21)
- **Size**: 3.1 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
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
