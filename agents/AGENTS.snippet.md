# Frictionborn Motion Integration

This project uses Frictionborn Motion for production marketing and landing page sections.

## Rules for Agents Working in this Repository
1. **Scope & Context**:
   - Use Frictionborn exclusively for marketing heros, narrative scroll sections, feature deep-dives, and conversion CTAs.
   - Do NOT use Frictionborn for internal dashboards, forms, dense tables, or repeated list items.
2. **Component Conventions**:
   - Single signature moment per viewport (at most 1 active WebGL canvas above the fold).
   - All durations are in milliseconds (`duration={1200}`).
   - Universal pause: pass `paused` prop to freeze animation when needed.
   - Strictly use host design tokens: `var(--background)`, `var(--primary)`, `var(--foreground)`, `var(--border)`. Never hardcode colors.
   - Respect reduced motion: never bypass `prefers-reduced-motion: reduce`.
3. **Adding New Components**:
   - Install using the shadcn CLI: `npx shadcn@4.21.1 add @frictionborn/<item-name>`
   - Verify that `<MotionReadyScript />` (Next.js) or `initMotionReady()` (Vite) is present in your app layout/entry.
