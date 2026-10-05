# Content Security Policy (CSP) Guide

Frictionborn items and `@frictionborn/runtime` are designed to operate under strict Content Security Policies without requiring `'unsafe-inline'` or `'unsafe-eval'`.

---

## 1. MotionReadyScript and Script Hashes

Frictionborn provides an inline hydration-independent motion detection script via `MotionReadyScript` or `initMotionReady()`.

The script checks `(prefers-reduced-motion: reduce)` before paint and sets `data-motion="ok"` on `<html>`. Its exact SHA-256 hash is exported as a constant from `@frictionborn/runtime`:

```ts
import { MOTION_READY_SCRIPT_HASH } from "@frictionborn/runtime";
// 'sha256-0rCKN4IxkW0L6T5owlXyjvucXpltGt0wY4vp1j8aAHc='
```

### Allowing via Hash in `script-src`
Add the hash directly to your `script-src` directive:
```http
script-src 'self' 'sha256-0rCKN4IxkW0L6T5owlXyjvucXpltGt0wY4vp1j8aAHc=';
```

### Allowing via Nonce
If your framework generates cryptographic nonces per request (recommended in SSR):
```tsx
import { MotionReadyScript } from "@frictionborn/runtime";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = getCspNonce(); // framework-specific
  return (
    <html lang="en">
      <head>
        <MotionReadyScript nonce={nonce} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 2. Items with Scoped `<style>` Elements

Four Frictionborn items embed scoped CSS to guarantee zero layout shift (CLS) before external stylesheets load:
1. `TextReveal`
2. `ScrollReveal`
3. `Marquee`
4. `StickyScrollStory`

Each of these items accepts an optional `nonce?: string` prop that is forwarded directly to the rendered `<style>` element:

```tsx
<TextReveal nonce={nonce} as="h1">
  Acoustic precision, sculpted in aluminum.
</TextReveal>

<Marquee nonce={nonce} pixelsPerSecond={40}>
  <span>Abbey Road</span>
  <span>Electric Lady</span>
</Marquee>
```

When using a nonce-based `style-src` CSP:
```http
style-src 'self' 'nonce-{RANDOM_NONCE}';
```
passing the nonce allows these styles to execute cleanly.

---

## 3. WebGL Canvas Requirements

WebGL items (`NoiseField`, `MeshGradient`, `ParticleField`, `DistortionImage`) use WebGL2 shaders compiled at runtime.
WebGL shader compilation (`gl.compileShader`, `gl.linkProgram`) operates via WebGL native APIs and **does not** require `'unsafe-eval'`.

---

## 4. Production Example Policies

### Next.js Strict CSP (App Router Middleware)

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MOTION_READY_SCRIPT_HASH } from "@frictionborn/runtime";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' '${MOTION_READY_SCRIPT_HASH}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
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
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", cspHeader);
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

### Vite / Static SPA Strict CSP

In a statically hosted SPA (such as Vite + Nginx/Cloudflare):

```html
<!-- index.html -->
<head>
  <meta
    http-equiv="Content-Security-Policy"
    content="
      default-src 'self';
      script-src 'self' 'sha256-0rCKN4IxkW0L6T5owlXyjvucXpltGt0wY4vp1j8aAHc=';
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
*(Note: Static SPAs without request-level nonces typically allow `'unsafe-inline'` for CSS or extract styles at build time. When static stylesheets are preferred, import CSS from your bundler).*
