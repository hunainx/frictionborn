# distortion-image — Specification Sheet

> media: WebGL2 hover-displacement image overlay (webgl, client-only, ~3.8 KB, reduced motion -> static image, mobile -> plain image / 0 contexts)

## Overview

- **Item Name**: `distortion-image`
- **Version**: `0.1.0`
- **Slot**: `media`
- **Kind**: `webgl`
- **Install**: `npx shadcn@latest add @frictionborn/distortion-image`

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

- **Server Output**: `static-layout` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `true`
- **Lazy Loaded**: `in-view`
- **Client Reveal Gate**: Requires `[data-motion="ok"]` attribute set by `<MotionReadyScript />` (Next.js) or `initMotionReady()` (plain Vite / SPA) to activate reveals. Without it, content renders in full static visibility.
- **Requirements**: React `>=19`, Frameworks: next-app-router, next-pages, vite-react, react-router

## Behavior & Tiers

- **Animation Loop**: `on-interaction` (managed via runtime `useFrame`)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders plain static image with 0 WebGL contexts allocated and zero rAF loops.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Plain static image with 0 WebGL contexts and zero animation overhead
- **Tier 1** (Mid-range mobile): Plain static image for coarse touch pointers with zero context allocation
- **Tier 2** (Standard desktop / modern mobile): WebGL2 displacement overlay at DPR <= 1.5 and texture cap <= 1024px
- **Tier 3** (High performance GPU): Full WebGL2 displacement overlay at DPR <= 2.0 and texture cap <= 2048px

### Input Interactions
- **Pointer**: Fine pointer hover acquires a lease and ripples around the cursor; released 3 s after the pointer leaves or stops moving. If all 4 contexts are busy, the least recently used idle image gives its slot up
- **Touch**: Touch pointers fall back to plain static image with zero WebGL allocation
- **Keyboard**: The wrapper is a tab stop (tabindex 0). Focus draws a two-tone inset focus ring above the canvas (never clipped by overflow:hidden parents) and starts the effect; released 3 s after blur or the last interaction. The canvas is aria-hidden

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `via-runtime`
- **WCAG Criteria**: 1.1.1, 2.2.2, 2.3.1
- **Notes**: The underlying HTML img element keeps the full accessible name via alt; the WebGL canvas overlay and focus ring are aria-hidden. A linked image gets two tab stops (the link, then the wrapper): put the link inside the component's children instead of around it.

## Composition

- **Max Per Page**: 30
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: sticky-scroll-story, text-reveal, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `src` | `string` | `"undefined"` | URL of the underlying image to display and distort. |
| `alt` | `string` | `"undefined"` | Accessible alternative text for the image. |
| `width` | `number | string` | `"undefined"` | Optional layout width defining container and image dimensions. |
| `height` | `number | string` | `"undefined"` | Optional layout height defining container and image dimensions. |
| `strength` | `number` | `0.25` | Displacement ripple magnitude on hover. |
| `speed` | `number` | `1` | Frequency and wave propagation rate during interaction. |
| `maxTier` | `number` | `3` | Hard ceiling on device capability tier (0 to 3). |
| `crossOrigin` | `"anonymous" | "use-credentials" | ""` | `"undefined"` | CORS mode for cross-origin image texture loading. |
| `loading` | `"eager" | "lazy"` | `"\"lazy\""` | Native browser image loading attribute. |
| `decoding` | `"async" | "auto" | "sync"` | `"\"async\""` | Native browser image decoding behavior. |
| `srcSet` | `string` | `"undefined"` | Native srcset. When the browser picks another candidate (resize, DPR change) the new pixels are uploaded to the texture. |
| `sizes` | `string` | `"undefined"` | Native sizes attribute for srcSet. |
| `imgClassName` | `string` | `"\"\""` | Class names for the inner img. |
| `imgStyle` | `React.CSSProperties` | `"undefined"` | Inline styles merged onto the inner img. |
| `children` | `React.ReactNode` | `"undefined"` | Content layered above the image and canvas, for example a caption or a link. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/distortion-image
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
- Do not omit crossOrigin='anonymous' when loading images from a different origin, or WebGL will fall back to static image due to browser canvas tainting.
- Do not set position: absolute on the underlying img without specifying container dimensions; let the image define layout to avoid CLS.
- Do not attempt to animate strength or pointer coordinates manually with requestAnimationFrame; the component handles internal interaction loops.

### How to Verify
- Confirm real img element is rendered in server HTML before hydration with zero CLS.
- Confirm that when hovering with a fine pointer, a WebGL context lease is acquired and released after 3s idle.
- Confirm that coarse touch pointers and reduced-motion render plain image with 0 WebGL contexts.

## Measured Bench Evidence

- **Bench Commit**: `d38ddb4` (2026-10-04)
- **Size**: 3.77 KB initial / 4.25 KB deferred (gzip, via gzip-9)
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-04 | 29 passed, 0 failed; all specs verified |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-04 | 28 passed, 0 failed; all specs verified |
| Firefox Desktop | playwright | 3 | pass | 2026-10-04 | 28 passed, 0 failed; all specs verified |
| WebKit Desktop | playwright | 3 | pass | 2026-10-04 | 28 passed, 0 failed; all specs verified |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-04 | 28 passed, 0 failed; all specs verified |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
