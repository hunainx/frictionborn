# hold-to-confirm — Specification Sheet

> control: Press-and-hold button for destructive actions: it fills, then crumbles to ash left to right; Undo rebuilds it (canvas 2D, native button)

## Overview

- **Item Name**: `hold-to-confirm`
- **Version**: `0.1.0`
- **Slot**: `control`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/hold-to-confirm`

## Intent

### Use When
- A destructive or costly action that deserves a deliberate press (delete, discard, revoke)
- Replacing a confirmation dialog with something faster and harder to trigger by accident

### Avoid When
- Everyday actions (a hold slows people down)
- Actions that cannot be undone, unless you pass undoLabel={null} and say so in the label

### Alternatives
- **fuse-toast**: When the action should happen at once and offer undo afterwards

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — The hold works the same with a filling bar; the button simply disappears when confirmed (no crumble, no canvas).

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The control alone (server render, reduced motion, Save-Data, no WebGL2): no canvas
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Effect on a canvas at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Effect on a canvas at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: Press and hold for holdMs; releasing early cancels
- **Touch**: Press and hold (touch-action: none on the button)
- **Keyboard**: Hold Enter or Space; releasing early cancels; focus moves to Undo once confirmed and back after undo

## Accessibility (a11y)

- **Role**: `interactive`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 2.1.1, 2.4.3, 2.5.2, 4.1.3
- **Notes**: A native <button>; the label should say it needs a hold. Confirmation is announced in a role=status region, which also holds the Undo button (focus moves there). Releasing before holdMs cancels (WCAG 2.5.2). The ash canvas is aria-hidden.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: fuse-toast, flint-button

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `React.ReactNode` | `—` | Required. The label, which should say that it needs a hold. |
| `holdMs` | `number` | `1000` | How long the press must be held, in ms. |
| `onConfirm` | `() => void` | `—` | The hold completed: do the action. |
| `confirmedText` | `React.ReactNode` | `"Done."` | Shown and announced once confirmed. |
| `undoLabel` | `string \| null` | `"Undo"` | Label of the undo button; null for no undo. |
| `onUndo` | `() => void` | `—` | Undo was pressed. |
| `disabled` | `boolean` | `false` | Disables the button. |
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
npx shadcn@4.21.1 add @frictionborn/hold-to-confirm
```

### Usage
```tsx
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";

export function DeleteDraft({ onDelete, onRestore }: { onDelete: () => void; onRestore: () => void }) {
  return (
    <HoldToConfirm onConfirm={onDelete} onUndo={onRestore} confirmedText="Draft deleted.">
      Hold to delete draft
    </HoldToConfirm>
  );
}
```

### Common Mistakes to Avoid
- Say "Hold to …" in the label: nothing else tells people a click is not enough.
- If the action cannot be undone, pass undoLabel={null} rather than an Undo that does nothing.
- The ash falls below and beside the button: do not clip the parent with overflow: hidden.

### How to Verify
- Server HTML has a native <button> with the label and an empty status region.
- Holding Enter for holdMs confirms; releasing early does not.
- Undo restores the button and moves focus back to it.

## Measured Bench Evidence

- **Bench Commit**: `f845539` (2026-10-16)
- **Size**: 3.35 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
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
