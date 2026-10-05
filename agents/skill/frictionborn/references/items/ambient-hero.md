# ambient-hero — Specification Sheet

> Hero composition: ambient canvas (mesh/noise/particles) + TextReveal + MagneticButton (DOM+WebGL, reduced motion -> static, mobile -> T2)

## Overview

- **Item Name**: `ambient-hero`
- **Version**: `0.1.0`
- **Slot**: `composition`
- **Kind**: `composition`
- **Install**: `npx shadcn@4.21.1 add @frictionborn/ambient-hero`

## Intent

### Use When
- Primary landing page hero section requiring an ambient signature moment
- Marketing page header with animated headline text reveal and magnetic action buttons
- Showcasing a flagship product release with accessible ambient background motion

### Avoid When
- Secondary pages or documentation headers where ambient motion distracts from content
- Dense data dashboards or form-heavy internal tools
- Pages already containing another full-viewport WebGL context above the fold

### Alternatives
- **noise-field**: When you only need a standalone background canvas without integrated typography or CTAs
- **text-reveal**: When you only need headline text reveal animation without ambient background or CTAs

## Runtime & Server Boundaries

- **Server Output**: `poster` (accessible fallback in static HTML; measured CLS 0)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Client Reveal Gate**: None. This item does not read `data-motion`.
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `while-visible` (no JavaScript frame loop of its own: CSS, IntersectionObserver, or its parts)
- **WebGL Contexts**: `1`
- **Reduced Motion**: Mode `static` — Renders the static CSS gradient poster background with 0 WebGL canvases and 0 animation frames; headline renders as plain text without splitting or keyframes; buttons remain static

### Device Tiers
- **T0 Static (reduced motion, Save-Data, no WebGL2, server render, or the frame guard gave up)**: CSS gradient poster background (no WebGL), headline as plain static text, CTAs without magnetic pull (server render, prefers-reduced-motion, Save-Data, no WebGL2)
- **T1 Lite (coarse pointer on a low-end device: 4 cores or fewer, or 2 GB or less)**: Poster background; no magnetic pull; the headline animates by word with a 40 ms stagger only if the component mounts on the client (coarse pointer with low-end hints)
- **T2 Standard (coarse pointer on a capable phone, or a narrow or low-end fine-pointer screen)**: WebGL background at DPR <= 1.5; magnetic pull only with a fine pointer; headline animates by word (60 ms stagger) only if the component mounts on the client
- **T3 Full (fine pointer with hover on a capable machine)**: WebGL background at DPR <= 2; fine-pointer magnetic pull; headline animates by word only if the component mounts on the client

### Input Interactions
- **Pointer**: Fine pointer activates magnetic CTA attraction; the pause button stops only the hero's own background (its variant's `paused` prop)
- **Touch**: Touch devices (coarse pointer) get no magnetic pull; CTA links and the pause button respond to direct tap
- **Keyboard**: Tab reaches the pause button (when shown), then the CTA links, with default browser focus rings; Enter activates links, Enter or Space activates the pause button

## Accessibility (a11y)

- **Role**: `content`
- **Hidden from Assistive Tech**: `false`
- **Text Stays in DOM**: `true`
- **Pause Control**: `built-in`
- **WCAG Criteria**: 2.1.1, 2.2.2, 2.3.1
- **Notes**: Single h1 heading (rendered by TextReveal). A scrim built from the host --background token sits between the canvas and the text, so it follows the light or dark theme; it is a contrast aid, not a guarantee, and contrast over the live canvas is not computed at runtime: verify it for your content in both themes. Measured on real pixels over the live canvas in a fresh Next 16 app with shadcn's default tokens (3 variants x light/dark x 1440/390 px, sample copy): every text element at least 10:1. The scrim is strong, so a bolder background needs mesh-gradient (or another background item) directly instead of this composition. Every colour is a host token (--background, --foreground, --primary, --primary-foreground, --muted-foreground, --secondary, --border) with a system-colour fallback. The pause button stops only the hero background; it does not touch the page's other motion or SmoothScroll's scrolling (a global runtime pauseAll() set elsewhere is lifted by Resume). All text stays in the accessibility tree.

## Composition

