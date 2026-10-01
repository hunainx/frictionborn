// Original — Frictionborn Motion useInView (pooled IntersectionObserver)
import { useState, useEffect, type RefObject } from "react";

export interface InViewOptions {
  rootMargin?: string;
  once?: boolean;
}

interface ObserverRecord {
  observer: IntersectionObserver;
  callbacks: Map<Element, (entry: IntersectionObserverEntry) => void>;
}

const observerPool = new Map<string, ObserverRecord>();

function getPooledObserver(rootMargin: string): ObserverRecord {
  let record = observerPool.get(rootMargin);
  if (!record) {
    const callbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = callbacks.get(entry.target);
          if (cb) {
            cb(entry);
          }
        }
      },
      { rootMargin }
    );
    record = { observer, callbacks };
    observerPool.set(rootMargin, record);
  }
  return record;
}

export function useInView(
  ref: RefObject<Element | null>,
  options: InViewOptions = {}
): boolean {
  const { rootMargin = "0px", once = false } = options;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    // If already inView and once is true, do nothing
    if (once && inView) {
      return;
    }

    const record = getPooledObserver(rootMargin);

    const onIntersect = (entry: IntersectionObserverEntry) => {
      const isVisible = entry.isIntersecting;
      if (isVisible) {
        setInView(true);
        if (once) {
          record.observer.unobserve(element);
          record.callbacks.delete(element);
          if (record.callbacks.size === 0) {
            record.observer.disconnect();
            observerPool.delete(rootMargin);
          }
        }
      } else if (!once) {
        setInView(false);
      }
    };

    record.callbacks.set(element, onIntersect);
    record.observer.observe(element);

    return () => {
      record.observer.unobserve(element);
      record.callbacks.delete(element);
      if (record.callbacks.size === 0) {
        record.observer.disconnect();
        observerPool.delete(rootMargin);
      }
    };
  }, [ref, rootMargin, once, inView]);

  return inView;
}
