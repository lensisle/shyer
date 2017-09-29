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
  isStatic = false,
) {
  let colliding = false;

  function update(dt) {
    colliding = checkCollidde();
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

export function renderSprite({ resId, x, y, width, height, visible, isStatic }, ctx, cache) {
  if (!visible) return;
  if (!isStatic) ctx.save();
  ctx.drawImage(cache.image[resId] || cache.default, x, y, width, height);
  if (!isStatic) ctx.restore();
}

// TODO: Make this fn generic
export function renderGroup(sprites = [], ctx, cache, renderFn) {
  sprites.forEach(sprite => renderSprite(sprite, ctx, cache));
}

export function createAnimatedSprite(sprite, crop, clips) {
  let currentClip = '';
  const { rows, columns, cropSize } = crop;

  function setCurrentClip(clipName) {
    currentClip = clipName;
  }

  return {
    ...sprite,
    rows,
    columns,
    cropSize,
    setCurrentClip
  };
}


// implemente animated sprite rendering
/*export function renderAnimatedSprite() {
  sprite.render = function(ctx, cache) {
    const clip = clips[currentClip];
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
  };
}
*/