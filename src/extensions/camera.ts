import { clamp } from "../utils/math_utils";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Renderable {
  x: number;
  y: number;
  width: number;
  height: number;
}
type Easing = (t: number) => number;

const easeInOutQuad: Easing = (t: number) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export function createCamera(viewportRect: Rect, worldRect: Rect) {
  // Viewport (screen) rect in pixels
  let { x: vx, y: vy, width: vw, height: vh } = viewportRect;
  // World bounds (in world units)
  let { x: wx, y: wy, width: ww, height: wh } = worldRect;

  // Follow state
  let followEntityRef: { x: number; y: number } | null = null;
  let followPointRef: { x: number; y: number } | null = null;
  let dzx = 0; // dead zone x (pixels in screen space)
  let dzy = 0; // dead zone y (pixels in screen space)

  // Zoom state
  let zoom = 1;
  let zoomTween: {
    start: number;
    end: number;
    time: number;
    duration: number;
    ease: Easing;
  } | null = null;

  // Pan tween (transitions)
  let panTween: {
    sx: number;
    sy: number;
    ex: number;
    ey: number;
    time: number;
    duration: number;
    ease: Easing;
  } | null = null;

  // Shake effect
  let shakeTime = 0;
  let shakeDuration = 0;
  let shakeAmplitude = 0;
  let shakeFrequency = 0;
  const shakePhaseX = Math.random() * Math.PI * 2;
  const shakePhaseY = Math.random() * Math.PI * 2;

  // Flash overlay effect
  let flashTime = 0;
  let flashDuration = 0;
  let flashColor = "rgba(255,255,255,1)";
  let flashMaxAlpha = 1;

  function setViewportSize(
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    vx = x;
    vy = y;
    vw = width;
    vh = height;
  }

  function setWorldBounds(x: number, y: number, width: number, height: number) {
    wx = x;
    wy = y;
    ww = width;
    wh = height;
  }

  // Backwards compatibility alias
  const setWorldSize = setWorldBounds;

  function follow(
    entity: { x: number; y: number },
    deadZoneX: number = 0,
    deadZoneY: number = 0
  ) {
    followEntityRef = entity;
    followPointRef = null;
    dzx = deadZoneX;
    dzy = deadZoneY;
  }

  function followPoint(
    x: number,
    y: number,
    deadZoneX: number = 0,
    deadZoneY: number = 0
  ) {
    followPointRef = { x, y };
    followEntityRef = null;
    dzx = deadZoneX;
    dzy = deadZoneY;
  }

  function stopFollowing() {
    followEntityRef = null;
    followPointRef = null;
  }

  function setZoom(next: number) {
    zoom = Math.max(0.01, next);
  }

  function zoomTo(
    targetZoom: number,
    duration: number,
    ease: Easing = easeInOutQuad
  ) {
    zoomTween = {
      start: zoom,
      end: Math.max(0.01, targetZoom),
      time: 0,
      duration: Math.max(0.0001, duration),
      ease,
    };
  }

  function zoomBy(
    delta: number,
    duration: number,
    ease: Easing = easeInOutQuad
  ) {
    zoomTo(zoom + delta, duration, ease);
  }

  function panTo(
    targetX: number,
    targetY: number,
    duration: number,
    ease: Easing = easeInOutQuad
  ) {
    panTween = {
      sx: vx,
      sy: vy,
      ex: targetX,
      ey: targetY,
      time: 0,
      duration: Math.max(0.0001, duration),
      ease,
    };
  }

  function shake(duration: number, amplitude: number, frequency: number = 25) {
    shakeDuration = Math.max(0, duration);
    shakeTime = shakeDuration;
    shakeAmplitude = Math.max(0, amplitude);
    shakeFrequency = Math.max(0, frequency);
  }

  function flash(
    duration: number = 0.2,
    color: string = "white",
    maxAlpha: number = 1
  ) {
    flashDuration = Math.max(0.0001, duration);
    flashTime = flashDuration;
    flashColor = color;
    flashMaxAlpha = Math.max(0, Math.min(1, maxAlpha));
  }

  function getShakeOffset(elapsed: number): { ox: number; oy: number } {
    if (shakeTime <= 0 || shakeDuration <= 0 || shakeAmplitude <= 0)
      return { ox: 0, oy: 0 };
    const t = shakeDuration - shakeTime;
    const falloff = 1 - t / shakeDuration;
    const ox =
      Math.sin((t + shakePhaseX) * shakeFrequency * 2 * Math.PI) *
      shakeAmplitude *
      falloff;
    const oy =
      Math.cos((t + shakePhaseY) * shakeFrequency * 2 * Math.PI) *
      shakeAmplitude *
      falloff;
    return { ox, oy };
  }

  function getViewRect(): Rect {
    // viewport size in world units considering zoom
    const worldW = vw / zoom;
    const worldH = vh / zoom;
    return { x: vx, y: vy, width: worldW, height: worldH };
  }

  function update(dt: number) {
    // Tweens
    if (zoomTween) {
      zoomTween.time += dt;
      const t = Math.min(1, zoomTween.time / zoomTween.duration);
      const k = zoomTween.ease(t);
      zoom = zoomTween.start + (zoomTween.end - zoomTween.start) * k;
      if (t >= 1) zoomTween = null;
    }
    if (panTween) {
      panTween.time += dt;
      const t = Math.min(1, panTween.time / panTween.duration);
      const k = panTween.ease(t);
      vx = panTween.sx + (panTween.ex - panTween.sx) * k;
      vy = panTween.sy + (panTween.ey - panTween.sy) * k;
      if (t >= 1) panTween = null;
    }

    // Follow logic (only when no explicit pan tween is active)
    if (!panTween) {
      const target = followEntityRef || followPointRef;
      if (target) {
        const vwWorld = vw / zoom;
        const vhWorld = vh / zoom;
        const deadZoneXWorld = dzx / zoom;
        const deadZoneYWorld = dzy / zoom;
        const vxNext =
          target.x - vx + deadZoneXWorld > vwWorld
            ? target.x - (vwWorld - deadZoneXWorld)
            : target.x - deadZoneXWorld < vx
            ? target.x - deadZoneXWorld
            : vx;
        const vyNext =
          target.y - vy + deadZoneYWorld > vhWorld
            ? target.y - (vhWorld - deadZoneYWorld)
            : target.y - deadZoneYWorld < vy
            ? target.y - deadZoneYWorld
            : vy;
        vx = vxNext;
        vy = vyNext;
      }
    }

    // Clamp to world bounds (in world units)
    const vwWorld = vw / zoom;
    const vhWorld = vh / zoom;
    vx = clamp(vx, wx, wx + Math.max(0, ww - vwWorld));
    vy = clamp(vy, wy, wy + Math.max(0, wh - vhWorld));

    // Effects timers
    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
    if (flashTime > 0) flashTime = Math.max(0, flashTime - dt);
  }

  function render(
    entities: Renderable[] = [],
    renderFn: (
      entity: Renderable,
      ctx: CanvasRenderingContext2D,
      cache: any
    ) => void,
    ctx: CanvasRenderingContext2D,
    cache: any,
    useTransform: boolean = true
  ) {
    const { ox, oy } = getShakeOffset(0);
    if (useTransform) {
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-(vx - ox), -(vy - oy));
      for (let i = 0, max = entities.length; i < max; i++) {
        const entity = entities[i];
        if (!contains(entity)) continue;
        renderFn(entity, ctx, cache);
      }
      ctx.restore();
    } else {
      for (let i = 0, max = entities.length; i < max; i++) {
        const entity = entities[i];
        if (!contains(entity)) continue;
        const renderEntity = { ...entity } as Renderable;
        (renderEntity as any).x = entity.x - entity.width / 2 - vx + ox;
        (renderEntity as any).y = entity.y - entity.height / 2 - vy + oy;
        (renderEntity as any).width = entity.width * zoom;
        (renderEntity as any).height = entity.height * zoom;
        renderFn(renderEntity, ctx, cache);
      }
    }

    // Flash overlay (draw on screen coordinates; ignore zoom/translate)
    if (flashTime > 0 && flashDuration > 0) {
      const alpha = flashMaxAlpha * (flashTime / flashDuration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = flashColor;
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }
  }

  function contains({ x, y, width, height }: Renderable) {
    // Culling in world units using current view rect
    const view = getViewRect();
    return (
      x + width >= view.x &&
      x <= view.x + view.width &&
      y + height >= view.y &&
      y <= view.y + view.height
    );
  }

  return {
    // sizing and bounds
    setViewportSize,
    setWorldSize,
    setWorldBounds,
    // follow controls
    follow,
    followPoint,
    stopFollowing,
    // movement/zoom transitions
    panTo,
    setZoom,
    zoomTo,
    zoomBy,
    // effects
    shake,
    flash,
    // query
    getViewRect,
    // main loop hooks
    update,
    render,
  };
}
