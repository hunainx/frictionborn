# dummy — Specification Sheet

> Sample dummy item for pipeline verification, testing bench probes, and spec generation.

## Overview

- **Item Name**: `dummy`
- **Version**: `0.1.0`
- **Slot**: `background`
- **Kind**: `dom`
- **Install**: `npx shadcn@latest add @frictionborn/dummy`

## Intent

### Use When
- Testing pipeline and metadata verification
- Benchmarking harness probes and CI gates

### Avoid When
- Production motion surfaces where rich visual effects are needed

## Runtime & Server Boundaries

- **Server Output**: `static-layout` (No layout shift, accessible fallback in static HTML)
- **Client Only**: `false`
- **Lazy Loaded**: `no`
- **Requirements**: React `>=19`, Frameworks: next-app-router, vite-react

## Behavior & Tiers

- **Animation Loop**: `none` (managed via runtime `useFrame`)
- **WebGL Contexts**: `0`
- **Reduced Motion**: Mode `static` — Renders static layout with all animations paused immediately.

### Device Tiers
- **Tier 0** (Low-end / Battery saver): Static layout placeholder
- **Tier 1** (Mid-range mobile): Static layout placeholder
- **Tier 2** (Standard desktop / modern mobile): Full CSS animation
- **Tier 3** (High performance GPU): Full CSS animation

### Input Interactions
- **Pointer**: None
- **Touch**: None
- **Keyboard**: None

## Accessibility (a11y)

- **Role**: `decorative`
- **Hidden from Assistive Tech**: `true`
- **Text Stays in DOM**: `true`
- **Pause Control**: `not-needed`
- **WCAG Criteria**: 2.2.2

## Composition

- **Max Per Page**: 10
- **Singleton**: false
- **Conflicts With**: None
- **Pairs Well With**: None

## Props

| Prop | Type | Default | Effect |
|---|---|---|---|
| `className` | `string` | `""` | Applies custom Tailwind CSS utility classes. |
| `children` | `React.ReactNode` | `null` | Children rendered inside the container. |

## Agent Instructions

### Installation
```bash
npx shadcn@latest add @frictionborn/dummy
```

### Usage
```tsx
import { Dummy } from "@/components/ui/dummy";

export default function Page() {
  return <Dummy className="p-4">Content</Dummy>;
}
```

### Common Mistakes to Avoid
- Do not attempt to animate directly using requestAnimationFrame; use useFrame from @frictionborn/runtime.
- Do not remove the data-motion attribute from the parent container.

### How to Verify
- Confirm static HTML output contains the child content before JavaScript hydration.
- Confirm no rAF calls are executed when idle or off-screen.

## License & Provenance

- **Code License**: MIT
- **Origin**: Original implementation for Frictionborn Motion.