- **Max Per Page**: 1
- **Singleton**: true
- **Conflicts With**: noise-field, mesh-gradient, particle-field
- **Pairs Well With**: scroll-showcase, scroll-reveal

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `headline` | `string` | `—` | Required. Primary document h1 heading rendered by TextReveal by word. |
| `body` | `string` | `—` | Required. Supporting description copy below the headline. |
| `primaryCta` | `AmbientHeroCta = { label: string; href?: string; onClick?: () => void }` | `—` | Required. Primary action link with magnetic pull. Rendered as an <a>; href falls back to '#'. |
| `variant` | `"mesh" \| "noise" \| "particles"` | `"mesh"` | Selects which ambient background to mount (exactly one WebGL context). Its settings are fixed: mesh speed 0.3, noise speed 0.4 scale 1.8, particles count 2500 speed 0.4. |
| `background` | `React.ReactNode` | `—` | Optional. Custom background slot overriding the ambient generator variant. |
| `eyebrow` | `string` | `—` | Optional. Small pill tag displayed above the headline. |
| `secondaryCta` | `AmbientHeroCta = { label: string; href?: string; onClick?: () => void }` | `—` | Optional. Secondary action link with magnetic pull. Rendered as an <a>; href falls back to '#'. |
| `showPauseButton` | `boolean` | `true` | Renders a pause/resume button that stops and restarts the hero background only. |
| `paused` | `boolean` | `false` | Universal pause prop. Freezes the ambient background variant only (not a custom background slot, the headline or the buttons). |
| `nonce` | `string` | `—` | Optional CSP nonce forwarded to the <style> element of the headline reveal. |
| `className` | `string` | `—` | Optional. No default. Additional CSS class names on the root header element. Any other HTML attribute (id, data-*, aria-*, event handlers) is spread on the root element; handlers the item uses itself are composed, not replaced. |
| `style` | `React.CSSProperties` | `—` | Optional. No default. Inline styles on the root header element, merged last (consumer wins). |
| `ref` | `React.Ref<HTMLElement>` | `—` | Receives the root <header> element. |

## Dependencies

- **Runtime package**: `@frictionborn/runtime` (installed by the registry item)
- **Registry items pulled in**: `@frictionborn/noise-field`, `@frictionborn/mesh-gradient`, `@frictionborn/particle-field`, `@frictionborn/text-reveal`, `@frictionborn/magnetic-button`
- **npm packages**: none

## Agent Instructions

### Installation
```bash
npx shadcn@4.21.1 add @frictionborn/ambient-hero
```

### Usage
```tsx
// Installing ambient-hero also installs noise-field, mesh-gradient, particle-field, text-reveal and magnetic-button; only the selected variant renders.
import { AmbientHero } from '@/components/ui/ambient-hero';

export default function Hero() {
  return (
    <AmbientHero
      headline="Your headline"
      body="One or two plain sentences about what you offer."
      primaryCta={{ label: 'Start now', href: '/signup' }}
    />
  );
}
```

### Common Mistakes to Avoid
- Do not place a second WebGL item above the fold alongside AmbientHero (violates single signature moment rule).
- headline, body and primaryCta are required and there is no default copy: TypeScript fails without them. Pass your own text; never ship the demo's.
- The scrim is built from your --background token. It lowers background luminance but is not a contrast guarantee: verify contrast for your content in light and dark.
- paused (and the built-in Pause button) reaches the ambient variant only; a custom background slot, the headline reveal and the buttons are not paused by it.
- On a server-rendered page the headline is painted as final static text first (TextReveal does not replay on first paint), so do not expect a word-by-word entrance on load.
- Reveal styles only apply when <html> has data-motion="ok" (MotionReadyScript in Next, initMotionReady() in Vite).
- Under a nonce-based CSP pass nonce: AmbientHero forwards it to the <style> element of its headline reveal.
- The pause button pauses the hero background only. Motion elsewhere on the page (other items, Marquee) needs its own pause control or the runtime pauseAll().
- The scrim keeps the text readable by muting the background (about 45-85% of --background); the animated background is subtle by design. If the background should be the star, compose your own hero around mesh-gradient, noise-field or particle-field.

### How to Verify
- Verify that exactly one <h1> element exists in the rendered DOM.
- Verify that the pause button toggles motion and has valid aria-label.
- Verify that reduced-motion preferences render a static poster with 0 canvases.

## Measured Bench Evidence

- **Bench Commit**: `cb09809` (2026-10-05)
- **Size**: 3.57 KiB initial / none deferred. Gzip of this item's own source files only (method: gzip-9); excludes the runtime, third-party packages and any registry items it pulls in.
- **Cumulative Layout Shift (CLS)**: `0`
- **Frames When Idle**:
  - Off-screen: 0 frames
  - Hidden tab: 0 frames
  - Reduced motion: 0 frames
- **axe-core Violations**: Serious: 0, Critical: 0

### Verified Devices
| Environment | Via | Tier | Result | Date | Notes |
|---|---|---|---|---|---|
| Chromium Desktop (SwiftShader) | playwright | 3 | pass | 2026-10-05 | 19 passed, 0 failed |
| Chromium Mobile (Pixel 7 emulation) | playwright | 2 | pass | 2026-10-05 | 18 passed, 0 failed |
| Firefox Desktop | playwright | 3 | pass | 2026-10-05 | 19 passed, 0 failed |
| WebKit Desktop | playwright | 3 | pass | 2026-10-05 | 18 passed, 0 failed |
| WebKit Mobile (iPhone 14 emulation) | playwright | 2 | pass | 2026-10-05 | 17 passed, 0 failed |

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
