// Original — audit M4: MOTION_READY_SCRIPT_HASH must be the SHA-256 of the exact bytes MotionReadyScript puts in the page,
// otherwise every strict-CSP site that copies the documented hash gets the script blocked (and no reduced-motion gate).
// @vitest-environment node
import { describe, it, expect } from "vitest";
import React from "react";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { MotionReadyScript, MOTION_READY_SCRIPT_HASH } from "../packages/runtime/src/motion-ready";

describe("MOTION_READY_SCRIPT_HASH", () => {
  const html = renderToStaticMarkup(React.createElement(MotionReadyScript, { nonce: "abc" }));
  const inner = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");

  it("is the SHA-256 (base64) of the inline script's exact bytes", () => {
    const computed = "sha256-" + createHash("sha256").update(inner, "utf8").digest("base64");
    expect(MOTION_READY_SCRIPT_HASH).toBe(computed);
  });

  it("is the bare token (no quotes: CSP needs them added) and the nonce prop is forwarded", () => {
    expect(MOTION_READY_SCRIPT_HASH).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/);
    expect(html).toContain('nonce="abc"');
  });
});
