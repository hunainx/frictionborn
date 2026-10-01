// Original — Frictionborn Motion listener counter probe
export interface ListenerStats {
  activeCount: number;
  byType: Record<string, number>;
  potentialLeaks: number;
}

export class ListenerCounterProbe {
  private listeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
  }> = [];
  private isInstalled = false;

  public install(): void {
    if (this.isInstalled || typeof window === "undefined") return;

    const self = this;
    const origAdd = EventTarget.prototype.addEventListener;
    const origRemove = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) {
      if (listener) {
        self.listeners.push({ target: this, type, listener });
      }
      return origAdd.call(this, type, listener as any, options);
    };

    EventTarget.prototype.removeEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions
    ) {
      if (listener) {
        const idx = self.listeners.findIndex(
          (l) => l.target === this && l.type === type && l.listener === listener
        );
        if (idx !== -1) {
          self.listeners.splice(idx, 1);
        }
      }
      return origRemove.call(this, type, listener as any, options);
    };

    this.isInstalled = true;
  }

  public getStats(): ListenerStats {
    const byType: Record<string, number> = {};
    for (const l of this.listeners) {
      byType[l.type] = (byType[l.type] || 0) + 1;
    }
    return {
      activeCount: this.listeners.length,
      byType,
      potentialLeaks: this.listeners.filter(
        (l) => l.type === "pointermove" || l.type === "scroll" || l.type === "mousemove"
      ).length,
    };
  }

  public reset(): void {
    this.listeners = [];
  }
}
