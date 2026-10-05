# distortion-image — Specification Sheet

> media: WebGL2 hover-displacement image overlay (webgl, client-only, reduced motion -> static image, mobile -> plain image / 0 contexts)

## Overview

- **Item Name**: `distortion-image`
- **Version**: `0.1.0`
- **Slot**: `media`
- **Kind**: `webgl`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/distortion-image`

## Intent

### Use When
- Portfolio galleries and editorial features requiring tactile pointer distortion
- Product showcases where fine-pointer interaction reveals optical depth
- Media elements benefiting from fluid ripple displacement over real images

### Avoid When
- Long lists of small thumbnails on mobile where static images are optimal
- High-frequency rapid scrolling feeds without user hovering
- Images lacking CORS headers when hosted on cross-origin domains

### Alternatives
- **noise-field**: When a generative ambient canvas background is needed instead of image distortion

## Runtime & Server Boundaries

- **Server Output**: `static-layout` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (stepped by the shared runtime `useFrame` loop)
- **WebGL Contexts**: `4`
- **Reduced Motion**: Mode `static` — Renders the plain static image with no WebGL context and no animation frames.

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: Plain image, no WebGL (server render, prefers-reduced-motion, Save-Data, no WebGL2, or frame-guard downgrade)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Plain image (coarse pointer with low-end hints)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: WebGL2 displacement overlay at DPR <= 1.5, 0.75 render scale, texture <= 1024px, only when the device reports (hover: hover) and (pointer: fine); coarse-pointer devices at this tier get the plain image
- **T3 Full (fine pointer with hover on a capable machine)**: WebGL2 displacement overlay at DPR <= 2.0, full render scale, texture <= 2048px (fine pointer with hover)

### Input Interactions
- **Pointer**: Fine-pointer hover acquires a context lease and ripples around the cursor. The lease is released about 3 s after the pointer leaves or stops moving, and the render loop keeps running during that idle period (up to about 3.4 s). At most 4 contexts are live per page, shared by all instances; when the budget is full the least recently used idle image gives its slot up.
- **Touch**: Touch pointers fall back to the plain static image with zero WebGL allocation
- **Keyboard**: The wrapper is not focusable. For linked images (wrapped in <a> or containing a covering <a>), focus on the link triggers the ripple on fine-pointer devices and draws a two-tone inset focus ring above the canvas, inside the image box so parent overflow:hidden cannot clip it; exactly one tab stop is preserved. Purely decorative images have no keyboard activation. The canvas is aria-hidden

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.1.1, 2.2.2, 2.3.1
- **Notes**: The underlying HTML img element keeps the full accessible name via alt; the WebGL canvas overlay and focus ring are aria-hidden. A linked image gets exactly one tab stop (the link itself). Keyboard activation is supported whether the image is wrapped in an <a> or contains a covering <a> inside its children.

## Composition

- **Max Per Page**: 30
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: sticky-scroll-story, text-reveal, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `src` | `string` | `—` | Required. URL of the underlying image to display and distort. |
| `alt` | `string` | `—` | Required. Accessible alternative text for the image. |
| `width` | `number \| string` | `—` | Optional. No default. Layout width of the wrapper and the img. |
| `height` | `number \| string` | `—` | Optional. No default. Layout height of the wrapper and the img. |
| `strength` | `number` | `0.25` | Displacement ripple magnitude on hover. |
| `speed` | `number` | `1` | Frequency and wave propagation rate during interaction. |
| `maxTier` | `number` | `3` | Hard ceiling on the capability tier (0 to 3). |
| `paused` | `boolean` | `false` | Universal pause prop. Releases the WebGL context and shows the plain image; hover or focus does nothing until un-paused. |
| `crossOrigin` | `"anonymous" \| "use-credentials" \| ""` | `—` | Optional. No default. CORS setting for the image. Only set to 'anonymous' when the host server sends Access-Control-Allow-Origin headers. If set on a host without CORS headers, the browser blocks the image entirely. When omitted, images from non-CORS hosts cleanly fall back to static image display without errors. |
| `fetchPriority` | `"high" \| "low" \| "auto"` | `—` | Optional. No default. Native fetchpriority attribute forwarded to the underlying img element. |
| `fetchpriority` | `"high" \| "low" \| "auto"` | `—` | Optional. No default. Lower-case alias of fetchPriority, used only when fetchPriority is not set. |
| `loading` | `"eager" \| "lazy"` | `"lazy"` | Native browser image loading attribute. |
| `decoding` | `"async" \| "auto" \| "sync"` | `"async"` | Native browser image decoding behavior. |
| `srcSet` | `string` | `—` | Optional. No default. Native srcset. When the browser picks another candidate (resize, DPR change) the new pixels are uploaded to the texture. |
| `sizes` | `string` | `—` | Optional. No default. Native sizes attribute for srcSet. |
| `imgClassName` | `string` | `""` | Class names for the inner img. |
| `imgStyle` | `React.CSSProperties` | `—` | Optional. No default. Inline styles merged onto the inner img. |
| `className` | `string` | `""` | Extra classes on the wrapper div. Other HTML div attributes (data-*, aria-*) are passed to the wrapper, not to the img. |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the wrapper div, merged after width and height (consumer wins). |
| `ref` | `React.Ref<HTMLDivElement>` | `—` | Receives the wrapper <div> around the <img> (not the <img> itself). |
| `onPointerEnter` | `React.PointerEventHandler<HTMLDivElement>` | `—` | Optional. No default. Composed: called first, then the component's own handling. onPointerMove, onPointerLeave, onFocus and onBlur are composed the same way. |
| `children` | `React.ReactNode` | `—` | Optional. No default. Content layered above the image and canvas, for example a caption or a link. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: none
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/distortion-image
```

