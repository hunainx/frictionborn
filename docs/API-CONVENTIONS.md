# Frictionborn API Conventions

This document establishes the uniform API standards across all 12 Frictionborn registry items and compositions. A test (`test/spec-sheet-truth.test.ts`) checks that every documented prop exists and every declared prop is documented.

---

## 1. Units and Standard Props

| Concept | Prop Name | Type & Unit | Conventions & Rules |
| :--- | :--- | :--- | :--- |
| **Duration** | `duration` | `number` (milliseconds) | All animation durations are strictly in **milliseconds**. E.g., `SmoothScroll duration={1200}` means 1.2 seconds (a seconds value such as `1.2` now means 1.2 ms). |
| **Speed Multiplier** | `speed` | `number` (unitless) | `1` is the item's standard speed, `0.5` half, `2` double. On Marquee it multiplies `pixelsPerSecond`. MeshGradient's default is `1` (its standard speed is already slow: 0.35 shader seconds per real second, checked by `bench/specs/mesh-speed.spec.ts`). |
| **Pixel Velocity** | `pixelsPerSecond` | `number` (px/s) | Physical pixel drift rate (used by `Marquee`, default 40). Never named `speed`. |
| **Strength / Intensity** | `strength` | `number` (0.0 – 1.0) | Unitless fraction indicating effect magnitude (`DistortionImage`). It is passed to the shader as given and is not clamped. |
| **Physical Distance** | `pullDistance` | `number` (px) | Physical displacement in pixels (`MagneticButton pullDistance={18}`). Never named `strength`. |
| **Universal Pause** | `paused` | `boolean` (optional) | Present on all 12 items. What it stops depends on the item: see the table below. It is the item's own switch; only a host calls the runtime's `pauseAll()`. |
| **CSP Nonce** | `nonce` | `string` (optional) | On every item that renders a `<style>` element (TextReveal, ScrollReveal, Marquee, StickyScrollStory) and on both compositions, which forward it. See `docs/CSP.md`. |

### What `paused` does, per item

| Item | While `paused` |
| :--- | :--- |
| `noise-field`, `mesh-gradient`, `particle-field` | The frame loop stops (0 requested frames). The WebGL context and its lease are kept; the last frame stays on screen. |
| `distortion-image` | Releases the lease and shows the plain image; hover and focus do nothing until un-paused. |
| `smooth-scroll` | Lenis is destroyed and the page scrolls natively; un-pausing builds a new instance. |
| `marquee` | CSS `animation-play-state: paused`. |
| `magnetic-button` | Stops following the pointer. A button that was displaced stays displaced until un-paused. |
| `text-reveal` | Renders the plain static text. Un-pausing replays the reveal from the start. It does not freeze mid-animation. |
| `scroll-reveal` | Forces the content visible. Where the browser supports CSS scroll-driven animation (the main path) the reveal follows the scroll position and the prop has no effect. |
| `sticky-scroll-story` | Stops tracking the scrolled step; the active step stays. |
| `ambient-hero` | Pauses the ambient background variant only (not a custom `background`, the headline or the buttons). |
| `scroll-showcase` | Passes `paused` to its reveals, story, marquee and SmoothScroll, so it inherits their behaviour above. |

A spec (`bench/specs/paused.spec.ts`) counts `requestAnimationFrame` callbacks in a real browser: 0 while paused, more than 5 after un-pausing, 0 again after pausing again (marquee: every animation `paused`).

---

## 2. Component Structure & React Patterns

### `ref`
Every component forwards `ref` to a DOM element. Nine of them use the React 19 `ref` prop with `useImperativeHandle`; `sticky-scroll-story`, `ambient-hero` and `scroll-showcase` use `React.forwardRef`. The package requires React 19, so both forms behave the same. The element differs per item, and each props table names it:

| Item | `ref` is |
| :--- | :--- |
| `text-reveal`, `scroll-reveal` | the root element chosen by `as` (typed `React.Ref<any>`) |
| `magnetic-button` | the wrapper `<div>`, not the child button |
| `marquee`, `sticky-scroll-story`, `scroll-showcase` | the root `<div>` |
| `smooth-scroll` | the root `<div>`, which is `display: contents` (its bounding box is empty) |
| `noise-field`, `mesh-gradient`, `particle-field` | the root `<div>` that holds the poster and the canvas |
| `distortion-image` | the wrapper `<div>` around the `<img>`, not the `<img>` |
| `ambient-hero` | the root `<header>` |

### Rest props
Every component extends the matching `React.HTMLAttributes<…>` and spreads `...rest` on its root element, after its own attributes: an attribute you pass wins, including `data-frictionborn-item` (do not override it) and, on TextReveal, `id`.

### Composed event handlers
Handlers an item uses itself are composed with the consumer's: `MagneticButton` (`onPointerMove`, `onPointerLeave`, and the child's `onFocus`) and `DistortionImage` call yours and then run their own logic. The other items attach no handlers of their own to the root. `SmoothScroll`'s `onScroll` is the exception: it receives the Lenis scroll event, not the DOM event.

### Named and Default Exports
Every item provides both a named export (`export { ItemName }`) and a default export (`export default ItemName`).

---

## 3. Compositions Architecture

Compositions (`ambient-hero`, `scroll-showcase`) are complete sections assembled from the atomic items:
- **Props and slots**: content props (`headline`, `body`, `primaryCta`, `description`, `steps`) are **required in TypeScript** (`test/types/` compiles a fixture that must fail without them). The component files contain no copy of their own; headings and labels that you do not pass are not rendered.
- **Host tokens only**: no hex, rgb() or hsl() colour and no docs-only token appears in any shipped item file (a test scans them). Colours come from `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--muted-foreground`, `--secondary`, `--card`, `--border` with system-colour fallbacks.
- **One WebGL context per hero**: `AmbientHero` mounts exactly one background variant. Two heroes on one page would mount two; the runtime budget (4 contexts on a fine pointer, 2 on a coarse one) is what bounds the page.
- **Deferred lease**: `AmbientHero` waits for the first LCP entry plus an idle callback (at most 1.5 s) before it mounts the background, so the headline paints without GPU contention. Measurements (`pnpm lighthouse`) record when the GL really started relative to the end of the observed window; see DECISIONS 33.
- **Per-instance ids**: generated with `useId`; two compositions on one page never share an id.
