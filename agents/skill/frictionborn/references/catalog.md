# Frictionborn Motion — Component Catalog

Verified motion and WebGL components with strict zero-slop budgets, server-safe rendering, and unified frame scheduling.

## Components

| Component | Slot | Kind | Reduced Motion | Server Output | Summary |
|---|---|---|---|---|---|
| [magnetic-button](items/magnetic-button.md) | `cta` | `dom` | `static` | `final-state` | cta: Magnetic spring wrapper for buttons and links with fine-pointer gating (dom, server-safe, <2.5 KB, reduced motion -> static, mobile -> 0 listeners) |
| [marquee](items/marquee.md) | `strip` | `dom` | `static` | `final-state` | strip: Infinite marquee with inert duplicate, hover/focus pause, and WCAG pause button (dom, server-safe, <2.5 KB, reduced motion -> static, mobile -> ok) |
| [noise-field](items/noise-field.md) | `background` | `webgl` | `static` | `poster` | background: WebGL2 domain-warped noise hero background (webgl2, client-only, ~4.5 KB, reduced motion -> static poster, mobile -> tier 2 / tier 1 poster) |
| [scroll-reveal](items/scroll-reveal.md) | `media` | `dom` | `static` | `final-state` | media: Scroll-driven entrance using view-timeline with pooled IntersectionObserver fallback (dom, server-safe, <2 KB, reduced motion -> static, mobile -> 12px) |
| [smooth-scroll](items/smooth-scroll.md) | `page-provider` | `scroll-provider` | `off` | `static-layout` | page-provider: Lenis provider stepped strictly via useFrame with autoRaf false (dom, server-safe, singleton, reduced motion -> off, mobile -> off) |
| [sticky-scroll-story](items/sticky-scroll-story.md) | `scroll-section` | `dom` | `opacity-only` | `static-layout` | scroll-section: Sticky media column with scrolling steps (dom, server-safe, 0 CLS, reduced motion -> opacity-only, mobile -> stacked) |
| [text-reveal](items/text-reveal.md) | `headline` | `dom` | `static` | `final-state` | headline: Typography reveal by word/line/char with font-ready splitting (dom, server-safe, <3 KB, reduced motion -> static, mobile -> reduced stagger) |

## Architectural Guarantees

1. **Zero Layout Shift**: Static HTML matches initial client dimensions (serverOutput: poster / final-state / static-layout).
2. **Zero Idle Overhead**: All loops pause when off-screen or tab is hidden.
3. **Exact Reduced Motion**: Static fallbacks honored strictly per user preferences.
4. **Strict Accessibility**: Text stays in the DOM, native interactive elements preserved.

## Installation Guide

All components install via the shadcn CLI:
```bash
npx shadcn@latest add @frictionborn/<component-name>
```
