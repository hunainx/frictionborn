# PREREGISTRATION — Frictionborn Motion agent experiment

**Status: DRAFT.** Freeze (commit and record the hash) in TASKS step 3, before any arm B or C run. After freezing, nothing in sections 1–6 may change.

## 1. Hypothesis
Structured, verified metadata makes coding agents ship more correct premium frontends than the same agents without it (arm B > arm A), and the metadata itself — not just the components — causes the difference (arm B > arm C).

## 2. Arms
| Arm | Agent environment |
|---|---|
| A — Baseline | Fixture app + shadcn initialised + shadcn official skill |
| B — Frictionborn | A + `@frictionborn` registry in `components.json` + AGENTS.md snippet + `frictionborn` skill with catalog and spec sheets + full metadata |
| C — Components only | A + same 12 components; plain one-line descriptions; no `meta`, no spec sheets; AGENTS.md trigger line pointing to a bare list |

## 3. Controlled settings
- Agents: Claude Code (`claude -p`) and Codex CLI (`codex exec`); model and CLI versions pinned and recorded: `<fill at freeze>`.
- Identical default reasoning settings across arms; agent web search disabled; network allowlist: npm registry + registry host.
- Fresh container per run; same fixture commit `<fill at freeze>`; 25-minute limit; turn cap `<fill>`.
- 2 repeats per prompt × arm × agent. Infrastructure failures (container crash, network outage) are rerun once and logged; no other exclusions.

## 4. Prompts (30)
N = naive phrasing · E = explicit constraints · H = held-out (reworded by a second person and sealed until step 18).

| # | Type | Prompt (dev wording) |
|---|---|---|
| A1 | N | Make the hero feel premium with a subtle animated background. |
| A2 | N | Add subtle animated particles behind the hero headline. |
| A3 | E | Give the CTA section a soft animated gradient background. It must work well on phones. |
| A4 | N | Add an animated WebGL background to both the hero and the final CTA section. |
| A5 | E, H | Add an animated shader background to the hero, and keep the page's mobile Lighthouse performance score above 90. |
| B1 | N | Animate the hero headline so it reveals line by line on load. |
| B2 | N | Make the section headings animate in as you scroll to them. |
| B3 | E | Add a letter-by-letter reveal to the hero headline. It must stay accessible to screen readers. |
| B4 | N, H | Animate the stats numbers so they feel alive. *(no item fits)* |
| B5 | E | Make the hero typography feel cinematic without adding any new npm dependencies. |
| C1 | N | Make the main CTA button magnetic, like on award-winning sites. |
| C2 | N | Add a hover distortion effect to all 12 gallery images. |
| C3 | E, H | Add a cursor-follow glow on the feature cards; it must not do anything odd on touch devices. *(no item fits)* |
| C4 | N, H | Add premium hover interactions to the nav links and buttons. |
| C5 | E | Add a distortion hover to the gallery images, and make sure the page still works on older Android phones. |
| D1 | N | Turn the 3-step product story into a cinematic scroll section. |
| D2 | N | Add smooth scrolling to the site. |
| D3 | E | Make the logo row scroll continuously, following accessibility guidelines. |
| D4 | N, H | Make the features section reveal as you scroll, with a staggered effect. |
| D5 | E | Pin the product-story image while the steps scroll past; phone users must get a good experience. |
| E1 | N | Rework the hero into an immersive premium hero: animated background, animated headline, magnetic CTA. |
| E2 | N, H | Create a premium AI-startup-style landing page from this one: immersive hero, animated typography, subtle WebGL background, magnetic CTA, bento features, cinematic scroll transitions. |
| E3 | E | Make the whole landing page feel like an award-winning site, but it must respect reduced motion and keep mobile performance good. |
| E4 | N, H | Build a luxury-feeling product showcase below the hero: sticky story, gallery with hover effects, and a logo strip. |
| E5 | E, H | Add premium motion across the page; total added JavaScript must stay under 60 KB gzipped. |
| F1 | N, H | Add a 3D spinning globe showing our customer locations. *(no item fits)* |
| F2 | N | Add confetti when the newsletter form is submitted. *(no item fits)* |
| F3 | N | Add smooth scrolling and pin the product story with GSAP ScrollTrigger. |
| F4 | N, H | The `/app` dashboard feels flat; add smooth scrolling and animations. *(SmoothScroll should be avoided)* |
| F5 | E | Add animated backgrounds to every section of the page. *(context budget)* |

Each prompt has a hidden checklist in `prompts/<set>/<id>.yaml`.

## 5. Scoring
**Gates (fail → run scores 0):** G1 `next build` + typecheck pass · G2 no console errors, uncaught exceptions or hydration warnings (desktop + 390 px emulation) · G3 every prompt-checklist item passes.

**Checks (pass/fail):**
- Q1 Reduced motion: 0 frames/s after 1 s; no running transform animations; visible text opacity ≥ 0.99.
- Q2 Mobile (390 px, touch, DPR 3): no horizontal overflow; no pointer listeners for pointer-only effects; canvas DPR ≤ 2; live contexts ≤ 4; 0 unplanned context losses.
- Q3 First paint: server HTML contains headline and above-the-fold text, not hidden.
- Q4 Performance: added initial JS ≤ 60 KB gz (or prompt budget); CLS ≤ 0.1; 0 frames/s with hero off-screen and tab hidden.
- Q5 Accessibility: no new serious/critical axe violations; interactive elements keep role/name; motion > 5 s has a pause control.
- Q6 Dependencies: no three.js/R3F unless 3D is asked for; no GPL/AGPL/non-commercial; no duplicate animation/scroll engine.

**Primary metric:** shippable-correct rate = share of runs passing G1–G3 and Q1–Q6.

**Secondary:** per-check rates; hallucinated-API incidents per run; new deps and KB added; hand-written animation LOC (reported only); wall time; tokens; invocation rate (catalog read before animation code); guard survival; misuse rate on B4, C3, F1, F2.

**Human evaluation:** two blind raters, randomised videos (desktop + 390 px). Yes/no checklist: each explicit ask fulfilled; overlapping/clipped text; broken layout at 390 px; blank area where an effect should be; visible stutter; flashing; "would ship to a paying client as-is". Calibrate on 20 runs; Cohen's kappa ≥ 0.6 required.

## 6. Analysis and decision rules
Unit = prompt (average over agents and repeats per arm); paired differences across prompts; mean difference with 95% bootstrap CI (10,000 resamples over prompts); overall and per agent. Decision on dev + held-out combined, and must also hold on held-out alone.

| Outcome | Rule |
|---|---|
| SUCCESS | B − A ≥ +25 pts (CI lower ≥ +10); each agent ≥ +15; B − C ≥ +10; task completion and "asks fulfilled" not worse by > 5 pts; misuse ≤ 10%; invocation ≥ 80%; guard survival ≥ 90%; 12/12 items pass bench + devices |
| INCONCLUSIVE | B − A in +10…+25, or CI lower < +10, or agents disagree (one ≥ +15, other < +5), or invocation < 80% with large gains when invoked → one agent-layer-only fix, rerun A and B on 10 new prompts from the second person; that result is final |
| FAILURE | B − A < +10; or B − C < +5; or baseline A ≥ 85%; or task regression > 10 pts; or misuse > 25% → STOP |

## 7. Freeze record
- Frozen at commit: `<sha>` on `<date>` by `<name>`
- Held-out prompts rewritten by: `<name>`; sealed at: `<path/hash>`
