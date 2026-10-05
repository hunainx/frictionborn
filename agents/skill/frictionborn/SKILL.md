---
name: frictionborn
description: Expert guidance on choosing, installing, and configuring verified Frictionborn Motion and WebGL components.
---

# Frictionborn Motion Skill

Use Frictionborn when building high-craft landing pages, marketing sections, or portfolio showpieces.

## 1. When to Use (and When NOT to Use)

- **USE FOR**: Landing page heros, product feature showcases, conversion CTAs, narrative scroll storytelling, brand showcases.
- **DO NOT USE FOR**: Dense dashboards, data tables, checkout/auth forms, modals, administrative UI, or repeated feed cards.

## 2. Item Decision Table

| Intent / UX Slot | Recommended Item | Alternative / Notes |
| :--- | :--- | :--- |
| **Hero Background** | `mesh-gradient` (chromatic) or `noise-field` (fluid) | `particle-field` (minimal constellations). Max 1 ambient canvas per page. |
| **Hero Entrance** | `text-reveal` | Word-by-word reveal for `<h1>` headlines. Renders static during SSR. |
| **Primary Action** | `magnetic-button` | Pulls toward cursor on fine-pointer devices. Snaps to origin on focus. |
| **Full Hero Section** | `ambient-hero` | Pre-assembled composition: background + `TextReveal` + `MagneticButton`. |
| **Narrative Showcase**| `sticky-scroll-story` | Sticky media panel with scrolling text milestones. Stacked on mobile. |
| **Feature Unveiling** | `scroll-reveal` | Pure CSS scroll-driven reveals (fallback to IO). Focus-guarded. |
| **Brand / Proof Ticker**| `marquee` | Seamless ticker. Pauses on hover, focus, and reduced motion. |
| **Feature Deep-Dive** | `scroll-showcase` | Pre-assembled composition: narrative + specifications grid + marquee. |
| **Hero Visual / Image**| `distortion-image` | Interactive WebGL ripple on hover/focus. Lease released on 3s idle. |
| **Page Momentum** | `smooth-scroll` | Lenis smooth scroll provider. Disabled on coarse touch screens & reduced motion. |

## 3. Composition Rules

1. **One Signature Moment Per Viewport**: Never stack multiple animated canvases or attention-grabbing items in the same view.
2. **WebGL Context Budget**: Maximum 1 active WebGL context above the fold. Items use server CSS posters until leased.
3. **WCAG AAA Scrim**: Ensure overlaid text maintains ≥ 4.5:1 contrast against canvases via theme background scrims.
4. **Accessible Static Default**: Respect `prefers-reduced-motion: reduce`. All items render readable, static DOM equivalents.

## 4. Installation & Setup

1. **Install Runtime**:
   ```bash
   pnpm add @frictionborn/runtime lenis
   ```
2. **Motion-Ready Script**:
   - **Next.js (App Router)**: Add `<MotionReadyScript />` to `<head>` in `app/layout.tsx`.
   - **Vite / SPA**: Call `initMotionReady()` at the entry point (`main.tsx`).
3. **Install Components via shadcn CLI**:
   ```bash
   npx shadcn@4.21.1 add @frictionborn/<item-name>
   ```
4. **CSP Configuration**: If using strict CSP, add `MOTION_READY_SCRIPT_HASH` to `script-src` and pass `nonce` to items using `<style>`.

## 5. Usage & Host Design Tokens

- **Strictly use host tokens**: Pass CSS variables (`var(--background)`, `var(--primary)`, `var(--foreground)`, `var(--border)`).
- **TypeScript Required Props**: Compositions require explicit content props (`headline`, `body`, `primaryCta`, `steps`). Never ship placeholder demo copy.
- **Universal `paused` Prop**: All items accept `paused?: boolean` for consumer-controlled animation freezing.
- **Per-Item Spec Sheets**: Consult `references/items/<item-name>.md` and `references/catalog.md` for exact props and performance limits.

## 6. How to Read Verified Metadata

Verified metadata is stored in `meta.json` next to each component and published in the registry:
- `intent`: Official guidance on when to use, when to avoid, and compatible companions.
- `measured`: Real benchmark evidence (FPS, frame times, CPU idle, memory delta, Lighthouse scores) measured on committed code.
- `behavior`: Capability tiers (T0 static fallback, T1 low-power, T2 balanced, T3 full desktop) and reduced-motion modes.

## 7. Anti-Patterns to Reject

- **NEVER** pass unresolved `var()`, `hsl()`, or `oklch()` color strings into WebGL uniforms. Use `resolveCssColor()` first.
- **NEVER** place two WebGL items above the fold.
- **NEVER** use custom easing curves that violate the design system standard tokens (`ease-out`, `ease-spring`).
- **NEVER** run scroll listeners on low-power tiers (use `IntersectionObserver` or CSS `animation-timeline`).
- **NEVER** hardcode background slabs (e.g. `#0d0f12`) in component code—always resolve through host theme tokens.
