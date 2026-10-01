// Original — Frictionborn Motion WebGL context counter probe
export interface ContextStats {
  activeContexts: number;
  totalCreated: number;
  unplannedLosses: number;
  plannedLosses: number;
  restoredCount: number;
}

export class ContextCounterProbe {
  private active = new Set<WebGLRenderingContext | WebGL2RenderingContext>();
  private plannedLost = new WeakSet<WebGLRenderingContext | WebGL2RenderingContext>();
  private totalCreated = 0;
  private unplannedLosses = 0;
  private plannedLosses = 0;
  private restoredCount = 0;
  private isInstalled = false;

  public install(): void {
    if (this.isInstalled || typeof window === "undefined" || !HTMLCanvasElement) return;

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const self = this;

    HTMLCanvasElement.prototype.getContext = function (
      contextId: string,
      options?: any
    ): any {
      const ctx = originalGetContext.call(this, contextId, options);
      if (ctx && (contextId === "webgl" || contextId === "webgl2" || contextId === "experimental-webgl")) {
        const glCtx = ctx as WebGLRenderingContext | WebGL2RenderingContext;
        if (!self.active.has(glCtx)) {
          self.active.add(glCtx);
          self.totalCreated++;

          this.addEventListener(
            "webglcontextlost",
            (event: Event) => {
              if (self.plannedLost.has(glCtx)) {
                self.plannedLosses++;
              } else {
                self.unplannedLosses++;
              }
              self.active.delete(glCtx);
            },
            { passive: false }
          );

          this.addEventListener("webglcontextrestored", () => {
            self.active.add(glCtx);
            self.restoredCount++;
          });

          // Intercept WEBGL_lose_context extension to differentiate planned vs unplanned losses
          const origGetExt = glCtx.getExtension;
          glCtx.getExtension = function (name: string): any {
            const ext = origGetExt.call(this, name);
            if (ext && (name === "WEBGL_lose_context" || name === "WEBGL_lose_context")) {
              const origLose = ext.loseContext;
              ext.loseContext = function () {
                self.plannedLost.add(glCtx);
                return origLose.call(this);
              };
            }
            return ext;
          };
        }
      }
      return ctx;
    };

    this.isInstalled = true;
  }

  public getStats(): ContextStats {
    return {
      activeContexts: this.active.size,
      totalCreated: this.totalCreated,
      unplannedLosses: this.unplannedLosses,
      plannedLosses: this.plannedLosses,
      restoredCount: this.restoredCount,
    };
  }

  public reset(): void {
    this.active.clear();
    this.totalCreated = 0;
    this.unplannedLosses = 0;
    this.plannedLosses = 0;
    this.restoredCount = 0;
  }
}
