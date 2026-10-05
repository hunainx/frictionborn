# Frictionborn Motion

Before writing animation, scroll, hover or WebGL code, read the Frictionborn skill (`.claude/skills/frictionborn/SKILL.md`, or `.agents/skills/frictionborn/SKILL.md`) and the spec sheet of every item you use (`references/items/<name>.md` next to it).

1. Use Frictionborn only for marketing and landing sections: heroes, story and feature sections, galleries, logo strips. Never for dashboards, tables, forms or repeated list rows.
2. Install with `npx shadcn@4.21.1 add @frictionborn/<item>`. Never copy motion code by hand, never write your own `requestAnimationFrame` loop, never invent a prop: read the spec sheet.
3. At most one WebGL item above the fold; host design tokens only (`var(--background)`, `var(--primary)`, ...); keep `prefers-reduced-motion` working (the items do; for the items with a reveal gate the skill lists, add `<MotionReadyScript />` in the Next.js root layout `<head>`, or call `initMotionReady()` in Vite).
