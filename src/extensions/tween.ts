export type EasingFunction = (t: number) => number;

export const Easing: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

export interface TweenOptions {
  target?: Record<string, any>;
  props?: Record<string, number>;
  from?: Record<string, number>;
  to?: Record<string, number>;
  duration: number; // seconds
  delay?: number; // seconds
  ease?: EasingFunction | keyof typeof Easing;
  yoyo?: boolean;
  repeat?: number; // 0 = no repeat; -1 = infinite
  onUpdate?: (values: Record<string, number>) => void;
  onComplete?: () => void;
}

interface InternalTween {
  id: number;
  running: boolean;
  paused: boolean;
  elapsed: number;
  delay: number;
  duration: number;
  ease: EasingFunction;
  yoyo: boolean;
  repeat: number; // -1 = infinite
  iteration: number;
  values: Record<string, { start: number; end: number; current: number }>;
  onUpdate?: (values: Record<string, number>) => void;
  onComplete?: () => void;
}

export interface TweenHandle {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isFinished: () => boolean;
}

export function createTweenManager() {
  let tweens: InternalTween[] = [];
  let nextId = 1;
  let isPaused = false;

  function makeEase(
    ease?: EasingFunction | keyof typeof Easing
  ): EasingFunction {
    if (!ease) return Easing.linear;
    if (typeof ease === "function") return ease;
    return Easing[ease] || Easing.linear;
  }

  function to(options: TweenOptions): TweenHandle {
    const {
      target,
      props,
      from,
      to: toVals,
      duration,
      delay = 0,
      ease,
      yoyo = false,
      repeat = 0,
      onUpdate,
      onComplete,
    } = options;
    const keys = new Set<string>();
    if (props) {
      for (const k of Object.keys(props)) keys.add(k);
    }
    if (toVals) {
      for (const k of Object.keys(toVals)) keys.add(k);
    }
    const map: InternalTween["values"] = {} as any;
    keys.forEach((k) => {
      const start = from?.[k] ?? (target ? Number(target[k]) : 0) ?? 0;
      const end = (toVals?.[k] ?? props?.[k]) as number;
      map[k] = { start, end, current: start };
    });

    const tween: InternalTween = {
      id: nextId++,
      running: true,
      paused: false,
      elapsed: 0,
      delay: Math.max(0, delay),
      duration: Math.max(0.000001, duration),
      ease: makeEase(ease),
      yoyo,
      repeat: repeat < 0 ? -1 : Math.floor(repeat),
      iteration: 0,
      values: map,
      onUpdate,
      onComplete,
    };
    tweens.push(tween);

    const handle: TweenHandle = {
      stop: () => {
        tween.running = false;
      },
      pause: () => {
        tween.paused = true;
      },
      resume: () => {
        tween.paused = false;
      },
      isFinished: () => !tween.running,
    };

    return handle;
  }

  function value(
    from: number,
    toVal: number,
    duration: number,
    onUpdate: (v: number) => void,
    opts?: {
      delay?: number;
      ease?: EasingFunction | keyof typeof Easing;
      yoyo?: boolean;
      repeat?: number;
      onComplete?: () => void;
    }
  ): TweenHandle {
    const valsKey = "__v";
    const handle = to({
      from: { [valsKey]: from },
      to: { [valsKey]: toVal },
      duration,
      delay: opts?.delay,
      ease: opts?.ease,
      yoyo: opts?.yoyo,
      repeat: opts?.repeat,
      onUpdate: (vals) => onUpdate(vals[valsKey]),
      onComplete: opts?.onComplete,
    });
    return handle;
  }

  function update(dt: number) {
    if (isPaused) return;
    if (tweens.length === 0) return;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i];
      if (!t.running || t.paused) continue;
      if (t.delay > 0) {
        t.delay -= dt;
        if (t.delay > 0) continue;
      }
      t.elapsed += dt;
      const raw = Math.min(1, t.elapsed / t.duration);
      const k = t.ease(raw);
      const outVals: Record<string, number> = {};
      for (const key of Object.keys(t.values)) {
        const v = t.values[key];
        const current = v.start + (v.end - v.start) * k;
        v.current = current;
        outVals[key] = current;
      }
      // Apply to target if present
      // Note: We only set numeric values here
      // Users can use onUpdate for custom logic
      t.onUpdate?.(outVals);
      // If target provided and props/to provided, write back
      // We prioritize props keys if available; else keys from 'to'
      // This avoids mutating unrelated keys from onUpdate
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      if (raw >= 1) {
        if (t.yoyo) {
          // swap and continue
          for (const key of Object.keys(t.values)) {
            const val = t.values[key];
            const tmp = val.start;
            val.start = val.end;
            val.end = tmp;
          }
        }
        if (t.repeat === -1 || t.iteration < t.repeat) {
          t.iteration += 1;
          t.elapsed = 0;
          continue;
        }
        t.running = false;
        t.onComplete?.();
        tweens.splice(i, 1);
      }
    }
  }

  function clear() {
    tweens.length = 0;
  }

  function pauseAll() {
    isPaused = true;
  }
  function resumeAll() {
    isPaused = false;
  }

  // Helpers
  function toObject(
    target: Record<string, any>,
    toProps: Record<string, number>,
    duration: number,
    opts?: Omit<TweenOptions, "target" | "props" | "duration" | "to">
  ): TweenHandle {
    return to({ target, props: toProps, duration, ...opts });
  }

  // Audio helpers
  function volume(
    audio: {
      setVolume: (resId: string, v: number) => void;
      getDuration?: (resId: string) => number;
    },
    resId: string,
    toVol: number,
    duration: number,
    fromVol?: number,
    ease?: EasingFunction | keyof typeof Easing
  ): TweenHandle {
    return value(
      fromVol ?? 0,
      Math.max(0, Math.min(1, toVol)),
      duration,
      (v) => audio.setVolume(resId, v),
      { ease }
    );
  }

  return {
    // extension hooks
    start(_game: any) {
      /* no-op */
    },
    update,
    // controls
    clear,
    pauseAll,
    resumeAll,
    // creation
    to,
    value,
    toObject,
    // helpers
    volume,
  };
}
