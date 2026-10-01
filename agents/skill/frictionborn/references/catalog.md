# Frictionborn Motion — Component Catalog

Verified motion and WebGL components with strict zero-slop budgets, server-safe rendering, and unified frame scheduling.

## Components

| Component | Slot | Kind | Reduced Motion | Server Output | Summary |
|---|---|---|---|---|---|
| [noise-field](items/noise-field.md) | `background` | `webgl` | `static` | `poster` | background: WebGL2 domain-warped noise hero background (webgl2, client-only, ~4.5 KB, reduced motion -> static poster, mobile -> tier 2 / tier 1 poster) |

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
