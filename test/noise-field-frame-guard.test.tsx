// Original — Frictionborn Motion regression: NoiseField's GL runner registers exactly ONE frame guard
// @vitest-environment jsdom
//
// Two guards watch the same 2 s window and both fire onDowngrade, so one slow window dropped the tier by two steps
// (T3 -> T1, i.e. poster) while DESIGN A4 says "one step down per slow window".
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

const guard = vi.fn();
vi.mock("@frictionborn/runtime", async (orig) => ({ ...(await orig<any>()), useFrameGuard: (o: unknown) => guard(o) }));
vi.mock("@frictionborn/runtime/gl", () => ({
  createSurface: () => {
    throw new Error("no WebGL in jsdom");
  },
}));

import NoiseFieldGL from "../registry/items/noise-field/noise-field.gl";

describe("NoiseFieldGL frame guard", () => {
  it("registers one guard per render and forwards a single onDowngrade", () => {
    const onDowngrade = vi.fn();
    render(
      <NoiseFieldGL
        colors={[
          [0, 0, 0],
          [1, 0, 0],
          [0, 0, 1],
        ]}
        onDowngrade={onDowngrade}
      />,
    );
    expect(guard).toHaveBeenCalledTimes(1);
    guard.mock.calls[0][0].onDowngrade();
    expect(onDowngrade).toHaveBeenCalledTimes(1);
  });
});
