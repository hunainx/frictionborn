// Original — Frictionborn Motion
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { glBudget } from "../src/gl-budget.js";

describe("glBudget", () => {
  beforeEach(() => {
    glBudget.releaseAll();
    // Default mock for fine pointer
    window.matchMedia = (query: string) => ({
      matches: query.includes("pointer: fine"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any);
  });

  it("allows up to 4 contexts on fine pointer", () => {
    const l1 = glBudget.acquire({ id: "c1", priority: 1 });
    const l2 = glBudget.acquire({ id: "c2", priority: 1 });
    const l3 = glBudget.acquire({ id: "c3", priority: 1 });
    const l4 = glBudget.acquire({ id: "c4", priority: 1 });

    expect(l1).not.toBeNull();
    expect(l2).not.toBeNull();
    expect(l3).not.toBeNull();
    expect(l4).not.toBeNull();
    expect(glBudget.getActiveCount()).toBe(4);

    // 5th acquisition without eviction returns null
    const l5 = glBudget.acquire({ id: "c5", priority: 1 });
    expect(l5).toBeNull();
  });

  it("evicts lower priority or offscreen lease when full", () => {
    let evicted = false;
    glBudget.acquire({ id: "low", priority: 0, onEvict: () => { evicted = true; } });
    glBudget.acquire({ id: "p1", priority: 1 });
    glBudget.acquire({ id: "p2", priority: 1 });
    glBudget.acquire({ id: "p3", priority: 1 });

    expect(glBudget.getActiveCount()).toBe(4);

    const high = glBudget.acquire({ id: "high", priority: 2 });
    expect(high).not.toBeNull();
    expect(evicted).toBe(true);
    expect(glBudget.getLease("low")).toBeUndefined();
    expect(glBudget.getLease("high")).toBeDefined();
  });

  it("releases lease cleanly", () => {
    const l1 = glBudget.acquire({ id: "rel-test", priority: 1 });
    expect(glBudget.getActiveCount()).toBe(1);
    l1?.release();
    expect(glBudget.getActiveCount()).toBe(0);
  });
});
