# Content Security Policy (CSP) Guide

Frictionborn items and `@frictionborn/runtime` work under a strict Content Security Policy: no `'unsafe-eval'`, and no `'unsafe-inline'` for scripts or `<style>` elements.

Two things need a decision from you, because no nonce can cover them:

- **Inline `style="…"` attributes.** The items set positions, sizes and CSS variables through React `style` props, so server HTML contains `style` attributes. A nonce or hash cannot be attached to an attribute. Allow them with `style-src-attr 'unsafe-inline'`. This does not allow `<style>` elements or `javascript:` URLs; it is the usual setting for React apps.
- **`<style>` elements.** Four items render one (TextReveal, ScrollReveal, Marquee, StickyScrollStory). Give them your nonce (below) or allow their hashes.

Both example policies on this page were run against a fresh Next 16.3.8 app and a fresh Vite app, with every item installed from the registry, in Chromium: 0 `securitypolicyviolation` events and 0 console errors on the Frictionborn code (the audit's own cross-origin test image is the only thing blocked, by design).

---

## 1. MotionReadyScript and script hashes

`MotionReadyScript` (Next.js) renders one inline script. It checks `(prefers-reduced-motion: reduce)` before paint and sets `data-motion="ok"` on `<html>`. Its SHA-256 hash is exported from `@frictionborn/runtime`; the constant is the bare `sha256-…` token, **without** the quotes CSP needs, and it matches the bytes of the inline script (a test compares them):

```ts
import { MOTION_READY_SCRIPT_HASH } from "@frictionborn/runtime";
// "sha256-0rCKN4IxkW0L6T5owlXyjvucXpltGt0wY4vp1j8aAHc="  (add the single quotes yourself)
```

Vite and other SPAs call `initMotionReady()` from JavaScript instead; there is no inline script, so no hash is needed.

Allow it with the hash, or with a nonce (`<MotionReadyScript nonce={nonce} />`). With a nonce-based `'strict-dynamic'` policy the nonce is enough.

---

## 2. Items with a scoped `<style>` element, and the compositions

TextReveal, ScrollReveal, Marquee and StickyScrollStory accept `nonce?: string`, forwarded to their `<style>` element. `AmbientHero` and `ScrollShowcase` accept `nonce` too and pass it to the items they render, so one prop covers a whole section.

ScrollReveal renders its `<style>` once per instance (React drops the nonce from de-duplicated, hoisted `<style>` elements on the server, so the shared form is not an option under a nonce CSP). A page with many reveals carries that small stylesheet many times.

```tsx
<AmbientHero nonce={nonce} headline="…" body="…" primaryCta={{ label: "…", href: "/…" }} />
<TextReveal nonce={nonce} as="h2">…</TextReveal>
```

Client components cannot read the request headers. Read the nonce in a Server Component and pass it down as a prop (the Next.js example below).

---

## 3. WebGL

`NoiseField`, `MeshGradient`, `ParticleField` and `DistortionImage` compile shaders with the WebGL API. That needs neither `'unsafe-eval'` nor `'unsafe-inline'`. Images are loaded from `img-src` (add your image origins; `blob:` and `data:` are used by DistortionImage's texture upload).

---

## 4. Production example policies

### Next.js 16 (App Router): `proxy.ts`

Next 16 renamed the `middleware.ts` file convention to `proxy.ts` (`export function proxy`). `middleware.ts` still runs but prints a deprecation warning, so use `proxy.ts`.

```ts
// proxy.ts (project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MOTION_READY_SCRIPT_HASH } from "@frictionborn/runtime";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' '${MOTION_READY_SCRIPT_HASH}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    style-src-attr 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
```

Pages must render per request to receive a nonce, so read the header in the root layout (this opts the route into dynamic rendering) and hand the nonce to the Frictionborn pieces:

```tsx
// app/layout.tsx
import { headers } from "next/headers";
import { MotionReadyScript } from "@frictionborn/runtime";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en">
      <head><MotionReadyScript nonce={nonce} /></head>
      <body>{children}</body>
    </html>
  );
}

// app/page.tsx (Server Component): read it again and pass it to the client components
import { headers } from "next/headers";
import Landing from "./landing"; // "use client" file that renders <AmbientHero nonce={nonce} … />

export default async function Page() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <Landing nonce={nonce} />;
}
```

### Vite / static SPA

A statically hosted SPA has no per-request nonce, so styles are allowed inline (a hash per `<style>` is the strict alternative). There is no inline script: `initMotionReady()` runs from your bundle, so `script-src 'self'` is enough.

```html
<!-- index.html -->
<head>
  <meta
    http-equiv="Content-Security-Policy"
    content="
      default-src 'self';
      script-src 'self';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
      font-src 'self';
      connect-src 'self';
      base-uri 'self';
      form-action 'self';
    "
  />
</head>
```

This policy allows `'unsafe-inline'` for styles. It still blocks inline scripts and `eval`.
