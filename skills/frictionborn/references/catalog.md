# Frictionborn Motion — Component Catalog

Verified motion and WebGL components with strict zero-slop budgets, server-safe rendering, and unified frame scheduling.

## Components

| Component | Slot | Kind | Reduced Motion | Server Output | Summary |
|---|---|---|---|---|---|
| [ambient-hero](items/ambient-hero.md) | `composition` | `composition` | `static` | `poster` | Hero composition: ambient canvas (mesh/noise/particles) + TextReveal + MagneticButton (DOM+WebGL, reduced motion -> static, mobile -> T2) |
| [ash-text](items/ash-text.md) | `headline` | `canvas` | `static` | `final-state` | headline: One line of real text drawn as grains of ash; a click or its button blows it away with glowing edges and it gathers back (canvas 2D, server-safe text) |
| [distortion-image](items/distortion-image.md) | `media` | `webgl` | `static` | `static-layout` | media: WebGL2 hover-displacement image overlay (webgl, client-only, reduced motion -> static image, mobile -> plain image / 0 contexts) |
| [eclipse-switch](items/eclipse-switch.md) | `control` | `canvas` | `still-frame` | `final-state` | control: Light/dark theme switch: the moon slides across the sun until only the corona remains (canvas 2D, server-safe switch, reduced motion -> still) |
| [ember-badge](items/ember-badge.md) | `feedback` | `canvas` | `static` | `final-state` | feedback: Unread-count badge that is a live ember: flares on new items, cools to ash at zero (canvas 2D, server-safe, reduced motion -> static badge) |
| [ember-core](items/ember-core.md) | `background` | `webgl` | `still-frame` | `poster` | background: 3D ash filament sphere with inner ember glow, vortex stir, shockwave strike and hold-to-charge burst (WebGL2, still under reduced motion) |
| [firework-rating](items/firework-rating.md) | `control` | `canvas` | `static` | `final-state` | control: Five-star rating as a real radio group; hover previews, and each chosen star bursts as a firework (canvas 2D, server-safe, reduced motion -> plain) |
| [flame-switch](items/flame-switch.md) | `control` | `canvas` | `static` | `final-state` | control: On/off switch with a live pilot flame on its knob (canvas 2D, server-safe switch, reduced motion -> switch only, touch -> same switch) |
| [flint-button](items/flint-button.md) | `cta` | `canvas` | `static` | `final-state` | cta: Button that strikes like flint: a steel rakes the stone and throws sparks; heat builds until it catches (canvas 2D, native button, reduced motion -> plain) |
| [fuse-toast](items/fuse-toast.md) | `feedback` | `canvas` | `static` | `final-state` | feedback: Undo toast whose time runs out as a fuse burning along its edge; it pauses while hovered or focused (canvas 2D, server-safe toast) |
| [hold-to-confirm](items/hold-to-confirm.md) | `control` | `canvas` | `static` | `final-state` | control: Press-and-hold button for destructive actions: it fills, then crumbles to ash left to right; Undo rebuilds it (canvas 2D, native button) |
| [lantern-sky](items/lantern-sky.md) | `background` | `canvas` | `still-frame` | `final-state` | background: Night sky of paper lanterns rising at different depths; the pointer is a warm breeze (canvas 2D, server-safe, reduced motion -> still sky) |
| [light-leak-tabs](items/light-leak-tabs.md) | `navigation` | `canvas` | `static` | `final-state` | navigation: ARIA tabs over a furnace slot: the selected tab lets the firelight through and the light slides as you switch (canvas 2D, server-safe tabs) |
| [magnetic-button](items/magnetic-button.md) | `cta` | `dom` | `static` | `final-state` | cta: Magnetic spring wrapper for buttons and links with fine-pointer gating (dom, server-safe, reduced motion -> static, mobile -> 0 listeners) |
| [marquee](items/marquee.md) | `strip` | `dom` | `static` | `final-state` | strip: Infinite marquee with inert duplicate, hover/focus pause, and pause button (dom, server-safe, reduced motion -> static, mobile -> animates) |
| [match-progress](items/match-progress.md) | `feedback` | `canvas` | `still-frame` | `final-state` | feedback: Progress bar drawn as a row of matches, each catching from the last as the job advances (canvas 2D, server-safe bar, reduced motion -> still) |
| [mesh-gradient](items/mesh-gradient.md) | `background` | `webgl` | `static` | `poster` | background: multi-color organic mesh gradient via WebGL2 (webgl2, client-only, reduced motion -> static poster, DPR <= 1.5 on mobile/Tier 2) |
| [noise-field](items/noise-field.md) | `background` | `webgl` | `static` | `poster` | background: WebGL2 domain-warped noise hero background (webgl2, client-only, reduced motion -> static poster, mobile -> tier 2 / tier 1 poster) |
| [particle-field](items/particle-field.md) | `background` | `webgl` | `static` | `poster` | background: WebGL2 vertex-shader particle drift with pointer repel (webgl2, client-only, reduced motion -> poster, mobile -> tier 2 / tier 1 poster) |
| [scroll-reveal](items/scroll-reveal.md) | `media` | `dom` | `static` | `final-state` | media: Scroll-driven entrance (CSS view() timeline, IntersectionObserver fallback) (dom, server-safe, reduced motion -> static, low-end mobile -> 12px) |
| [scroll-showcase](items/scroll-showcase.md) | `composition` | `composition` | `opacity-only` | `static-layout` | Scroll composition: StickyScrollStory + ScrollReveal + optional Marquee; all copy comes from props (DOM, reduced motion -> static/opacity, mobile -> stacked) |
| [smooth-scroll](items/smooth-scroll.md) | `page-provider` | `scroll-provider` | `off` | `static-layout` | page-provider: Lenis provider stepped strictly via useFrame with autoRaf false (dom, server-safe, singleton, reduced motion -> off, mobile -> off) |
| [sticky-scroll-story](items/sticky-scroll-story.md) | `scroll-section` | `dom` | `opacity-only` | `static-layout` | scroll-section: Sticky media column with scrolling steps (dom, server-safe, CLS <= 0.01, reduced motion -> opacity-only (instant swap), mobile -> stacked) |
| [temper-slider](items/temper-slider.md) | `control` | `canvas` | `still-frame` | `final-state` | control: Native range input across polished steel; the knob shows the oxide colour that forms at that temperature (canvas 2D, server-safe input) |
| [text-reveal](items/text-reveal.md) | `headline` | `dom` | `static` | `final-state` | headline: word/line/char text reveal (dom, server-safe, SSR text stays static, reduced motion -> static, low-end mobile -> 40 ms stagger) |

