# ash-text — Specification Sheet

> headline: One line of real text drawn as grains of ash; a click or its button blows it away with glowing edges and it gathers back (canvas 2D, server-safe text)

## Overview

- **Item Name**: `ash-text`
- **Version**: `0.1.0`
- **Slot**: `headline`
- **Kind**: `canvas`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/ash-text`

## Intent

### Use When
- One short word or line that deserves a moment (a hero word, a 404, a closing line)
- Brand pages about fire, time or impermanence

### Avoid When
- Body copy, long or wrapping text (it is one line)
- Text that must stay crisp at all times (labels, navigation)

### Alternatives
- **text-reveal**: When the text should arrive once, word by word

## Runtime & Server Boundaries

- **Server Output**: `final-state` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — The real text, as it is in the server HTML: no grains, no canvas, no button.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: The control alone (server render, reduced motion, Save-Data, no WebGL2): no canvas
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Same as tier 2
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: Effect on a canvas at DPR <= 1.5 with half the particles
- **T3 Full (fine pointer with hover on a capable machine)**: Effect on a canvas at DPR <= 2 with the full particle count

### Input Interactions
- **Pointer**: Click the word to blow it away from that point; hovering nudges the grains
- **Touch**: Tap the word
- **Keyboard**: A native button under the word ("Blow … away") does the same

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.3.1, 1.4.3, 2.1.1, 2.2.2
- **Notes**: The text stays in the DOM as a real heading or paragraph (`as`), transparent only while the grains are drawn in its own colour. The effect is one gust of about 4 s, started by the visitor. The canvas is aria-hidden.

## Composition

- **Max Per Page**: 6
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: flint-button, lantern-sky

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `children` | `string` | `—` | Required. The text, one line. |
| `as` | `"h1" \| "h2" \| "h3" \| "p" \| "span"` | `"h2"` | The element the text is rendered as. |
| `interactive` | `boolean` | `true` | Offer the click and the button; false keeps it as a still texture. |
| `actionLabel` | `string` | `—` | Name of the button (default: Blow "<text>" away). |
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
npx shadcn@4.21.1 add @frictionborn/ash-text
```

### Usage
```tsx
import { AshText } from "@/components/ui/ash-text";

export function Closing() {
  return (
    <AshText as="h2" style={{ fontSize: 96, fontWeight: 900 }}>
      Ephemeral
    </AshText>
  );
}
```

### Common Mistakes to Avoid
- Pass plain text (a string), one line: it is drawn grain by grain.
- Set the font on AshText itself (style or className); the text element inherits it.
- The grains fly up to 200 px around the word: do not clip the parent with overflow: hidden.

### How to Verify
- Server HTML has the text as a real heading.
- The button blows the word away and it gathers back within about 4 s.
- Once gathered, nothing runs.

## Measured Bench Evidence

- **Bench Commit**: `538b855` (2026-10-20)
- **Size**: 3.7 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
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
