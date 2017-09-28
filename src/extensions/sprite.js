registerSprites: function() {
  const sprites = Array.prototype.slice.call(arguments, 0);
  sprites.forEach(
    ({ resId, id, x, y, w, h, speed, visible, animations }) => {
      this.entitiesKeys.unshift(id);
      this.entities[id] = {
        resId,
        x,
        y,
        w,
        h,
        speed,
        visible,
        animations,
        update: updateSpr,
        render: renderSpr
      };
    }
  );
}


export default function createSprite(id, resId, x, y, width, height, speed, visible, static, crop) {

  let animationClips = [];
  let currentClip = '';

  const { rows = 1, columns = 1 } = crop;

  function setCurrentClip(clipId) {
    currentClip = clipId;
  }

  function addAnimationClip(id, originIndex, length, frameDuration, frameSize) {
    const clip = { id, originIndex, length, frameDuration, frameSize, idx: 0, time: 0 };
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

  function renderAnimations(ctx) {

  }

  function update(dt) {
    updateAnimations(dt);
  }

  function render(ctx, cache) {
    ctx.save();
    if (rows > 1 || columns > 1) {
      renderAnimations(ctx, cache);
    } else {
      ctx.drawImage(
        cache.image[this.resId] || cache.default,
        this.x - this.w / 2 - camera.mtx[0].x,
        this.y - this.h / 2 - camera.mtx[0].y,
        this.w,
        this.h
      );
    }
    const a = this.animations
      ? this.animations[this.animations.current]
      : undefined;
    if (this.animations && this.animations[this.animations.current]) {
      ctx.drawImage(
        cache.image[this.resId] || cache.default,
        (a.idx % this.animations.c) * a.size,
        (Math.floor(a.idx / this.animations.c) % this.animations.r) * a.size,
        a.size,
        a.size,
        this.x - this.w / 2 - camera.mtx[0].x,
        this.y - this.h / 2 - camera.mtx[0].y,
        this.w,
        this.h
      );
    } else {
      
    }
    ctx.restore();
  }
}