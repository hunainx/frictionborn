# Frictionborn Motion

**Twenty-five motion, canvas and WebGL components for React that AI coding agents can use correctly**, installed with the shadcn CLI, each with a spec sheet written from its own bench runs.

Docs: **[frictionborn.com/docs](https://frictionborn.com/docs/getting-started)** · Components: [frictionborn.com/docs/components](https://frictionborn.com/docs/components)

```bash
npx shadcn@4.21.1 add @frictionborn/flame-switch
```

The source lands in your project, so you can read and change it. A small runtime, `@frictionborn/runtime` (about 4 KB gzip), gives every component on a page one frame loop, one WebGL budget, reduced-motion handling and a device tier.

## Status

This repository is being prepared for its first public release. Until then:

- **`@frictionborn/runtime` is not on npm yet.** Every component depends on it, so `shadcn add` will not work until the first publish.
- **The registry address goes live at launch.** Until then the registry is built locally (`pnpm registry:build` writes `public/r`).
- **Real-device results are pending.** Every measured number comes from Playwright runs in Chromium, Firefox and WebKit, on desktop and with phone emulation.

## Install

Requirements: React 19, Tailwind CSS v4, and a Next.js App Router app or a Vite React app (both are checked with freshly scaffolded apps, `pnpm fresh-apps`).

Register the namespace once in `components.json`:

```json
{
  "registries": {
    "@frictionborn": "https://frictionborn.com/r/{name}.json"
  }
}
```

Then add a component with your package manager (the CLI also installs `@frictionborn/runtime`, and `lenis` for `smooth-scroll`):

```bash
pnpm dlx shadcn@4.21.1 add @frictionborn/noise-field
npx shadcn@4.21.1 add @frictionborn/noise-field
yarn dlx shadcn@4.21.1 add @frictionborn/noise-field
bunx --bun shadcn@4.21.1 add @frictionborn/noise-field
```

Read the component's spec sheet before you use it: its props with units, what it does with reduced motion, its tiers and what the bench measured. Components with a reveal gate need the one-line `MotionReadyScript` in `<head>` (or `initMotionReady()` in a Vite app); Content Security Policy notes are in [`docs/CSP.md`](docs/CSP.md).

## The 25 components

Every component that draws its own colour takes a `palette`: `fire`, `ice`, `neon`, `mono` or `custom` (CSS variables; [DESIGN.md](DESIGN.md) A8).

| Component | Install name | Draws with | Reduced motion | What it does |
|---|---|---|---|---|
| [AmbientHero](https://frictionborn.com/docs/components/ambient-hero) | `ambient-hero` | Composition | static | Hero composition: ambient canvas (mesh/noise/particles) + TextReveal + MagneticButton |
| [AshText](https://frictionborn.com/docs/components/ash-text) | `ash-text` | Canvas 2D | static | One line of real text drawn as grains of ash; a click or its button blows it away with glowing edges and it gathers back |
| [DistortionImage](https://frictionborn.com/docs/components/distortion-image) | `distortion-image` | WebGL | static | WebGL2 hover-displacement image overlay |
| [EclipseSwitch](https://frictionborn.com/docs/components/eclipse-switch) | `eclipse-switch` | Canvas 2D | still-frame | Light/dark theme switch: the moon slides across the sun until only the corona remains |
| [EmberBadge](https://frictionborn.com/docs/components/ember-badge) | `ember-badge` | Canvas 2D | static | Unread-count badge that is a live ember: flares on new items, cools to ash at zero |
| [EmberCore](https://frictionborn.com/docs/components/ember-core) | `ember-core` | WebGL | still-frame | 3D ash filament sphere with inner ember glow, vortex stir, shockwave strike and hold-to-charge burst |
| [FireworkRating](https://frictionborn.com/docs/components/firework-rating) | `firework-rating` | Canvas 2D | static | Five-star rating as a real radio group; hover previews, and each chosen star bursts as a firework |
| [FlameSwitch](https://frictionborn.com/docs/components/flame-switch) | `flame-switch` | Canvas 2D | static | On/off switch with a live pilot flame on its knob |
| [FlintButton](https://frictionborn.com/docs/components/flint-button) | `flint-button` | Canvas 2D | static | Button that strikes like flint: a steel rakes the stone and throws sparks; heat builds until it catches |
| [FuseToast](https://frictionborn.com/docs/components/fuse-toast) | `fuse-toast` | Canvas 2D | static | Undo toast whose time runs out as a fuse burning along its edge; it pauses while hovered or focused |
| [HoldToConfirm](https://frictionborn.com/docs/components/hold-to-confirm) | `hold-to-confirm` | Canvas 2D | static | Press-and-hold button for destructive actions: it fills, then crumbles to ash left to right; Undo rebuilds it |
| [LanternSky](https://frictionborn.com/docs/components/lantern-sky) | `lantern-sky` | Canvas 2D | still-frame | Night sky of paper lanterns rising at different depths; the pointer is a warm breeze |
| [LightLeakTabs](https://frictionborn.com/docs/components/light-leak-tabs) | `light-leak-tabs` | Canvas 2D | static | ARIA tabs over a furnace slot: the selected tab lets the firelight through and the light slides as you switch |
| [MagneticButton](https://frictionborn.com/docs/components/magnetic-button) | `magnetic-button` | HTML and CSS | static | Magnetic spring wrapper for buttons and links with fine-pointer gating |
| [Marquee](https://frictionborn.com/docs/components/marquee) | `marquee` | HTML and CSS | static | Infinite marquee with inert duplicate, hover/focus pause, and pause button |
| [MatchProgress](https://frictionborn.com/docs/components/match-progress) | `match-progress` | Canvas 2D | still-frame | Progress bar drawn as a row of matches, each catching from the last as the job advances |
| [MeshGradient](https://frictionborn.com/docs/components/mesh-gradient) | `mesh-gradient` | WebGL | static | multi-color organic mesh gradient via WebGL2 |
| [NoiseField](https://frictionborn.com/docs/components/noise-field) | `noise-field` | WebGL | static | WebGL2 domain-warped noise hero background |
| [ParticleField](https://frictionborn.com/docs/components/particle-field) | `particle-field` | WebGL | static | WebGL2 vertex-shader particle drift with pointer repel |
| [ScrollReveal](https://frictionborn.com/docs/components/scroll-reveal) | `scroll-reveal` | HTML and CSS | static | Scroll-driven entrance (CSS view() timeline, IntersectionObserver fallback) |
| [ScrollShowcase](https://frictionborn.com/docs/components/scroll-showcase) | `scroll-showcase` | Composition | opacity-only | Scroll composition: StickyScrollStory + ScrollReveal + optional Marquee; all copy comes from props |
| [SmoothScroll](https://frictionborn.com/docs/components/smooth-scroll) | `smooth-scroll` | Page scroll | off | Lenis provider stepped strictly via useFrame with autoRaf false |
| [StickyScrollStory](https://frictionborn.com/docs/components/sticky-scroll-story) | `sticky-scroll-story` | HTML and CSS | opacity-only | Sticky media column with scrolling steps |
| [TemperSlider](https://frictionborn.com/docs/components/temper-slider) | `temper-slider` | Canvas 2D | still-frame | Native range input across polished steel; the knob shows the oxide colour that forms at that temperature |
| [TextReveal](https://frictionborn.com/docs/components/text-reveal) | `text-reveal` | HTML and CSS | static | word/line/char text reveal |

The table comes from each component's `meta.json`. WebGL components show a poster first and start WebGL only when they are on screen, on a capable device, with a context to spare.

## For AI coding agents

- **The skill** tells an agent when to use these components, which one to pick and where the spec sheets are:

  ```bash
  npx skills add hunainx/frictionborn
  ```

  Add `-a <agent>` to pick the agent, for example `-a claude-code`.
- **The shadcn MCP server** finds and installs components from the registry by name once the namespace is in `components.json`.
- **[`llms.txt`](llms.txt)** lists every component with its slot and spec sheet; each registry JSON has its spec sheet next to it (`/r/<name>.md`).
- **[`agents/AGENTS.snippet.md`](agents/AGENTS.snippet.md)** is a short block to paste into your own project's `AGENTS.md`.

## Repository

| Path | What is in it |
|---|---|
| `packages/runtime` | `@frictionborn/runtime`, the only npm package |
| `registry/items` | One folder per component: source, `demo.tsx`, `meta.declared.json`, generated `meta.json` |
| `schema` | The metadata schema |
| `public/r` | The built shadcn registry and spec sheets (generated) |
| `skills/frictionborn` | The agent skill and its spec sheets (generated) |
| `bench` | The Playwright bench, its probes and the recorded release results |
| `scripts` | Metadata, registry, size, provenance and copy checks |

Commands: `pnpm test`, `pnpm bench --item <name>`, `pnpm size`, `pnpm lint`, `pnpm meta`, `pnpm registry:build`.

## Contributing, security, licence

- Contributions: [CONTRIBUTING.md](CONTRIBUTING.md) and the rules for agents in [AGENTS.md](AGENTS.md). Security: [SECURITY.md](SECURITY.md).
- Licence: [MIT](LICENSE) for the runtime, the registry components and the skill. Third-party notices: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- The Frictionborn name and logo are not covered by the MIT licence.
