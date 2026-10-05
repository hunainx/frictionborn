# @frictionborn/runtime

The small shared runtime behind [Frictionborn Motion](https://github.com/hunainx/frictionborn): one frame loop (`useFrame`), device capability tiers (`useCapability`), a WebGL context budget (`glBudget`), the reduced-motion and pause state, and `MotionReadyScript` / `initMotionReady()` for the reveal gate.

You normally do not install this package by hand. Every item in the Frictionborn registry depends on it, and `shadcn add @frictionborn/<item>` installs it for you. Read the spec sheet of the item you use; the exports here are documented in the repository (`ARCHITECTURE.md`, section 3, and `docs/API-CONVENTIONS.md`).

- ESM only, React 19 as a peer dependency, no other runtime dependencies.
- `@frictionborn/runtime/server` is the subset that is safe in a React Server Component (it is also what the package root resolves to under the `react-server` condition). `@frictionborn/runtime/gl` is the WebGL2 surface helper, kept out of the core bundle.
- Server import is free of `window` access.

MIT licence.
