---
name: frictionborn
description: Choose, install and use Frictionborn Motion items, verified React components for motion and WebGL on marketing pages (animated hero backgrounds, scroll reveals, sticky scroll stories, hover image effects, marquee, smooth scroll). Use when the user asks for an animated hero or background, scroll or hover effects, or a premium, smooth feel on a landing page. Do not use for dashboards, tables, filters, forms or other app UI.
---

# Frictionborn Motion

12 source-copied React items with measured budgets, installed through the shadcn CLI into `components/ui`. Before you use an item, read its spec sheet: `references/items/<name>.md` (props with units, gotchas, measured evidence). `references/catalog.md` lists all items.

## 1. Use it, or don't

- Use for marketing and landing pages: heroes, feature and story sections, galleries, logo strips.
- Do not use for dashboards, tables, filters, forms, checkout or auth, modals, admin UI, or repeated list rows. Build those with plain shadcn components and say that Frictionborn was left out on purpose.
- If no item fits the request, say so and build it without Frictionborn. Never invent a prop: if it is not in the spec sheet, it does not exist.

## 2. Pick the item

<!-- BEGIN GENERATED: decision-table (pnpm meta, from registry/items/*/meta.json; do not edit by hand) -->
| Slot | Item | Use it for | Avoid when | Per page | Do not combine with |
|---|---|---|---|---|---|
| `background` | [`mesh-gradient`](references/items/mesh-gradient.md) | Hero sections requiring rich, fluid multi-color ambient backgrounds | Dense text sections where text contrast over the gradient has not been verified | max 1 | `noise-field`, `particle-field` |
| `background` | [`noise-field`](references/items/noise-field.md) | Hero sections requiring a calm, generative ambient backdrop | Dense reading passages or documentation tables where text contrast over the canvas has not been verified | max 1 | `mesh-gradient`, `particle-field` |
| `background` | [`particle-field`](references/items/particle-field.md) | Hero sections requiring discrete starry or kinetic depth points | Dense text sections where text contrast over the particles has not been verified | max 1 | `noise-field`, `mesh-gradient` |
| `composition` | [`ambient-hero`](references/items/ambient-hero.md) | Primary landing page hero section requiring an ambient signature moment | Secondary pages or documentation headers where ambient motion distracts from content | 1 (singleton) | `noise-field`, `mesh-gradient`, `particle-field` |
| `composition` | [`scroll-showcase`](references/items/scroll-showcase.md) | Product feature narrative requiring sticky step progression and reveal on scroll | Short single-screen pages without scroll depth | max 1 | — |
| `cta` | [`magnetic-button`](references/items/magnetic-button.md) | High-priority call-to-action buttons in hero and conversion sections | Dense lists of repeating table buttons or compact toolbar grids | max 10 | — |
| `headline` | [`text-reveal`](references/items/text-reveal.md) | Hero headlines and section titles requiring editorial typographic reveals | Long paragraphs or running prose (> 2 lines of body text) | max 5 | — |
| `media` | [`distortion-image`](references/items/distortion-image.md) | Portfolio galleries and editorial features requiring tactile pointer distortion | Long lists of small thumbnails on mobile where static images are optimal | max 30 | — |
| `media` | [`scroll-reveal`](references/items/scroll-reveal.md) | Feature cards, images, and marketing content blocks entering the viewport | Above-the-fold hero elements that must paint immediately for LCP | max 20 | — |
| `page-provider` | [`smooth-scroll`](references/items/smooth-scroll.md) | Marketing landing pages requiring unified cinematic scroll feel | Dashboards and data-dense productivity software | 1 (singleton) | — |
| `scroll-section` | [`sticky-scroll-story`](references/items/sticky-scroll-story.md) | Editorial feature walk-throughs with accompanying media illustrations | Short single-paragraph descriptions without multi-step progression | max 2 | — |
| `strip` | [`marquee`](references/items/marquee.md) | Logo clouds, customer testimonials, and partner strips | Critical action buttons or primary call-to-action links that users must click immediately | max 4 | — |
<!-- END GENERATED: decision-table -->

How common requests map to items:

- **Animated hero or background**: `ambient-hero` for the whole hero (pass `headline`, `body`, `primaryCta`; there is no default copy). Or one of `mesh-gradient`, `noise-field`, `particle-field` as the background of a hero you write yourself. At most one WebGL item above the fold.
- **Images that react on hover**: `distortion-image` per image (own raster images such as webp, jpg or png; a cross-origin image needs CORS headers). It uses a WebGL context only while hovered or focused, and the runtime caps how many exist at once.
- **Content that reveals on scroll**: `scroll-reveal` around each block below the fold (never around the hero: it is the LCP). Use `as="li"` and similar for list items.
- **A story told in steps**: `sticky-scroll-story` (one media per step). Choose `scroll-showcase` only when you also want the metrics grid and the marquee strip around it.
- **"Premium and smooth" for a whole page**: `smooth-scroll` once, in the root layout; `scroll-reveal` on blocks below the fold; `magnetic-button` on the one primary call to action; at most one hero background. Stop there: more motion is worse, not more premium.
- **Logo or proof strip**: `marquee`.

## 3. Install

1. `components.json` must contain the registry namespace. Check it first. If it is missing, ask the owner for the registry URL (it is not on a public host yet) and add:
   `{ "registries": { "@frictionborn": "<registry-base-url>/r/{name}.json" } }`
2. `npx shadcn@4.21.1 add @frictionborn/<item> [<item> ...]`. This writes the item into `components/ui`, installs the items it depends on, `@frictionborn/runtime`, and `lenis` for `smooth-scroll`. Do not `pnpm add` those yourself. Use this pinned version, not `@latest`.
3. Reveal gate. Next.js: render `<MotionReadyScript />` (from `@frictionborn/runtime`) inside `<head>` of the root layout. It is safe in a Server Component. Vite or SPA: call `initMotionReady()` from `@frictionborn/runtime` before `createRoot(...).render(...)`. Without it `text-reveal`, `scroll-reveal`, `marquee`, `sticky-scroll-story` and both compositions stay static (nothing is hidden, nothing animates). Add it whenever you use anything other than a WebGL background or `distortion-image`.
4. Strict Content Security Policy: read the nonce in a Server Component and pass it down: `<MotionReadyScript nonce={nonce} />` and `nonce` on `text-reveal`, `scroll-reveal`, `marquee`, `sticky-scroll-story`, `ambient-hero`, `scroll-showcase`. The policy must also allow `style-src-attr 'unsafe-inline'`, because inline `style` attributes cannot carry a nonce.

## 4. Props and units (the same on every item)

- Durations are milliseconds: `duration={1200}` is 1.2 s. `speed` is a multiplier (1 = the item's normal speed). `strength` is 0 to 1. `pullDistance` is px, `pixelsPerSecond` is px per second.
- Every item takes `paused`, `ref` and `className`/`style`, and spreads other HTML attributes on its root. The 4 items that render a `<style>` take `nonce`.
- Colours: host design tokens only (`var(--background)`, `--foreground`, `--primary`, `--border`, `--muted-foreground`), or Tailwind utilities that map to them (`bg-background`). Never hard-code a colour. Never pass `var()` strings to a canvas yourself; the items resolve tokens.

## 5. Rules

1. One signature moment per viewport: at most one WebGL item above the fold, and no stack of attention-grabbing items next to each other.
2. One scroll engine: a single `smooth-scroll`, never on dashboards. Never write your own `requestAnimationFrame` loop or add GSAP or Framer Motion.
3. Reduced motion is handled by the items. Do not override it, and do not add motion that ignores `prefers-reduced-motion`.
4. Text stays real DOM text: native `<a>` and `<button>` for actions, `alt` on images. Motion longer than 5 s needs a pause control (`ambient-hero`'s and `marquee`'s are built in; for the three background items add your own and wire it to `paused`).
5. A scrim lowers background luminance but does not guarantee contrast. Check text contrast over any canvas, in light and dark.

## 6. Traps

- `text-reveal` on a server-rendered page paints final text and does not animate on first load. `replayKey` makes it hide and replay after hydration, which flashes. Use it for client-side swaps, not for a hero that must be visible immediately.
- `ambient-hero` and `scroll-showcase` take required content props; TypeScript fails without them. They contain no copy of their own and no demo text.
- `sticky-scroll-story` renders each step's media twice (sticky and stacked copy), so no ids inside it, and step titles are `h2`.
- `mesh-gradient`, `noise-field` and `particle-field` fill their container: give it a height. `distortion-image` takes its size from your `className` or `width`/`height`.
- Installed files are vendored source. Under Next 16's default ESLint they report errors such as `react-hooks/refs`, `react-hooks/set-state-in-effect` and `no-explicit-any` (`pnpm lint` fails; `next build` does not). Do not hand-edit them to silence it: add every installed file to the ESLint ignores (one glob per item, and per item it pulls in: `ambient-hero` installs six) and tell the user.

## 7. Verify before you report

1. `next build` (or the framework's build) passes.
2. Open the page: 0 console errors, one `h1`, focus rings visible, at most one canvas above the fold.
3. Turn on reduced motion in the OS or the browser: no canvas, nothing moving, all text visible.
4. Report which items you installed and why, anything you could not verify, and the lint note above if it applies.
