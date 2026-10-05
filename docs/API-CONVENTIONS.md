# Frictionborn API Conventions

This document establishes the uniform API standards across all 12 Frictionborn registry items and compositions. All published items strictly adhere to these conventions.

---

## 1. Units and Standard Props

| Concept | Prop Name | Type & Unit | Conventions & Rules |
| :--- | :--- | :--- | :--- |
| **Duration** | `duration` | `number` (milliseconds) | All animation durations are strictly in **milliseconds**. E.g., `SmoothScroll duration={1200}` means 1.2 seconds. |
| **Speed Multiplier** | `speed` | `number` (unitless) | Standard speed multiplier where `1.0` represents standard speed, `0.5` half speed, `2.0` double speed. |
| **Pixel Velocity** | `pixelsPerSecond` | `number` (px/s) | Physical pixel drift rate (used by `Marquee`). Never named `speed`. |
| **Strength / Intensity** | `strength` | `number` (0.0 – 1.0) | Unitless fraction between 0 and 1 indicating effect magnitude. |
| **Physical Distance** | `pullDistance` | `number` (px) | Physical displacement in pixels (e.g. `MagneticButton pullDistance={18}`). Never named `strength`. |
| **Universal Pause** | `paused` | `boolean` (optional) | Available on all 12 items. When `true`, freezes frame advancement, ticks, and intersection listeners. |
| **CSP Nonce** | `nonce` | `string` (optional) | Available on all items that inject scoped CSS (`<style>` elements). Forwarded directly to the `<style>` tag. |

---

## 2. Component Structure & React Patterns

### `ref` Forwarding
Every component wraps its implementation in `React.forwardRef` and forwards the ref to the root interactive/container DOM node.

### Rest Props Spread
Every component accepts standard HTML attributes (`React.HTMLAttributes<HTMLElement>` or specific tag) and spreads `...rest` to its root DOM element.

### Composed Event Handlers
Pointer and mouse handlers (`onPointerMove`, `onPointerLeave`, `onClick`, etc.) compose consumer-provided handlers with internal motion logic.

### Named and Default Exports
Every item provides both:
1. A named export: `export { ItemName };`
2. A default export: `export default ItemName;`

This ensures compatibility with standard bundlers, Next.js dynamic imports, and shadcn CLI registry expectations.

---

## 3. Compositions Architecture

Compositions (`ambient-hero`, `scroll-showcase`) represent complete, responsive UI sections assembled from atomic items:
- **Props and Slots**: All content props (`headline`, `body`, `primaryCta`, `steps`) are **required in TypeScript** to prevent shipping accidental placeholder text.
- **Host Tokens Only**: Compositions never hardcode design palette values; they read CSS variables (`var(--background)`, `var(--foreground)`, `var(--primary)`, `var(--muted)`, `var(--card)`, etc.) from the consumer's theme.
- **Single WebGL Context**: Compositions enforce the single WebGL context budget above the fold.
- **Deferred Leases**: Ambient compositions defer GPU lease acquisition until after initial paint and LCP to prevent blocking the main thread during critical typography rendering.
