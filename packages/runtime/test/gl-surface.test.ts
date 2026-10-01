// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSurface } from "../src/gl/surface.js";

describe("createSurface (@frictionborn/runtime/gl)", () => {
  let mockGl: any;
  let canvas: HTMLCanvasElement;
  let loseContextMock: any;

  beforeEach(() => {
    canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    loseContextMock = {
      loseContext: vi.fn(),
      restoreContext: vi.fn(),
    };

    mockGl = {
      createVertexArray: vi.fn(() => ({})),
      createBuffer: vi.fn(() => ({})),
      bindVertexArray: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      viewport: vi.fn(),
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog: vi.fn(() => ""),
      deleteShader: vi.fn(),
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      bindAttribLocation: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getProgramInfoLog: vi.fn(() => ""),
      deleteProgram: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteVertexArray: vi.fn(),
      drawArrays: vi.fn(),
      getExtension: vi.fn((ext: string) => {
        if (ext === "WEBGL_lose_context") return loseContextMock;
        return null;
      }),
      TRIANGLES: 4,
      STATIC_DRAW: 35044,
      ARRAY_BUFFER: 34962,
      FLOAT: 5126,
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714,
    };

    vi.spyOn(canvas, "getContext").mockImplementation((type: string) => {
      if (type === "webgl2") return mockGl;
      return null;
    });

    Object.defineProperty(window, "devicePixelRatio", {
      value: 2.5,
      configurable: true,
      writable: true,
    });
  });

  it("clamps DPR to maxDpr", () => {
    const surface = createSurface(canvas, { maxDpr: 1.5 });
    // canvas 800 * 1.5 = 1200, 600 * 1.5 = 900
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(900);
    surface.dispose();
  });

  it("clamps canvas dimensions to iOS 8192 area limit", () => {
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 10000,
      height: 10000,
      top: 0,
      left: 0,
      bottom: 10000,
      right: 10000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const surface = createSurface(canvas, { maxDpr: 1 });
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(8192 * 8192);
    surface.dispose();
  });

  it("formats shader compilation errors with line numbers", () => {
    mockGl.createShader.mockImplementation((type: number) => ({ type }));
    mockGl.getShaderParameter.mockImplementation((shader: any, param: number) => {
      if (param === mockGl.COMPILE_STATUS) {
        return shader.type !== mockGl.FRAGMENT_SHADER;
      }
      return true;
    });
    mockGl.getShaderInfoLog.mockReturnValue("Syntax error on line 3");

    const surface = createSurface(canvas);
    expect(() => {
      surface.createProgram(
        "void main() {}",
        "#version 300 es\nprecision mediump float;\nbad_code;"
      );
    }).toThrowError(/Shader compile error:\nSyntax error on line 3\nSource:\n\s*1 \| #version 300 es\n\s*2 \| precision mediump float;\n\s*3 \| bad_code;/);

    surface.dispose();
  });

  it("handles webglcontextlost and webglcontextrestored cleanly", () => {
    let lostCalled = false;
    let restoredCalled = false;

    const surface = createSurface(canvas, {
      onContextLost: (e) => {
        lostCalled = true;
        expect(e.defaultPrevented).toBe(true);
      },
      onContextRestored: () => {
        restoredCalled = true;
      },
    });

    // Dispatch context lost
    const lostEvent = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(lostEvent);
    expect(lostCalled).toBe(true);

    // Dispatch context restored
    const restoredEvent = new Event("webglcontextrestored");
    canvas.dispatchEvent(restoredEvent);
    expect(restoredCalled).toBe(true);

    surface.dispose();
  });

  it("disposes resources and triggers WEBGL_lose_context", () => {
    const surface = createSurface(canvas);
    surface.dispose();

    expect(mockGl.deleteBuffer).toHaveBeenCalled();
    expect(mockGl.deleteVertexArray).toHaveBeenCalled();
    expect(loseContextMock.loseContext).toHaveBeenCalled();
  });
});
