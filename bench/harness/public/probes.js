// Original — Frictionborn Motion in-browser benchmark probes
(function () {
  if (typeof window === "undefined") return;

  // 1. Frame counter probe
  function FrameCounterProbe() {
    this.totalFrames = 0;
    this.offscreenFrames = 0;
    this.hiddenTabFrames = 0;
    this.reducedMotionFrames = 0;
    this.startTime = performance.now();
    var self = this;
    var origRaf = window.requestAnimationFrame.bind(window);

    window.requestAnimationFrame = function (cb) {
      self.totalFrames++;
      if (document.visibilityState === "hidden") {
        self.hiddenTabFrames++;
      }
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        self.reducedMotionFrames++;
      }

      var items = document.querySelectorAll("[data-frictionborn-item]");
      if (items.length > 0) {
        var allOffscreen = true;
        for (var i = 0; i < items.length; i++) {
          var rect = items[i].getBoundingClientRect();
          var inView =
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

      return origRaf(cb);
    };
  }

  FrameCounterProbe.prototype.getStats = function () {
    var elapsed = Math.max((performance.now() - this.startTime) / 1000, 0.001);
    return {
      totalFrames: this.totalFrames,
      offscreenFrames: this.offscreenFrames,
      hiddenTabFrames: this.hiddenTabFrames,
      reducedMotionFrames: this.reducedMotionFrames,
      fps: Math.round(this.totalFrames / elapsed),
    };
  };

  FrameCounterProbe.prototype.reset = function () {
    this.totalFrames = 0;
    this.offscreenFrames = 0;
    this.hiddenTabFrames = 0;
    this.reducedMotionFrames = 0;
    this.startTime = performance.now();
  };

  // 2. WebGL Context counter probe
  function ContextCounterProbe() {
    this.active = new Set();
    this.plannedLost = new WeakSet();
    this.totalCreated = 0;
    this.unplannedLosses = 0;
    this.plannedLosses = 0;
    this.restoredCount = 0;
    var self = this;

    if (typeof HTMLCanvasElement !== "undefined") {
      var origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (contextId, options) {
        var ctx = origGetContext.call(this, contextId, options);
        if (ctx && (contextId === "webgl" || contextId === "webgl2" || contextId === "experimental-webgl")) {
          if (!self.active.has(ctx)) {
            self.active.add(ctx);
            self.totalCreated++;

            this.addEventListener(
              "webglcontextlost",
              function () {
                if (self.plannedLost.has(ctx)) {
                  self.plannedLosses++;
                } else {
                  self.unplannedLosses++;
                }
                self.active.delete(ctx);
              },
              { passive: false }
            );

            this.addEventListener("webglcontextrestored", function () {
              self.active.add(ctx);
              self.restoredCount++;
            });

            var origGetExt = ctx.getExtension;
            ctx.getExtension = function (name) {
              var ext = origGetExt.call(this, name);
              if (ext && (name === "WEBGL_lose_context" || name === "WEBGL_lose_context")) {
                var origLose = ext.loseContext;
                ext.loseContext = function () {
                  self.plannedLost.add(ctx);
                  return origLose.call(this);
                };
              }
              return ext;
            };
          }
        }
        return ctx;
      };
    }
  }

  ContextCounterProbe.prototype.getStats = function () {
    return {
      activeContexts: this.active.size,
      totalCreated: this.totalCreated,
      unplannedLosses: this.unplannedLosses,
      plannedLosses: this.plannedLosses,
      restoredCount: this.restoredCount,
    };
  };

  ContextCounterProbe.prototype.reset = function () {
    this.active.clear();
    this.totalCreated = 0;
    this.unplannedLosses = 0;
    this.plannedLosses = 0;
    this.restoredCount = 0;
  };

  // 3. Listener counter probe
  function ListenerCounterProbe() {
    this.listeners = [];
    var self = this;
    var origAdd = EventTarget.prototype.addEventListener;
    var origRemove = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (listener) {
        self.listeners.push({ target: this, type: type, listener: listener });
      }
      return origAdd.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      if (listener) {
        var idx = self.listeners.findIndex(function (l) {
          return l.target === this && l.type === type && l.listener === listener;
        }, this);
        if (idx !== -1) {
          self.listeners.splice(idx, 1);
        }
      }
      return origRemove.call(this, type, listener, options);
    };
  }

  ListenerCounterProbe.prototype.getStats = function () {
    var byType = {};
    var leaks = 0;
    for (var i = 0; i < this.listeners.length; i++) {
      var t = this.listeners[i].type;
      byType[t] = (byType[t] || 0) + 1;
      if (t === "pointermove" || t === "scroll" || t === "mousemove") {
        leaks++;
      }
    }
    return {
      activeCount: this.listeners.length,
      byType: byType,
      potentialLeaks: leaks,
    };
  };

  ListenerCounterProbe.prototype.reset = function () {
    this.listeners = [];
  };

  // 4. Animation probe
  function AnimationProbe() {}
  AnimationProbe.prototype.getStats = function () {
    if (typeof document === "undefined" || typeof document.getAnimations !== "function") {
      return { totalAnimations: 0, runningCount: 0, pausedCount: 0, propertiesAnimated: [] };
    }
    var anims = document.getAnimations();
    var running = 0;
    var paused = 0;
    var props = new Set();
    for (var i = 0; i < anims.length; i++) {
      if (anims[i].playState === "running") running++;
      if (anims[i].playState === "paused") paused++;
      if (anims[i].effect && anims[i].effect.getKeyframes) {
        var kfs = anims[i].effect.getKeyframes();
        for (var j = 0; j < kfs.length; j++) {
          for (var k in kfs[j]) {
            if (k !== "offset" && k !== "computedOffset" && k !== "easing" && k !== "composite") {
              props.add(k);
            }
          }
        }
      }
    }
    return {
      totalAnimations: anims.length,
      runningCount: running,
      pausedCount: paused,
      propertiesAnimated: Array.from(props),
    };
  };

  // 5. Performance observer probe
  function PerformanceObserverProbe() {
    this.cls = 0;
    this.lcp = 0;
    this.lcpElement = null;
    this.totalBlockingTime = 0;
    this.longTasksCount = 0;
    this.maxInteractionLatency = 0;
    var self = this;

    if (typeof PerformanceObserver !== "undefined") {
      try {
        var clsObs = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          for (var i = 0; i < entries.length; i++) {
            if (!entries[i].hadRecentInput) {
              self.cls += entries[i].value || 0;
            }
          }
        });
        clsObs.observe({ type: "layout-shift", buffered: true });
      } catch {
        // unsupported in some browsers
      }

      try {
        var lcpObs = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          var last = entries[entries.length - 1];
          if (last) {
            self.lcp = last.startTime;
            self.lcpElement = last.element ? last.element.tagName : null;
          }
        });
        lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // unsupported in some browsers
      }

      try {
        var ltObs = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].duration > 50) {
              self.longTasksCount++;
              self.totalBlockingTime += entries[i].duration - 50;
            }
          }
        });
        ltObs.observe({ type: "longtask", buffered: true });
      } catch {
        // unsupported in some browsers
      }

      try {
        var evtObs = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].duration > self.maxInteractionLatency) {
              self.maxInteractionLatency = entries[i].duration;
            }
          }
        });
        evtObs.observe({ type: "event", buffered: true });
      } catch {
        // unsupported in some browsers
      }
    }
  }

  PerformanceObserverProbe.prototype.getStats = function () {
    return {
      cls: Number(this.cls.toFixed(4)),
      lcp: Math.round(this.lcp),
      lcpElement: this.lcpElement,
      totalBlockingTime: Math.round(this.totalBlockingTime),
      longTasksCount: this.longTasksCount,
      maxInteractionLatency: Math.round(this.maxInteractionLatency),
    };
  };

  PerformanceObserverProbe.prototype.reset = function () {
    this.cls = 0;
    this.lcp = 0;
    this.lcpElement = null;
    this.totalBlockingTime = 0;
    this.longTasksCount = 0;
    this.maxInteractionLatency = 0;
  };

  window.__FB_PROBES__ = {
    frameCounter: new FrameCounterProbe(),
    contextCounter: new ContextCounterProbe(),
    listenerCounter: new ListenerCounterProbe(),
    animationProbe: new AnimationProbe(),
    perfObserver: new PerformanceObserverProbe(),
  };
})();
