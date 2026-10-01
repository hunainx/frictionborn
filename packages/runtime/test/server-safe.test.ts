// @vitest-environment node
import { describe, it, expect } from "vitest";

describe("Runtime Server-Safety", () => {
  it("imports on the server without touching window or throwing", async () => {
    expect(typeof window).toBe("undefined");

    const runtime = await import("../src/index.js");

    expect(runtime).toBeDefined();
    expect(runtime.tokens).toBeDefined();
    expect(typeof runtime.useReducedMotion).toBe("function");
    expect(typeof runtime.useCapability).toBe("function");
    expect(typeof runtime.useHydrated).toBe("function");
    expect(typeof runtime.useInView).toBe("function");
    expect(typeof runtime.useFrame).toBe("function");
    expect(typeof runtime.useFrameGuard).toBe("function");
    expect(typeof runtime.glBudget).toBe("object");
    expect(typeof runtime.pauseAll).toBe("function");
    expect(typeof runtime.resumeAll).toBe("function");
    expect(typeof runtime.usePaused).toBe("function");
    expect(typeof runtime.MotionReadyScript).toBe("function");
  });

  it("glBudget returns null on server", async () => {
    const { glBudget } = await import("../src/index.js");
    const lease = glBudget.acquire({ id: "server-test" });
    expect(lease).toBeNull();
  });
});
