# Contributing

Thanks for looking. This is a small library with a narrow scope, so the most useful contributions are bug reports, fixes with a test, and corrections to docs and spec sheets. Please open an issue before you start on a new item, a new runtime API or a larger change, so the scope can be agreed first.

## Set up

You need Node.js 20 or newer (CI uses 22) and pnpm 11.24.0, the version pinned in `package.json`.

```bash
pnpm install
pnpm exec playwright install chromium   # only if you will run the bench
```

## Commands

```bash
pnpm test                   # unit tests (Vitest)
pnpm lint                   # eslint, provenance, copy and shipped-code checks
pnpm size                   # size budgets for @frictionborn/runtime
pnpm bench                  # Playwright bench, all items
pnpm bench --item <name>    # one item
pnpm meta                   # validate metadata, merge bench evidence, rebuild spec sheets and catalog
pnpm registry:build         # shadcn build into public/r
```

CI runs lint, tests, size, the bench on Chromium, Firefox and WebKit, and an install smoke test. Run the ones that touch your change before you open a pull request.

## Generated files

Some files are written by scripts. Do not edit them by hand; change the source and regenerate.

- `registry/items/<name>/meta.json` is built from `meta.declared.json` (which you write) plus bench results. Run `pnpm meta`.
- Spec sheets in `skills/frictionborn/references/items/`, `skills/frictionborn/references/catalog.md`, the decision table in `skills/frictionborn/SKILL.md`, and `llms.txt` come from `pnpm meta`.
- `public/r` and `public/registry.json` come from `pnpm registry:build`.

Commit the regenerated files in the same commit as the change. CI rebuilds them and fails if anything differs from what is committed.

## `measured` is never hand-written

The `measured` block in an item's metadata (size, CLS, idle frames, axe results, device results) comes only from bench runs. `pnpm bench:release --item <name>` records a run on committed code, and `pnpm meta` merges it. `pnpm meta` refuses failing or stale data, and the validator rejects a `measured` block in `meta.declared.json`. If your change alters an item's code, re-run the release bench for that item before you regenerate.

## Rules for item code

The full list is in [AGENTS.md](AGENTS.md). The ones that catch most pull requests:

- Server output is static. Hidden-before-reveal CSS goes under `[data-motion="ok"]` only.
- WebGL lives in `*.gl.tsx`, loads lazily, and starts only when the item is in view, the device tier allows it, and `glBudget.acquire()` returns a lease. Always render a poster first.
- Use `useFrame` from the runtime. Do not call `requestAnimationFrame` in components.
- Every item declares one reduced-motion mode and behaves exactly like it.
- Use host tokens (`--primary`, `--foreground`, `--background`, ...) with system-colour fallbacks.
- Pin exact versions for runtime dependencies. Open an issue before adding any new dependency; `lenis` is the only third-party runtime dependency today.
- Public API conventions (units, `paused`, `ref` forwarding) are in [docs/API-CONVENTIONS.md](docs/API-CONVENTIONS.md).

## Originality and licences

Every `.ts`, `.tsx`, `.js`, `.jsx` and `.css` file starts with `// Original` (or `/* Original`) or `// Source: <url> — <licence> — <copyright>`. Do not copy code from other motion or shader libraries or galleries, or from sites such as Shadertoy. You may adapt code under MIT, BSD, ISC, Zlib, Apache-2.0 or CC0 with the `// Source:` header. GPL, AGPL, LGPL, Commons Clause and non-commercial code are not accepted. No fonts, models, sounds or image packs in the repository.

## Pull requests

- One focused change per pull request. Fix commits stay small; generated files are the exception.
- Say what you ran and what it printed.
- A change to `@frictionborn/runtime` that users will notice needs a changeset: run `pnpm changeset`.
- For security problems, do not open an issue or a pull request. Follow [SECURITY.md](SECURITY.md).

By contributing you agree that your contribution is licensed under the [MIT licence](LICENSE).