### Usage
```tsx
import { DistortionImage } from "@/components/ui/distortion-image";

export default function GalleryCard() {
  return (
    <DistortionImage
      src="/art-1.webp"
      alt="Wheat Field with Cypresses by Vincent van Gogh"
      width={600}
      height={400}
      strength={0.25}
    />
  );
}
```

### Common Mistakes to Avoid
- Do not set crossOrigin='anonymous' unless the host server actually sends CORS headers (Access-Control-Allow-Origin); setting it on a non-CORS host causes the browser to block the image entirely. Omit it to let DistortionImage cleanly display the static image without errors.
- Do not set position: absolute on the underlying img without specifying container dimensions; let the image define layout to avoid CLS.
- Do not attempt to animate strength or pointer coordinates manually with requestAnimationFrame; the component handles internal interaction loops.

### How to Verify
- Confirm the real img element is rendered in server HTML before hydration (CLS <= 0.01).
- Confirm that when hovering with a fine pointer, a WebGL context lease is acquired and released after about 3s idle.
- Confirm that coarse touch pointers and reduced-motion render the plain image with 0 WebGL contexts.

## Measured Bench Evidence

- **Bench Commit**: `53fd14c` (2026-10-05)
- **Size**: 4.1 KiB initial / 4.29 KiB deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-05 | 28 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 26 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 26 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 24 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 24 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
- **Demo assets** (not shipped in the registry item):
  - Wheat Field with Cypresses (Vincent van Gogh) - https://www.metmuseum.org/art/collection/search/436535 - CC0 1.0 (The Met Open Access)
  - Irises (Vincent van Gogh) - https://www.metmuseum.org/art/collection/search/436528 - CC0 1.0 (The Met Open Access)
  - Cypresses (Vincent van Gogh) - https://www.metmuseum.org/art/collection/search/437980 - CC0 1.0 (The Met Open Access)
  - Under the Wave off Kanagawa (Katsushika Hokusai) - https://www.metmuseum.org/art/collection/search/45434 - CC0 1.0 (The Met Open Access)
  - Sunflowers (Vincent van Gogh) - https://www.metmuseum.org/art/collection/search/436524 - CC0 1.0 (The Met Open Access)
  - The Shepherd's Song (Pierre Puvis de Chavannes) - https://www.metmuseum.org/art/collection/search/437344 - CC0 1.0 (The Met Open Access)
