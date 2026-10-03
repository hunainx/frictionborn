// Original — Frictionborn Motion resolveCssColor (host tokens -> sRGB)

let scratchCanvas: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;

/**
 * Resolve any CSS colour (`var(--token, fallback)`, oklch(), lab(), system colours) to sRGB [0..1].
 * Canvas 2D cannot parse `var()`, so the value is first computed on a probe element inside `element`
 * (which sees the host's tokens), then normalised through a shared 1x1 canvas. Returns null on failure.
 */
export function resolveCssColor(element: Element | null, spec: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  try {
    let computed = spec;
    if (element) {
      const probe = document.createElement("span");
      probe.style.color = spec;
      probe.style.display = "none";
      element.appendChild(probe);
      computed = getComputedStyle(probe).color;
      probe.remove();
    }
    if (!scratchCanvas) {
      scratchCanvas = document.createElement("canvas");
      scratchCanvas.width = 1;
      scratchCanvas.height = 1;
      scratchCtx = scratchCanvas.getContext("2d", { willReadFrequently: true });
    }
    if (!scratchCtx) return null;
    scratchCtx.clearRect(0, 0, 1, 1);
    scratchCtx.fillStyle = computed;
    scratchCtx.fillRect(0, 0, 1, 1);
    const d = scratchCtx.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  } catch {
    return null;
  }
}
