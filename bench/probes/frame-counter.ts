// Original — Frictionborn Motion frame counter probe
export interface FrameCounterStats {
  totalFrames: number;
  offscreenFrames: number;
  hiddenTabFrames: number;
  reducedMotionFrames: number;
  fps: number;
}

export class FrameCounterProbe {
  private totalFrames = 0;
  private offscreenFrames = 0;
  private hiddenTabFrames = 0;
  private reducedMotionFrames = 0;
  private startTime = performance.now();
  private originalRaf: typeof window.requestAnimationFrame | null = null;
  private isInstalled = false;

  public install(): void {
    if (this.isInstalled || typeof window === "undefined") return;
    this.originalRaf = window.requestAnimationFrame.bind(window);

    const self = this;
    window.requestAnimationFrame = function (callback: FrameRequestCallback): number {
      self.totalFrames++;

      const isHidden = document.visibilityState === "hidden";
      if (isHidden) {
        self.hiddenTabFrames++;
      }

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        self.reducedMotionFrames++;
      }

      // Check if tracked motion elements are offscreen
      const items = document.querySelectorAll("[data-frictionborn-item]");
      if (items.length > 0) {
        let allOffscreen = true;
        for (const el of Array.from(items)) {
          const rect = el.getBoundingClientRect();
          const inView =
            rect.bottom > 0 &&
            rect.top < window.innerHeight &&
            rect.right > 0 &&
            rect.left < window.innerWidth;
          if (inView) {
            allOffscreen = false;
            break;
          }
        }
        if (allOffscreen) {
          self.offscreenFrames++;
        }
      }

      return self.originalRaf!(callback);
    };

    this.isInstalled = true;
  }

  public getStats(): FrameCounterStats {
    const elapsedSeconds = Math.max((performance.now() - this.startTime) / 1000, 0.001);
    return {
      totalFrames: this.totalFrames,
      offscreenFrames: this.offscreenFrames,
      hiddenTabFrames: this.hiddenTabFrames,
      reducedMotionFrames: this.reducedMotionFrames,
      fps: Math.round(this.totalFrames / elapsedSeconds),
    };
  }

  public reset(): void {
    this.totalFrames = 0;
    this.offscreenFrames = 0;
    this.hiddenTabFrames = 0;
    this.reducedMotionFrames = 0;
    this.startTime = performance.now();
  }
}
