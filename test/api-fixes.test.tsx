// Original — audit M4: API conventions that had no behavioural test (docs/API-CONVENTIONS.md, Decision 30).
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { Marquee } from "../registry/items/marquee/marquee";
import { SmoothScroll } from "../registry/items/smooth-scroll/smooth-scroll";

afterEach(() => {
  cleanup();
});

describe("Marquee.speed is a unitless multiplier of pixelsPerSecond (Decision 30)", () => {
  const durationFor = (props: Record<string, number>) => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => 4000 });
    try {
      const { container } = render(
        <Marquee {...props}>
          <span>a</span>
        </Marquee>
      );
      const wrap = container.querySelector("[data-pause-hover]") as HTMLElement;
      return wrap.style.getPropertyValue("--fb-mq-dur");
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, "scrollWidth", original);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollWidth;
    }
  };

  it("defaults to 40 px/s", () => expect(durationFor({})).toBe("100s"));
  it("pixelsPerSecond sets the rate", () => expect(durationFor({ pixelsPerSecond: 100 })).toBe("40s"));
  it("speed multiplies it: speed 2 at 100 px/s is 200 px/s", () => expect(durationFor({ pixelsPerSecond: 100, speed: 2 })).toBe("20s"));
  it("speed alone is a multiplier of the default, not px/s", () => expect(durationFor({ speed: 2 })).toBe("50s"));
});

describe("SmoothScroll keeps its own display:contents when the consumer passes style", () => {
  it("merges the consumer style instead of replacing it", () => {
    const { container } = render(
      <SmoothScroll style={{ color: "red" }} data-testid="ss">
        <div>x</div>
      </SmoothScroll>
    );
    const el = container.querySelector("[data-testid='ss']") as HTMLElement;
    expect(el.style.display).toBe("contents");
    expect(el.style.color).toBe("red");
  });
});
