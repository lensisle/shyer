export interface BaseSprite {
  id: string;
  resId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  visible: boolean;
  isStatic: boolean;
  update: (dt: number) => void;
  [key: string]: any;
}

export function createSprite(
  id: string,
  resId: string,
  x: number,
  y: number,
  width: number,
  height: number
): BaseSprite {
  let speed = 0;
  let visible = true;
  let isStatic = false;

  function update(_dt: number) {}

  const sprite: BaseSprite & {
    withAnimationClip?: (name: string, clip: AnimationClip) => any;
    withAnimationClips?: (
      clips: Record<string, AnimationClip>,
      starting?: string
    ) => any;
  } = {
    id,
    resId,
    x,
    y,
    width,
    height,
    speed,
    visible,
    isStatic,
    update,
  };

  sprite.withAnimationClip = (name: string, clip: AnimationClip) => {
    const clips: Record<string, AnimationClip> = { [name]: clip };
    return createAnimatedSprite(
      sprite as any,
      { rows: 1, columns: 1, cropSize: Math.max(width, height) },
      clips,
      name
    );
  };
  sprite.withAnimationClips = (
    clips: Record<string, AnimationClip>,
    starting?: string
  ) => {
    // Caller must later set columns/rows on the returned animated sprite; this is a convenience wrapper
    return createAnimatedSprite(
      sprite as any,
      { rows: 1, columns: 1, cropSize: Math.max(width, height) },
      clips,
      starting
    );
  };

  return sprite;
}

export function collideWith(
  source: Pick<BaseSprite, "x" | "y" | "width" | "height">,
  target: Pick<BaseSprite, "x" | "y" | "width" | "height">,
  onCollideFn: () => void,
  enablerExp: boolean = true
) {
  if (!enablerExp) return;

  const { x, y, width, height } = source;
  const { x: x2, y: y2, width: width2, height: height2 } = target;
  const collisionResult =
    x < x2 + width2 && x + width > x2 && y < y2 + height2 && y + height > y2;

  if (collisionResult) {
    onCollideFn();
  }
}

export function renderSprite(
  { resId, x, y, width, height, visible, isStatic }: BaseSprite,
  ctx: CanvasRenderingContext2D,
  cache: { image: Record<string, HTMLImageElement>; default: HTMLImageElement }
) {
  if (!visible) return;
  if (!isStatic) ctx.save();
  ctx.drawImage(cache.image[resId] || cache.default, x, y, width, height);
  if (!isStatic) ctx.restore();
}

export function renderGroup(
  sprites: BaseSprite[] = [],
  ctx: CanvasRenderingContext2D,
  cache: { image: Record<string, HTMLImageElement>; default: HTMLImageElement },
  renderFn: (
    sprite: BaseSprite,
    ctx: CanvasRenderingContext2D,
    cache: any
  ) => void
) {
  for (let i = 0; i < sprites.length; i++) renderFn(sprites[i], ctx, cache);
}

export interface AnimationClip {
  origin: number;
  length: number;
  duration: number;
  time: number;
  idx: number;
}

export function createAnimatedSprite(
  sprite: BaseSprite,
  crop: { rows: number; columns: number; cropSize: number },
  clips: Record<string, AnimationClip>,
  startingClip: string = ""
) {
  let currentClip = startingClip;
  const { rows, columns, cropSize } = crop;
  const { update: parentUpdate, speed } = sprite;

  function setCurrentClip(clipName: string) {
    if (clips[clipName]) {
      currentClip = clipName;
      clips[clipName].idx = clips[clipName].origin;
      clips[clipName].time = 0;
    }
  }

  function getCurrentClip(): AnimationClip | undefined {
    return clips[currentClip];
  }

  function update(dt: number) {
    parentUpdate(dt);
    if (!clips) return;
    const clip = getCurrentClip();
    if (!clip) return;
    clip.time += dt * speed;
    if (clip.time > clip.duration) {
      clip.time = 0;
      clip.idx += 1;
      if (clip.idx >= clip.origin + clip.length) {
        clip.idx = clip.origin;
      }
    }
  }

  return {
    ...sprite,
    rows,
    columns,
    cropSize,
    setCurrentClip,
    getCurrentClip,
    update,
  };
}

export function createAnimationClip(
  tileOrigin: number,
  tilesLength: number,
  secondsPerFrame: number
): AnimationClip {
  return {
    origin: tileOrigin,
    length: tilesLength,
    duration: secondsPerFrame * 100,
    time: 0,
    idx: tileOrigin,
  };
}

export function renderAnimatedSprite(
  {
    resId,
    x,
    y,
    width,
    height,
    visible,
    isStatic,
    getCurrentClip,
    rows,
    columns,
    cropSize,
  }: any,
  ctx: CanvasRenderingContext2D,
  cache: { image: Record<string, HTMLImageElement>; default: HTMLImageElement }
) {
  if (!visible) return;
  const clip: AnimationClip | undefined = getCurrentClip();
  if (clip) {
    if (!isStatic) ctx.save();
    ctx.drawImage(
      cache.image[resId] || cache.default,
      (clip.idx % columns) * cropSize,
      (Math.floor(clip.idx / columns) % rows) * cropSize,
      cropSize,
      cropSize,
      x,
      y,
      width,
      height
    );
    if (!isStatic) ctx.restore();
  }
}
