export function createSprite(id, resId, x, y, width, height) {
  let speed = 0;
  let visible = true;
  let isStatic = false;

  function update(dt) {}

  return {
    id,
    resId,
    x,
    y,
    width,
    height,
    speed,
    visible,
    isStatic,
    update
  };
}

export function collideWith(source, target, onCollideFn, enablerExp = true) {
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
  { resId, x, y, width, height, visible, isStatic },
  ctx,
  cache
) {
  if (!visible) return;
  if (!isStatic) ctx.save();
  ctx.drawImage(cache.image[resId] || cache.default, x, y, width, height);
  if (!isStatic) ctx.restore();
}

export function renderGroup(sprites = [], ctx, cache, renderFn) {
  sprites.forEach(sprite => renderFn(sprite, ctx, cache));
}

export function createAnimatedSprite(sprite, crop, clips, startingClip = '') {
  let currentClip = startingClip;
  const { rows, columns, cropSize } = crop;
  const { update: parentUpdate, speed } = sprite;

  function setCurrentClip(clipName) {
    if (clips[clipName]) {
      currentClip = clipName;
      clips[clipName].idx = clips[clipName].origin;
      clips[clipName].time = 0;
    }
  }

  function getCurrentClip() {
    return clips[currentClip];
  }

  function update(dt) {
    parentUpdate(dt);

    if (!clips) return;

    if (!getCurrentClip()) return;

    const clip = getCurrentClip();
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
    update
  };
}

export function createAnimationClip(tileOrigin, tilesLength, secondsPerFrame) {
  return {
    origin: tileOrigin,
    length: tilesLength,
    duration: secondsPerFrame * 100,
    time: 0,
    idx: tileOrigin
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
    cropSize
  },
  ctx,
  cache
) {
  if (!visible) return;
  const clip = getCurrentClip();
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
