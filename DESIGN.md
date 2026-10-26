# DESIGN.md — Frictionborn Motion

The motion design system: how every component behaves. It is binding for every item in `registry/items`.

### A1. Principles
1. **Static first.** The page is complete without motion. Motion is an enhancement switched on after hydration.
2. **One signature moment per viewport.** Never stack ambient effects; one background effect per hero, one text effect per heading.
3. **Restraint over spectacle.** Slow, soft, low-contrast ambient motion. No bounce on UI chrome. No flashing (< 3 flashes/s).
4. **Use the project's tokens.** Components read the host project's CSS variables (`--primary`, `--accent`, `--background`, `--foreground`, `--font-sans`, `--font-display`). They never ship their own palette or fonts.
5. **Degrade deliberately.** Every fallback (poster, static state) is designed and reviewed, never blank.

### A2. Motion tokens (exported from `@frictionborn/runtime` as `tokens` and CSS variables)
| Token | Value | Use |
|---|---|---|
| `--fb-duration-fast` | 150 ms | Hover, focus, opacity-only reduced-motion swaps |
| `--fb-duration-base` | 400 ms | Reveals, crossfades |
| `--fb-duration-slow` | 900 ms | Hero entrances |
| `--fb-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances, reveals |
| `--fb-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Crossfades, loops |
| `--fb-stagger` | 60 ms (desktop) / 40 ms (mobile) | Line/word staggers; total stagger ≤ 600 ms on mobile |
| `--fb-distance` | 24 px (desktop) / 12 px (mobile) | Reveal travel distance |

Ambient WebGL speed defaults: slow (a full visual cycle ≥ 8 s).

### A3. Reduced-motion modes (every item declares exactly one)
| Mode | Meaning |
|---|---|
| `static` | No animation at all; final state immediately |
| `still-frame` | WebGL renders one frame, then no loop |
| `opacity-only` | ≤150 ms opacity change, no movement |
| `off` | Component disables itself (e.g. SmoothScroll) |

| Item | Mode |
|---|---|
| NoiseField, MeshGradient, ParticleField, DistortionImage | static |
| EmberCore, EclipseSwitch, LanternSky, MatchProgress, TemperSlider | still-frame |
| AshText, EmberBadge, FireworkRating, FlameSwitch, FlintButton, FuseToast, HoldToConfirm, LightLeakTabs | static |
| StickyScrollStory | opacity-only |
| TextReveal, ScrollReveal, MagneticButton, Marquee | static |
| SmoothScroll | off |
| AmbientHero, ScrollShowcase | inherited from parts |

"Reduced" removes movement (translation, scale, parallax, scroll-linked motion, looping ambient animation). It keeps information (final states, colour changes, focus styles).

### A4. Capability tiers (WebGL items, pointer effects, SmoothScroll only)
| Tier | Renders | Assigned when |
|---|---|---|
| T0 Static | Server state only | Reduced motion; no WebGL2; budget full; context lost; frame guard gave up; Save-Data |
| T1 Lite | DOM motion; WebGL → poster; no pointer effects | Coarse pointer + low-end hint (`deviceMemory` ≤ 2 or ≤ 4 cores) |
| T2 Standard | WebGL at DPR ≤ 1.5, reduced octaves/strand/particle counts (or 0.75 render scale where applicable; bloom falls back if frame budget fails) | Capable mobile (coarse pointer) without low-end hints; frame guard downgrades if slow |
| T3 Full | WebGL at DPR ≤ 2, full scale, pointer interaction | Fine pointer + hover, no downgrade hints |

Tiers only go down automatically (frame guard: sampling begins after a 1.5–2.0 s warm-up to bypass initial hydration, scene assembly, and shader compilation jank; demotes one step down when the p75 frame time of a 2 s window exceeds 25 ms, which a transient input/wheel spike cannot do; the guard re-arms, with a new warm-up, on every rung; on capable hardware (tier 3) it stops at T1 and never goes to the poster by itself). Developers cap with `maxTier`. Testing override: `data-fb-tier="0|1|2|3"` on `<html>`.

