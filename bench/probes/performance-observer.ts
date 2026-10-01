// Original — Frictionborn Motion performance observer probe
export interface PerformanceStats {
  cls: number;
  lcp: number;
  lcpElement: string | null;
  totalBlockingTime: number;
  longTasksCount: number;
  maxInteractionLatency: number;
}

export class PerformanceObserverProbe {
  private cls = 0;
  private lcp = 0;
  private lcpElement: string | null = null;
  private totalBlockingTime = 0;
  private longTasksCount = 0;
  private maxInteractionLatency = 0;
  private isInstalled = false;

  public install(): void {
    if (this.isInstalled || typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    // 1. Layout Shift (CLS)
    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.cls += (entry as any).value || 0;
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      // unsupported in some browsers
    }

    // 2. Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          this.lcp = lastEntry.startTime;
          this.lcpElement = lastEntry.element?.tagName || null;
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // unsupported
    }

    // 3. Long tasks (TBT)
    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const duration = entry.duration;
          if (duration > 50) {
            this.longTasksCount++;
            this.totalBlockingTime += duration - 50;
          }
        }
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });
    } catch {
      // unsupported
    }

    // 4. Event Timing (interaction latency)
    try {
      const eventObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const latency = entry.duration;
          if (latency > this.maxInteractionLatency) {
            this.maxInteractionLatency = latency;
          }
        }
      });
      eventObserver.observe({ type: "event", buffered: true } as any);
    } catch {
      // unsupported
    }

    this.isInstalled = true;
  }

  public getStats(): PerformanceStats {
    return {
      cls: Number(this.cls.toFixed(4)),
      lcp: Math.round(this.lcp),
      lcpElement: this.lcpElement,
      totalBlockingTime: Math.round(this.totalBlockingTime),
      longTasksCount: this.longTasksCount,
      maxInteractionLatency: Math.round(this.maxInteractionLatency),
    };
  }

  public reset(): void {
    this.cls = 0;
    this.lcp = 0;
    this.lcpElement = null;
    this.totalBlockingTime = 0;
    this.longTasksCount = 0;
    this.maxInteractionLatency = 0;
  }
}
