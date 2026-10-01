# TESTING.md — the bench and what "passing" means

## 1. Principle
Measure **behaviour and resource accounting** exactly; report timings only as **buckets**; never publish numbers the bench can't reproduce.

## 2. Probes (injected into every page before app scripts — `bench/probes`)
| Probe | Mechanism | Produces |
|---|---|---|
| Frame counter | wraps `requestAnimationFrame` | frames/s when idle, off-screen, hidden tab, reduced motion |
| Context counter | wraps `getContext('webgl'|'webgl2')`, listens `webglcontextlost`, tracks `WEBGL_lose_context` | live contexts over time; unplanned losses |
| Listener counter | wraps add/removeEventListener on window, document, elements | pointer listeners on touch; leaks |
| Animation probe | `document.getAnimations()` by state and property | reduced-motion and off-screen correctness |
| Layout shift | `PerformanceObserver('layout-shift')` | CLS |
| LCP | `PerformanceObserver('largest-contentful-paint')` | LCP element and time |
| Long tasks | `PerformanceObserver('longtask')` | blocking time |
| Event timing | `PerformanceObserver('event')` | interaction latency |

## 3. Checks per item
| Check | Method | Trust | Pass rule |
|---|---|---|---|
| Size (initial / deferred) | esbuild + gzip -9; size-limit | exact | within item budget |
| New dependencies | `package.json` diff after `shadcn add` | exact | matches declared list |
| WebGL contexts | context counter | exact | ≤ declared; 0 unplanned losses |
| Idle frames | frame counter, 2 s after settle | exact | 0 off-screen / hidden / reduced motion |
| Reduced motion | animation probe + frames + screenshot vs static reference | exact | matches declared mode |
| Server output | fetch HTML with JS disabled | exact | poster / text present and visible |
| Leaks | mount/unmount × 50 | exact | 0 contexts, observers, listeners left |
| Context loss | `loseContext()` → `restoreContext()` | exact | poster shown, then recovers |
| Accessibility | axe-core + `ariaSnapshot` | exact | 0 serious/critical; text preserved |
| CLS | layout-shift observer (self-hosted fonts) | near-exact | ≤ 0.01 per item |
| Init / blocking time | Chromium trace, 4× CPU throttle, median of 5 | noisy | bucket < 50 ms (WebGL items < 100 ms) |
| Interaction latency | event timing, median of 20 | noisy | bucket < 50 ms |
| LCP delta vs static | median of 5 | noisy | ≤ 100 ms |

**Not measured:** FPS or GPU load in CI (SwiftShader is software), CPU %, GPU memory, heap MB, battery.

Headless WebGL flags: `--use-angle=swiftshader --enable-unsafe-swiftshader`. WebGL items expose `paused` and `time` props so screenshots are deterministic; use `page.clock` for rAF.

## 4. Environments
**Every PR (Playwright):** Chromium desktop 1440×900 · Chromium mobile emulation 390×844 DPR 3 touch, 4× CPU throttle · WebKit desktop + mobile emulation · Firefox desktop · each with `emulateMedia({ reducedMotion: 'reduce' })`.

**Before each release and every WebGL change (real devices, BrowserStack OSS plan + own phone):**
1. Desktop Chrome (Windows 11 or macOS)
2. Desktop Safari 26 (macOS 26)
3. Desktop Safari 18 (macOS 15) — scroll-timeline fallback
4. Recent iPhone, iOS 26, Safari
5. Mid-range Android (Galaxy A5x) — Chrome **and** Samsung Internet
6. Low-end Android (Galaxy A1x / Moto G class) — Chrome
7. Own phone with OS reduced-motion setting on

Per device: auto tier shown; fallback looks deliberate (screenshot); 10 s on-device frame-time sample without guard downgrade; touch behaviour; orientation/toolbar changes; 20-canvas stress page (devices 4–6); reduced motion. Record `pass` / `degraded-as-designed` / `fail` with date in `measured.devices`.

## 5. CI gates (all must be green to merge)
`pnpm lint` (incl. provenance + CSS rule: no hidden state outside `[data-motion="ok"]`) · `pnpm test` · `pnpm size` · `pnpm bench` · `pnpm meta` (schema valid, no hand-written measured fields, no declared-vs-measured contradictions) · licence scan · jscpd similarity scan.
