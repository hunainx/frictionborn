// Original — Frictionborn Motion glBudget (ARCHITECTURE.md §3)

export interface Lease {
  id: string;
  priority: number;
  acquiredAt: number;
  lastUsedAt: number;
  isOffScreen: boolean;
  setOffScreen: (offScreen: boolean) => void;
  release: () => void;
  onEvict?: () => void;
}

export interface AcquireOptions {
  id: string;
  priority?: number;
  isOffScreen?: boolean;
  onEvict?: () => void;
}

class GLBudget {
  private activeLeases = new Map<string, Lease>();
  private maxContextsFine = 4;
  private maxContextsCoarse = 2;
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener();
      } catch (e) {
        console.error("glBudget listener error:", e);
      }
    }
  }

  public getMaxContexts(): number {
    if (typeof window === "undefined" || !window.matchMedia) {
      return 0;
    }
    const isFine = window.matchMedia("(pointer: fine)").matches;
    return isFine ? this.maxContextsFine : this.maxContextsCoarse;
  }

  public getActiveCount(): number {
    return this.activeLeases.size;
  }

  public getLease(id: string): Lease | undefined {
    return this.activeLeases.get(id);
  }

  public setOffScreen(id: string, isOffScreen: boolean): void {
    const lease = this.activeLeases.get(id);
    if (lease) {
      lease.isOffScreen = isOffScreen;
    }
  }

  public acquire(options: AcquireOptions): Lease | null {
    if (typeof window === "undefined") {
      return null;
    }

    const { id, priority = 0, isOffScreen = false, onEvict } = options;
    const max = this.getMaxContexts();

    // If already has lease, touch and return it
    const existing = this.activeLeases.get(id);
    if (existing) {
      existing.lastUsedAt = performance.now();
      existing.priority = priority;
      existing.isOffScreen = isOffScreen;
      if (onEvict) existing.onEvict = onEvict;
      return existing;
    }

    // If budget full, attempt LRU eviction of lowest-priority off-screen lease
    if (this.activeLeases.size >= max) {
      let candidate: Lease | null = null;

      for (const lease of this.activeLeases.values()) {
        // Only evict if candidate priority is strictly less than incoming priority,
        // or if equal priority and candidate is off-screen
        if (lease.priority < priority || (lease.priority === priority && lease.isOffScreen)) {
          if (!candidate) {
            candidate = lease;
          } else if (lease.priority < candidate.priority) {
            candidate = lease;
          } else if (lease.priority === candidate.priority && lease.lastUsedAt < candidate.lastUsedAt) {
            candidate = lease;
          }
        }
      }

      if (!candidate) {
        // Cannot evict any active lease
        return null;
      }

      // Evict candidate
      this.activeLeases.delete(candidate.id);
      if (candidate.onEvict) {
        try {
          candidate.onEvict();
        } catch (e) {
          console.error(`Error in onEvict for lease ${candidate.id}:`, e);
        }
      }
    }

    const now = performance.now();
    const lease: Lease = {
      id,
      priority,
      acquiredAt: now,
      lastUsedAt: now,
      isOffScreen,
      setOffScreen: (offScreen: boolean) => {
        lease.isOffScreen = offScreen;
      },
      onEvict,
      release: () => {
        if (this.activeLeases.has(id)) {
          this.activeLeases.delete(id);
          this.notify();
        }
      },
    };

    this.activeLeases.set(id, lease);
    return lease;
  }

  public releaseAll(): void {
    for (const lease of this.activeLeases.values()) {
      if (lease.onEvict) {
        try {
          lease.onEvict();
        } catch {
          // ignore
        }
      }
    }
    const hadLeases = this.activeLeases.size > 0;
    this.activeLeases.clear();
    if (hadLeases) {
      this.notify();
    }
  }
}

export const glBudget = new GLBudget();
