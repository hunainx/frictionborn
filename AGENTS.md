# AGENTS.md — Frictionborn Motion

Instructions for coding agents (and people) who change this repository. To use the components in your own project, read the
[README](README.md) and paste [`agents/AGENTS.snippet.md`](agents/AGENTS.snippet.md) into your project's `AGENTS.md` instead.

## What this repo is
The Frictionborn Motion library: 25 motion, canvas and WebGL components for React, a small runtime (`@frictionborn/runtime`),
metadata measured by a bench, and an agent skill. Keep the scope narrow: open an issue before adding an item, a runtime API or a
dependency.

## Where the rules live
1. [ARCHITECTURE.md](ARCHITECTURE.md): structure, runtime API, boundaries
2. [DESIGN.md](DESIGN.md): motion tokens, reduced-motion modes, tiers, palettes
3. [TESTING.md](TESTING.md): what "passing" means
4. [docs/API-CONVENTIONS.md](docs/API-CONVENTIONS.md): public API conventions, units and prop standards

If two documents disagree, stop and ask in an issue. Don't guess.

## How to work
1. Plan one focused change. Don't start a second one in the same branch.
2. Implement it inside that scope.
3. Run the checks the change needs (see Commands). Never call a change done with failing checks.
4. Commit the regenerated files with the change (see "Generated files" in [CONTRIBUTING.md](CONTRIBUTING.md)).
5. Stop and ask before adding any dependency or publishing anything to npm.
6. Stop only processes you started, by their PID. Never kill by image name (`taskkill /IM`, `pkill node`): other Node, Python
   and browser processes on the same machine are not yours.

## Stack (fixed)
- pnpm workspaces + Turborepo + Changesets; Node ≥ 20
- React 19, TypeScript strict, Tailwind v4 in host apps (Next.js 16 App Router or Vite)
- Runtime built with tsdown; tests: Vitest (unit), Playwright (bench), axe-core, size-limit, Lighthouse
- Registry: stock shadcn CLI format
- Allowed third-party runtime dependency: `lenis@1.3.26` (consumers accept `lenis@^1.3.26`). Nothing else without an agreed issue.

## Commands
```
pnpm i                      # install
pnpm test                   # unit tests
pnpm bench                  # Playwright bench, all items
pnpm bench --item <name>    # one item
pnpm bench:release --item <name>   # record a release run on committed code
pnpm size                   # size budgets
pnpm lint                   # eslint + provenance + copy + shipped-code checks
pnpm meta                   # validate + merge measured evidence + build catalog
pnpm registry:build         # build public/r
pnpm fresh-apps             # install every item into fresh Next and Vite apps
```

## Hard rules (never break)
1. **Server output is static.** No `opacity: 0` or off-screen transforms in server HTML. Hidden-before-reveal CSS only under `[data-motion="ok"]`.
2. **WebGL is client-only and lazy.** WebGL code lives in `*.gl.tsx`, loaded with `React.lazy` + `Suspense` inside a `"use client"` file, only when in view, tier ≥ 2 and `glBudget.acquire()` returns a lease. Always render a poster first.
3. **One frame loop, one scroll engine.** Use `useFrame` from the runtime; never call `requestAnimationFrame` directly in components. At most one smooth-scroll provider per page.
4. **Reduced motion is architecture, not a feature.** Every item declares one mode (`static` / `still-frame` / `opacity-only` / `off`) and must behave exactly like it.
5. **Never remove a `// @frictionborn-guard` line.**
6. **Never hand-write `measured` metadata.** Only `pnpm meta` writes it from bench results.
7. **Originality.** Don't copy code from other motion or shader libraries or galleries (React Bits, Aceternity, Magic UI, 21st.dev, Shadertoy, The Book of Shaders, LYGIA). Adapt only MIT/BSD/ISC/Zlib/Apache-2.0/CC0 code, with a `// Source: <url> — <licence> — <copyright>` header. Everything else starts with `// Original`.
8. **No copyleft or non-commercial code** (GPL, AGPL, LGPL, Commons Clause, CC-NC). No brand names in component names.
9. **No fonts, models, HDRIs, sounds or image packs in the repo.**
10. **Pin exact versions** for all runtime dependencies.
11. **Accessibility:** native elements (`<button>`, `<a>`, `<img alt>`), text in the DOM, visible focus, a pause control for motion longer than 5 s.

## Lessons (binding on every item)
1. **Stable defaults:** no new arrays, objects or functions in default props or params. Use module-level constants, and refs for callbacks.
2. **Default props in a fresh app:** test every item with its default props in a fresh Next 16 and Vite app (`pnpm fresh-apps`), not only through its demo.
3. **Specs must interact:** scroll (wheel + keyboard), hover, focus, resize, theme switch. A spec that only loads the page proves nothing.
4. **Host tokens:** components use host/shadcn tokens only (`--primary`, `--foreground`, `--background`, `--border`, `--muted-foreground`, …) with CSS system-colour fallbacks.
5. **Registry dependencies:** pin exactly in the registry JSON (`lenis@1.3.26`, not `^`).
6. **Evidence:** cite only commit SHAs that exist (`git cat-file -t <sha>`).
7. **Commits:** one per fix or item, small, except generated files.
8. **Resolve colours before canvas/WebGL:** never pass `var()`, `lab()`, `oklch()` or `hsl()` strings to canvas, WebGL or a third-party renderer; resolve them with `resolveCssColor` first.
9. **Regenerate the registry in the same commit** as any item change.
10. **Specs must fail on broken code:** show a new spec failing on the broken code before it counts. `toBeVisible` doesn't prove "resumed" or "rendering"; read pixels.
11. **Committed code for the release bench:** after any item change, run `pnpm bench:release --item <name>` on committed code, then `pnpm meta`. `pnpm meta` refuses failing or stale evidence.
12. **Prove the thing ran:** a measurement of a live WebGL item must show that it rendered (draw calls and non-uniform pixels read back), and its control must show that it did not.
13. **Pause scope:** an item's pause control stops that item (its `paused` prop). Only the host calls `pauseAll()`: it stops the shared frame loop, which also steps Lenis.
14. **Scan reduced motion and the light theme with axe**, not only the default dark mode.
15. **Public API conventions:** durations in ms, `speed` is a unitless multiplier, `strength` is 0–1, distances in px, `pixelsPerSecond` in px/s, a universal `paused` prop, `ref` forwarding and rest props ([docs/API-CONVENTIONS.md](docs/API-CONVENTIONS.md)).

## Definition of done (any change)
- The relevant checks from [TESTING.md](TESTING.md) pass locally.
- No new warnings in `pnpm lint`; no size budget regressions.
- Regenerated files are committed with the change.
