export function createSprite(
  id,
  resId,
  x,
  y,
  width,
  height,
  speed = 0,
  visible = true,
  collidable = false,
  isStatic = false
) {
  let colliding = false;

  function update(dt) {
    colliding = collidable ? false : checkCollidde();
  }

  function checkCollidde() {
    return false; // placeholder
  }

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
    colliding,
    update
  };
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

export function createAnimatedSprite(sprite, crop, clips, startingClip = "") {
  let currentClip = startingClip;
  const { rows, columns, cropSize } = crop;
  const { update: parentUpdate, speed } = sprite;

  function setCurrentClip(clipName) {
    currentClip = clipName;
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
      if (clip.idx > clip.origin + clip.length) {
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
    idx: 0
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
