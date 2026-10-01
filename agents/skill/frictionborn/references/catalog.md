# Frictionborn Motion — Component Catalog

Verified motion and WebGL components with strict zero-slop budgets, server-safe rendering, and unified frame scheduling.

## Components

| Component | Slot | Kind | Reduced Motion | Server Output | Summary |
|---|---|---|---|---|---|

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
