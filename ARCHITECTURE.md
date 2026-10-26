# ARCHITECTURE.md — Frictionborn Motion

## 1. Repository layout

```
frictionborn/
├── packages/runtime/            # the only npm package: @frictionborn/runtime
│   ├── src/                     # core entry (server-safe), plus /gl, /canvas and /server entries
│   └── test/
├── registry/items/<item>/       # <item>.tsx, <item>.gl.tsx (WebGL items), demo.tsx, meta.declared.json, meta.json (generated)
├── schema/meta.schema.json      # the metadata contract
├── bench/                       # Playwright harness, probes, specs, size budgets and recorded release results
├── scripts/                     # validate-meta, merge-evidence, build-catalog, build-registry, build-sizes, check-* scripts
├── public/r/                    # the built shadcn registry: <item>.json, <item>.md spec sheets, index.json, llms.txt
├── skills/frictionborn/         # the agent skill shipped to users: SKILL.md + references/ (generated spec sheets)
├── agents/AGENTS.snippet.md     # a block users paste into their own AGENTS.md
├── llms.txt                     # the library index for models (generated)
└── docs/                        # API-CONVENTIONS.md, CSP.md
```

`skills/` and `agents/` are products shipped to other people's coding agents; the rules for agents that work **on** this repository are in [AGENTS.md](AGENTS.md).

The built registry and the component docs are published at `https://frictionborn.com` (`/r/{name}.json`, `/r/{name}.md`, `/docs/components/{name}`).

## 2. Distribution model
- Components: source-copied via the stock shadcn CLI. Users own and can edit them.
- Runtime: npm (`@frictionborn/runtime`) because the context budget and frame loop are singletons and fixes must propagate.
- Items list `@frictionborn/runtime` in `dependencies`; `shadcn add` installs it.
- Registry JSON is built by `pnpm registry:build` into `public/r` and committed; CI fails when the committed files differ from a fresh build.

## 3. Runtime API (`@frictionborn/runtime`, ≤ 5 KB gz core, React 19 peer, no Provider)

Shared state is module-level stores read with `useSyncExternalStore`.

| Export | Behaviour | Server snapshot |
|---|---|---|
| `useReducedMotion(): boolean` | Live `prefers-reduced-motion` | `true` |
| `useCapability(): Capability` | `{ tier, reducedMotion, pointer, hover, webgl2, saveData, maxDpr, reasons[] }` | `tier: 0` |
| `useHydrated(): boolean` | True after hydration | `false` |
| `useInView(ref, { rootMargin, once })` | One pooled IntersectionObserver per rootMargin | `false` |
| `useFrame(cb, { active })` | Single shared rAF loop; runs only with ≥1 active subscriber and visible tab; `dt` capped at 50 ms | no-op |
| `useFrameGuard({ onDowngrade })` | p75 frame time > 25 ms for 2 s → downgrade; never upgrades | no-op |
| `glBudget.acquire({ id, priority })` → `Lease \| null`; `lease.release()` | Max 4 contexts (fine pointer T3) / 2 (coarse); LRU eviction of lowest-priority off-screen lease | `null` |
| `pauseAll()` / `resumeAll()` / `usePaused()` | Global pause (WCAG 2.2.2) | — |
| `MotionReadyScript` | Inline script: sets `data-motion="ok"` on `<html>` before paint if reduced motion is off | renders script |
| `tokens` | Durations, easings, stagger, distance (see [DESIGN.md](DESIGN.md) A2) | — |
| `@frictionborn/runtime/gl` → `createSurface(canvas, { maxDpr, scale })` | WebGL2, `powerPreference: 'low-power'`, full-screen triangle, shader compile with readable errors, ResizeObserver, DPR + iOS 8192² area clamp, context loss/restore events, `dispose()` via `WEBGL_lose_context` | not imported on server |

**Not in the runtime:** Provider/config, animation engine, springs library, scroll engine, three.js/R3F, GPU benchmark DB, theming, analytics, polyfills, UA sniffing, CLI.

## 4. Component lifecycle (every item)
1. Server renders the final static state.
2. After hydration read `useCapability()`; T0 → stay static.
3. WebGL items: mount client island → dynamic import `*.gl.tsx` only when in view, tier ≥ 2 and lease granted.
4. Loops subscribe to `useFrame` with `active = inView && !paused && !reducedMotion`.
5. Unmount: unsubscribe, release lease, `surface.dispose()`, disconnect observers.
6. `webglcontextlost` → poster + release lease; restore → re-acquire only if visible.

## 5. Client boundaries
- Runtime main entry is server-safe (no `window` at import).
- Components: `"use client"`. WebGL code in `*.gl.tsx` loaded with `React.lazy` + `Suspense` inside the client component behind in-view, tier ≥ 2, and lease gates (compatible with both Next.js and Vite).

## 6. Metadata pipeline
`meta.declared.json` (written by the author) + the release bench result in `bench/results/<item>/` → `scripts/merge-evidence.ts` → `registry/items/<item>/meta.json` → `scripts/build-catalog.ts` → `skills/frictionborn/references/{catalog.md,items/*.md}`, the decision table in `skills/frictionborn/SKILL.md` and `llms.txt` → `scripts/build-registry.ts` → `public/r`. `pnpm meta` refuses schema errors, a hand-written `measured` block, declared-vs-measured contradictions and evidence older than the item's code.

## 7. Tooling
pnpm + Turborepo + Changesets · tsdown for the runtime (the `"use client"` banners survive the build) · Vitest · Playwright (+ SwiftShader flags for WebGL in headless Chromium: `--use-angle=swiftshader --enable-unsafe-swiftshader`) · axe-core · size-limit · Lighthouse · jscpd · licence scan.

## 8. Security
See [SECURITY.md](SECURITY.md). Item types are limited to `registry:ui` and `registry:block`; every file target stays inside `components/ui/`; no `envVars`; an exact-pinned dependency allowlist.
