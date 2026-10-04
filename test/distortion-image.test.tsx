// Original — Frictionborn Motion DistortionImage unit tests
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, act, fireEvent } from "@testing-library/react";
import { DistortionImage } from "../registry/items/distortion-image/distortion-image";

describe("DistortionImage Component", () => {
  beforeEach(() => {
    if (typeof global.ResizeObserver === "undefined") {
      global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
    }

    if (typeof HTMLImageElement.prototype.decode === "undefined") {
      HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);
    }

    window.matchMedia = ((query: string) => ({
      matches: query.includes("(pointer: fine)"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    })) as any;
  });

  it("renders real <img> element defining layout with 0 CLS semantics", () => {
    const { container, unmount } = render(
      <DistortionImage
        src="/assets/distortion/art-1.webp"
        alt="Wheat Field with Cypresses"
        width={600}
        height={400}
      />
    );

    const wrapper = container.querySelector("[data-frictionborn-item='distortion-image']");
    expect(wrapper).not.toBeNull();
    // Wrapper is not focusable per Decision 24 (no tabIndex=0)
    expect(wrapper?.getAttribute("tabindex")).toBeNull();

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/assets/distortion/art-1.webp");
    expect(img?.getAttribute("alt")).toBe("Wheat Field with Cypresses");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("decoding")).toBe("async");

    unmount();
  });

  it("preserves accessible alt text and forwards custom imgClassName", () => {
    const { container, unmount } = render(
      <DistortionImage
        src="/assets/distortion/art-2.webp"
        alt="Irises by Vincent van Gogh"
        imgClassName="custom-gallery-img"
        loading="eager"
      />
    );

    const img = container.querySelector("img");
    expect(img?.className).toContain("custom-gallery-img");
    expect(img?.getAttribute("alt")).toBe("Irises by Vincent van Gogh");
    expect(img?.getAttribute("loading")).toBe("eager");

    unmount();
  });

  it("supports focus and blur keyboard events for accessibility on linked images", async () => {
    const { container, unmount } = render(
      <a href="#test" data-testid="outer-link">
        <DistortionImage
          src="/assets/distortion/art-3.webp"
          alt="Cypresses"
        />
      </a>
    );

    const link = container.querySelector("[data-testid='outer-link']") as HTMLAnchorElement;
    expect(link).not.toBeNull();

    await act(async () => {
      fireEvent.focus(link);
    });

    await act(async () => {
      fireEvent.blur(link);
    });

    unmount();
  });

  it("falls back to plain image with 0 WebGL canvases when pointer is touch / coarse", async () => {
    // Mock coarse pointer media query (e.g. mobile touchscreen)
    window.matchMedia = ((query: string) => ({
      matches: query.includes("(pointer: coarse)"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    })) as any;

    const { container, unmount } = render(
      <DistortionImage
        src="/assets/distortion/art-4.webp"
        alt="The Great Wave"
      />
    );

    const wrapper = container.querySelector("[data-frictionborn-item='distortion-image']") as HTMLDivElement;

    // Simulate touch pointer interaction
    await act(async () => {
      fireEvent.pointerEnter(wrapper, { pointerType: "touch" });
      fireEvent.pointerMove(wrapper, { pointerType: "touch", clientX: 50, clientY: 50 });
    });

    // Verify no WebGL canvas is injected
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeNull();

    // Verify real img is still present and fully intact
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("The Great Wave");

    unmount();
  });
});
