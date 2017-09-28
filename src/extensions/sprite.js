export default function createSprite(id, resId, x, y, width, height, speed, visible, static, crop) {

  let animationClips = [];
  let currentClip = '';

  const { rows = 1, columns = 1, cropSize } = crop;

  function setCurrentClip(clipId) {
    currentClip = clipId;
  }

  function addAnimationClip(id, originIndex, length, frameDuration) {
    const clip = { id, originIndex, length, frameDuration, idx: 0, time: 0 };
    animationClips.push(clip);
  }

  function updateAnimations(dt) {
    if (!animationClips[currentClip]) return;
    const animation = animationClips[currentClip];
    animation.time += dt * speed;
    if (animation.time > animation.duration) {
      animation.time = 0;
      animation.idx += 1;
      if (animation.idx > animation.origin + animation.length) {
        animation.idx = animation.origin;
      }
    }
  }

  function update(dt) {
    updateAnimations(dt);
  }

  function renderAnimations(ctx, cache) {
    const clip = animationClips[currentClip];
    if (clip) {
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
    }
  }

  function render(ctx, cache) {
    if (!static) ctx.save();
    if (rows > 1 || columns > 1) {
      renderAnimations(ctx, cache);
    } else {
      ctx.drawImage(cache.image[resId] || cache.default, x, y, width, height);
    }
    if (!static) ctx.restore();
  }
}