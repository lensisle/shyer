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

  function render(ctx, cache) {
    if (!visible) return;
    if (!isStatic) ctx.save();
    ctx.drawImage(cache.image[resId] || cache.default, x, y, width, height);
    if (!isStatic) ctx.restore();
  }

  return {
    id,
    x,
    y,
    width,
    height,
    speed,
    visible,
    isStatic,
    colliding,
    render,
    update
  };
}

export function animateSprite(sprite, crop, clips) {
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
