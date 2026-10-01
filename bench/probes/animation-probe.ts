// Original — Frictionborn Motion animation probe
export interface AnimationStats {
  totalAnimations: number;
  runningCount: number;
  pausedCount: number;
  propertiesAnimated: string[];
}

export class AnimationProbe {
  public getStats(): AnimationStats {
    if (typeof document === "undefined" || typeof document.getAnimations !== "function") {
      return {
        totalAnimations: 0,
        runningCount: 0,
        pausedCount: 0,
        propertiesAnimated: [],
      };
    }

    const anims = document.getAnimations();
    let running = 0;
    let paused = 0;
    const props = new Set<string>();

    for (const a of anims) {
      if (a.playState === "running") running++;
      if (a.playState === "paused") paused++;

      if ("effect" in a && a.effect && "getKeyframes" in a.effect) {
        const keyframes = (a.effect as KeyframeEffect).getKeyframes();
        for (const kf of keyframes) {
          for (const key of Object.keys(kf)) {
            if (key !== "offset" && key !== "computedOffset" && key !== "easing" && key !== "composite") {
              props.add(key);
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
  }
}
