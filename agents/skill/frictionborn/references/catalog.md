# Frictionborn Motion — Component Catalog

Verified motion and WebGL components with strict zero-slop budgets, server-safe rendering, and unified frame scheduling.

## Components

| Component | Slot | Kind | Reduced Motion | Server Output | Summary |
|---|---|---|---|---|---|
| [ambient-hero](items/ambient-hero.md) | `composition` | `composition` | `static` | `poster` | Hero composition: ambient canvas (mesh/noise/particles) + TextReveal + MagneticButton (DOM+WebGL, reduced motion -> static, mobile -> T2) |
| [distortion-image](items/distortion-image.md) | `media` | `webgl` | `static` | `static-layout` | media: WebGL2 hover-displacement image overlay (webgl, client-only, reduced motion -> static image, mobile -> plain image / 0 contexts) |
| [magnetic-button](items/magnetic-button.md) | `cta` | `dom` | `static` | `final-state` | cta: Magnetic spring wrapper for buttons and links with fine-pointer gating (dom, server-safe, reduced motion -> static, mobile -> 0 listeners) |
| [marquee](items/marquee.md) | `strip` | `dom` | `static` | `final-state` | strip: Infinite marquee with inert duplicate, hover/focus pause, and pause button (dom, server-safe, reduced motion -> static, mobile -> animates) |
| [mesh-gradient](items/mesh-gradient.md) | `background` | `webgl` | `static` | `poster` | background: multi-color organic mesh gradient via WebGL2 (webgl2, client-only, reduced motion -> static poster, DPR <= 1.5 on mobile/Tier 2) |
| [noise-field](items/noise-field.md) | `background` | `webgl` | `static` | `poster` | background: WebGL2 domain-warped noise hero background (webgl2, client-only, reduced motion -> static poster, mobile -> tier 2 / tier 1 poster) |
| [particle-field](items/particle-field.md) | `background` | `webgl` | `static` | `poster` | background: WebGL2 vertex-shader particle drift with pointer repel (webgl2, client-only, reduced motion -> poster, mobile -> tier 2 / tier 1 poster) |
| [scroll-reveal](items/scroll-reveal.md) | `media` | `dom` | `static` | `final-state` | media: Scroll-driven entrance (CSS view() timeline, IntersectionObserver fallback) (dom, server-safe, reduced motion -> static, low-end mobile -> 12px) |
| [scroll-showcase](items/scroll-showcase.md) | `composition` | `composition` | `opacity-only` | `static-layout` | Scroll composition: StickyScrollStory + ScrollReveal + optional Marquee, fixed demo copy (DOM, reduced motion -> static/opacity, mobile -> stacked) |
| [smooth-scroll](items/smooth-scroll.md) | `page-provider` | `scroll-provider` | `off` | `static-layout` | page-provider: Lenis provider stepped strictly via useFrame with autoRaf false (dom, server-safe, singleton, reduced motion -> off, mobile -> off) |
| [sticky-scroll-story](items/sticky-scroll-story.md) | `scroll-section` | `dom` | `opacity-only` | `static-layout` | scroll-section: Sticky media column with scrolling steps (dom, server-safe, CLS <= 0.01, reduced motion -> opacity-only (instant swap), mobile -> stacked) |
| [text-reveal](items/text-reveal.md) | `headline` | `dom` | `static` | `final-state` | headline: word/line/char text reveal (dom, server-safe); SSR text stays static; reduced motion -> static; low-end mobile -> 40 ms stagger |

## Architectural Guarantees

1. **Layout stability**: static HTML matches the initial client dimensions (serverOutput: poster / final-state / static-layout); each sheet lists the measured CLS (budget: 0.01 or less).
2. **Idle overhead**: animation loops stop when the item is off-screen or the tab is hidden (frames-when-idle is measured and listed on each sheet).
3. **Exact Reduced Motion**: Static fallbacks honored strictly per user preferences.
4. **Strict Accessibility**: Text stays in the DOM, native interactive elements preserved.

## Installation Guide

1. Register the namespace once, in `components.json` (use the registry URL published with the release):
```json
{ "registries": { "@frictionborn": "<registry-base-url>/r/{name}.json" } }
```
2. Install an item (the shadcn CLI also installs the registry items it depends on, and `@frictionborn/runtime`):
```bash
npx shadcn@latest add @frictionborn/<component-name>
```
3. Items whose sheet lists a "Client Reveal Gate" need one line: Next.js renders `<MotionReadyScript />` in `<head>` of the root layout; Vite / SPA calls `initMotionReady()` before the first render. Both come from `@frictionborn/runtime`.