## Architectural Guarantees

1. **Layout stability**: static HTML matches the initial client dimensions (serverOutput: poster / final-state / static-layout); each sheet lists the measured CLS (budget: 0.01 or less).
2. **Idle overhead**: animation loops stop when the item is off-screen or the tab is hidden (frames-when-idle is measured and listed on each sheet).
3. **Exact Reduced Motion**: Static fallbacks honored strictly per user preferences.
4. **Strict Accessibility**: Text stays in the DOM, native interactive elements preserved.

## Installation Guide

1. Register the namespace once, in `components.json` (use the registry URL published with the release; the registry is not on a public host yet, so ask the owner if the file does not have it):
```json
{ "registries": { "@frictionborn": "<registry-base-url>/r/{name}.json" } }
```
2. Install items. The shadcn CLI also installs the items they depend on, `@frictionborn/runtime` and (smooth-scroll) lenis; do not add them by hand:
```bash
npx shadcn@4.21.1 add @frictionborn/<component-name>
```
3. Next.js: render `<MotionReadyScript />` (from `@frictionborn/runtime`) in `<head>` of the root layout, a Server Component. Vite / SPA: call `initMotionReady()` before `createRoot(...).render(...)`. Items whose sheet lists a "Client Reveal Gate" stay static without it.
4. Under a strict Content Security Policy see `docs/CSP.md`: pass `nonce`, and `MOTION_READY_SCRIPT_HASH` or a nonce for `MotionReadyScript`.
