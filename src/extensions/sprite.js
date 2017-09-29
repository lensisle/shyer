export function createSprite(
  id,
  resId,
  x,
  y,
  width,
  height,
  speed = 0,
  visible = true,
  isStatic = false
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

export function renderGroup(sprites = [], ctx, cache) {
  sprites.forEach(sprite => renderSprite(sprite, ctx, cache));
}

export function createAnimatedSprite(sprite, crop, clips) {
  let currentClip = '';
  const { rows, columns, cropSize } = crop;
  const { x, y, width, height, isStatic } = sprite;

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

  return sprite;
}
