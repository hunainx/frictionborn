// Original — Frictionborn Motion EmberCore unit tests
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import React, { createRef } from "react";
import fs from "node:fs";
import path from "node:path";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { pauseAll, resumeAll } from "@frictionborn/runtime";
import { EmberCore } from "../registry/items/ember-core/ember-core";
import EmberCoreGL from "../registry/items/ember-core/ember-core.gl";

afterEach(() => {
  resumeAll();
  cleanup();
});

describe("EmberCore (#25)", () => {
  it("renders hero mode by default with CSS poster, Strike button, hint copy, ref forwarding, and CSP nonce", () => {
    const ref = createRef<HTMLDivElement>();
    const { container, getByRole } = render(
      <EmberCore ref={ref} nonce="ec-nonce-1" data-testid="ec-hero">
        <h1>We build what others call impossible.</h1>
      </EmberCore>
    );

    const root = container.querySelector('[data-testid="ec-hero"]');
    expect(root).not.toBeNull();
    expect(ref.current).toBe(root);
    expect(root?.getAttribute("data-frictionborn-item")).toBe("ember-core");
    expect(root?.getAttribute("data-interactive")).toBe("hero");

    const poster = container.querySelector('[data-frictionborn-poster="true"]');
    expect(poster).not.toBeNull();

    const styleTag = container.querySelector("style");
    expect(styleTag?.getAttribute("nonce")).toBe("ec-nonce-1");

    const strikeBtn = getByRole("button", { name: "Strike" });
    expect(strikeBtn.tagName).toBe("BUTTON");
    expect(container.textContent).toContain("Move to stir · Click to strike");
    expect(container.textContent).toContain("Tap to strike");
  });

  it("renders full mode with Controls panel, native sliders (Heat, Swirl, Spin, Ash density), palette chips, Sound, Glow and Reset buttons", () => {
    const { container, getByRole, getByLabelText } = render(
      <EmberCore interactive="full" palette="fire" />
    );

    const controlsBtn = getByRole("button", { name: "Controls" });
    expect(controlsBtn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(controlsBtn);
    expect(controlsBtn.getAttribute("aria-expanded")).toBe("true");

    const heatSlider = getByLabelText("Heat") as HTMLInputElement;
    const swirlSlider = getByLabelText("Swirl") as HTMLInputElement;
    const spinSlider = getByLabelText("Spin") as HTMLInputElement;
    const densitySlider = getByLabelText("Ash density") as HTMLInputElement;

    expect(heatSlider.type).toBe("range");
    expect(swirlSlider.type).toBe("range");
    expect(spinSlider.type).toBe("range");
    expect(densitySlider.type).toBe("range");

    fireEvent.change(heatSlider, { target: { value: "1.5" } });
    expect(heatSlider.value).toBe("1.5");

    const iceChip = getByRole("button", { name: "Ice" });
    fireEvent.click(iceChip);
    expect(iceChip.getAttribute("aria-pressed")).toBe("true");

    const glowBtn = getByRole("button", { name: /Glow/i });
    expect(glowBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(glowBtn);
    expect(glowBtn.getAttribute("aria-pressed")).toBe("false");

    const soundBtn = getByRole("button", { name: /Sound/i });
    expect(soundBtn.getAttribute("aria-pressed")).toBe("false");

    const resetBtn = getByRole("button", { name: "Reset" });
    fireEvent.click(resetBtn);
    expect(heatSlider.value).toBe("1");
    expect(glowBtn.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Reset");
  });

  it("renders none mode without interactive buttons", () => {
    const { container } = render(<EmberCore interactive="none" />);
    expect(container.querySelectorAll("button").length).toBe(0);
  });

  it("includes the Ashima Arts / Stefan Gustavson MIT source header in ember-core.glsl.ts", () => {
    const glslPath = path.resolve(__dirname, "../registry/items/ember-core/ember-core.glsl.ts");
    const glsl = fs.readFileSync(glslPath, "utf8");
    expect(glsl).toMatch(/Source:.*webgl-noise/i);
    expect(glsl).toMatch(/Ashima Arts/i);
    expect(glsl).toMatch(/Stefan Gustavson/i);
    expect(glsl).toMatch(/MIT/);
  });

  it("uses @frictionborn/runtime useFrame with no direct requestAnimationFrame, <= 20 draw calls/frame, and 0 draw calls over 2 s after pauseAll()", async () => {
    const dir = path.resolve(__dirname, "../registry/items/ember-core");
    for (const file of ["ember-core.tsx", "ember-core.gl.tsx", "ember-core.glsl.ts"]) {
      const src = fs.readFileSync(path.join(dir, file), "utf8");
      expect(src).not.toMatch(/requestAnimationFrame/);
      expect(src).not.toMatch(/@react-three\/fiber/);
    }

    let drawCalls = 0;
    let renderedFrames = 0;
    let boundToScreen = true;
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    const mockGl = new Proxy(
      {
        FRAMEBUFFER_COMPLETE: 0x8cd5,
        COMPILE_STATUS: 0x8b81,
        LINK_STATUS: 0x8b82,
        drawingBufferWidth: 640,
        drawingBufferHeight: 360,
        isContextLost: () => false,
      },
      {
        get(target, prop) {
          if (prop in target) return target[prop as keyof typeof target];
          if (
            prop === "createShader" ||
            prop === "createProgram" ||
            prop === "createVertexArray" ||
            prop === "createBuffer" ||
            prop === "createTexture" ||
            prop === "createFramebuffer" ||
            prop === "getUniformLocation"
          ) {
            return () => ({});
          }
          if (prop === "getExtension") return () => ({ loseContext: () => {} });
          if (prop === "getShaderParameter" || prop === "getProgramParameter") return () => true;
          if (prop === "getAttribLocation") return () => 0;
          if (prop === "checkFramebufferStatus") return () => 0x8cd5;
          if (prop === "bindFramebuffer") {
            return (_target: number, fb: unknown) => {
              boundToScreen = fb === null;
            };
          }
          if (prop === "drawArrays") {
            return () => {
              drawCalls++;
              if (boundToScreen) renderedFrames++;
            };
          }
          if (prop === "drawArraysInstanced") {
            return () => {
              drawCalls++;
            };
          }
          return () => {};
        },
      }
    );

    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === "webgl2") return mockGl as unknown as RenderingContext;
      return null;
    } as typeof HTMLCanvasElement.prototype.getContext;

    try {
      drawCalls = 0;
      renderedFrames = 0;
      render(
        <EmberCoreGL
          colors={{
            ash: [0.35, 0.36, 0.42],
            ember: [0.95, 0.32, 0.07],
            hot: [1.0, 0.96, 0.85],
            gA: [1.0, 0.68, 0.16],
            gB: [0.92, 0.25, 0.04],
          }}
          interactive="hero"
          heat={1}
          swirl={1}
          spin={1}
          density={1}
          bloom={true}
          sound={false}
          paused={false}
          reducedMotion={false}
          suspended={false}
          tier={3}
          offsetX={0}
          lightTheme={false}
          strikeTrigger={0}
          resetTrigger={0}
          onToast={() => {}}
          onTogglePause={() => {}}
          onContextLost={() => {}}
          onContextRestored={() => {}}
          onDowngrade={() => {}}
        />
      );

      // Let shared runtime loop tick for ~120ms and verify draw calls per frame <= 20 (exactly 8 idle with bloom)
      drawCalls = 0;
      renderedFrames = 0;
      await new Promise((r) => setTimeout(r, 120));
      const activeCalls = drawCalls;
      const activeFrames = Math.max(1, renderedFrames);
      const callsPerFrame = activeCalls / activeFrames;
      expect(activeCalls).toBeGreaterThan(0);
      expect(callsPerFrame).toBeLessThanOrEqual(20);
      expect(Math.round(callsPerFrame)).toBe(8);

      // Pause shared runtime loop and assert 0 draw calls over 2,000 ms
      pauseAll();
      drawCalls = 0;
      await new Promise((r) => setTimeout(r, 2000));
      expect(drawCalls).toBe(0);

      // Resume and confirm loop ticks again
      resumeAll();
      await new Promise((r) => setTimeout(r, 80));
      expect(drawCalls).toBeGreaterThan(0);
    } finally {
      HTMLCanvasElement.prototype.getContext = origGetContext;
    }
  });
});