### A5. Posters and fallbacks
- WebGL posters are CSS gradients generated from the same colour props, same size as the canvas (no layout shift).
- Posters must look intentional at T0: review them in the docs tier switcher like any other state.
- Text over any animated or poster background uses the `scrim` prop to keep ≥ 4.5:1 contrast.

### A6. Interaction rules
- Pointer effects only under `(hover: hover) and (pointer: fine)` plus a first-touch check.
- Keep native semantics: `<button>`, `<a>`, `<img alt>`. Never replace them with `<div>`.
- Focus rings visible and never clipped by transforms.
- Continuous motion lasting > 5 s gets a pause control (runtime `pauseAll`).

### A7. Voice and copy guide (every demo speaks about Frictionborn)
1. **Brand**: *Frictionborn* itself. Demos talk about the library, its components, the bench, reduced motion, agents and the brand story: friction makes heat, heat a spark, the spark a fire, fire cools to ash. Speak as "Frictionborn" or "we", never as one person.
2. **Tone**: Calm, human, and understated. Write plain, concrete English without sales hype.
3. **No fake metrics**: Never invent fabricated telemetry, fake statistics, or synthetic measurements.
4. **No sci-fi jargon**: Eliminate developer/HUD tropes like "Quantum Matrix", "Telemetry 99.8%", or "Engine: GLSL".
5. **Clear intent**: Headings communicate real product utility and quiet craft (e.g. "Calm motion, struck from a single spark").
6. **Honest controls**: Status labels state actual runtime conditions ("Active", "Paused", "Reduced motion").
7. **Human actions**: CTAs use plain action verbs: "Browse components", "Read how it is tested", "Install".
8. **Readable body**: Paragraphs describe what a component does, how it behaves with reduced motion and on phones, in 2–3 sentences.
9. **No filler logos**: Do not invent fake client logos, partner grids, or fabricated corporate testimonials.
10. **Single ecosystem**: Every demo presents a facet of Frictionborn, so the demos read like one continuous catalog of the library.

### A8. Palettes
Every item that draws in colour takes `palette`: `"fire"` (default) | `"ice"` | `"neon"` | `"mono"` | `"custom"`. One token contract, no per-component colour hacks:

| Variable | Role | fire | ice | neon | mono |
|---|---|---|---|---|---|
| `--fb-heat-0` | coldest: deep background, unlit | `#1C1A18` | `#0A1220` | `#120A1F` | `#141414` |
| `--fb-heat-1` | dark glow | `#7A1D10` | `#14407A` | `#5B1A8C` | `#3A3A3A` |
| `--fb-heat-2` | the hot colour (accent) | `#E8590C` | `#3D8BFF` | `#FF2BD6` | `#8C8C8C` |
| `--fb-heat-3` | bright | `#FFB15C` | `#9CCBFF` | `#5CF2FF` | `#CFCFCF` |
| `--fb-heat-4` | white-hot | `#FFF4E0` | `#F0F8FF` | `#F4FFFE` | `#FFFFFF` |

- A preset sets the five variables on the item's root (`paletteVars(palette)` from `@frictionborn/runtime`). `custom` sets none: the item reads the five variables the page defines (on the item, a parent or `:root`); any variable left out falls back to `fire`.
- DOM parts use `var(--fb-heat-n)` in CSS. Canvas and WebGL code never get the variables as strings: `readPalette(el, palette)` resolves them to RGB first ([AGENTS.md](AGENTS.md) rule 9), and `paletteRamp` (from `@frictionborn/runtime/canvas`) turns them into a cold-to-white-hot ramp.
- `fire` on a canvas item is a blackbody ramp: coal, ember, flame, white-hot.
- Items whose colours come from the host's own tokens (text, scroll and layout items) keep them; `palette` applies only where an item draws colour of its own.
