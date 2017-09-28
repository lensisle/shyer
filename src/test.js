/*
const Emmiter = {
  emit: function(events, evt, data) {
    events[evt].subscribers.forEach(sub => sub(data));
  }
};

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const camera = {
  target: '',
  mtx: [{ x: 0, y: 0, w: 0, h: 0 }, { x: 0, y: 0, w: 0, h: 0 }],
  setRectCoords: function(t, x, y, w, h) {
    const i = t === 'viewport' ? 0 : t === 'world' ? 1 : -1;
    this.mtx[clamp(i, 0, 1)] =
      i === 0 || i === 1
        ? Object.assign({}, { x, y, w, h })
        : this.mtx[clamp(i, 0, 1)];
  },
  follow: function({ x, y }, dzx, dzy) {
    const vm = this.mtx[0],
      wm = this.mtx[1];
    const vx =
      x - vm.x + dzx > vm.w
        ? x - (vm.w - dzx)
        : x - dzx < vm.x ? x - dzx : vm.x;
    const vy =
      y - vm.y + dzy > vm.h
        ? y - (vm.h - dzy)
        : y - dzy < vm.y ? y - dzy : vm.y;
    this.mtx[0].x = clamp(vx, wm.x - dzx, wm.x + wm.w - dzx);
    this.mtx[0].y = clamp(vy, wm.y - dzy, wm.y + wm.h - dzy);
  },
  contains: function({ x, y, w, h }) {
    return (
      x - this.mtx[0].x + w / 2.0 >= 0 &&
      x - this.mtx[0].x - w / 2.0 <= this.mtx[0].w &&
      y - this.mtx[0].y + h / 2.0 >= 0 &&
      y - this.mtx[0].y - h / 2.0 <= this.mtx[0].h
    );
  }
};

const updateSpr = function(dt) {
  if (!this.animations) return;
  if (!this.animations[this.animations.current]) return;
  const anim = this.animations[this.animations.current];
  anim.time += dt * this.speed;
  if (anim.time > anim.duration) {
    anim.time = 0;
    anim.idx += 1;
    if (anim.idx > anim.origin + anim.length) {
      anim.idx = anim.origin;
    }
  }
};

const renderSpr = function(camera, cache, ctx) {
  ctx.save();
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
    ctx.drawImage(
      cache.image[this.resId] || cache.default,
      this.x - this.w / 2 - camera.mtx[0].x,
      this.y - this.h / 2 - camera.mtx[0].y,
      this.w,
      this.h
    );
  }
  ctx.restore();
};

const Vuni = {
  createGame: function(width, height) {
    const canvas = document.createElement('canvas');
    canvas['id'] = 'vuni-root';
    canvas['width'] = width;
    canvas['height'] = height;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext`2d`;
    ctx.fillStyle = this.clearColor;
    this.cache = { image: {}, audio: {}, default: new Image() };
    this.events = {};
    ['update', 'loadcomplete'].forEach(
      evtKey => (this.events[evtKey] = { subscribers: [] })
    );
    this.on = this.on.bind(this);
    this.camera = Object.assign({}, camera);
    this.camera.setRectCoords('viewport', 0, 0, width, height);
    this.camera.setRectCoords('world', 0, 0, width, width);
    const update = dt => {
      for (let i = 0, max = this.scene.entitiesKeys.length; i < max; i++) {
        const ek = this.scene.entitiesKeys[i];
        const et = this.scene.entities[ek];
        if (!et.visible) continue;
        if (this.camera.target && ek === this.camera.target)
          this.camera.follow(et, width / 2.0, height / 2.0);
        et.update(dt);
      }
    };
    const render = () => {
      ctx.fillRect(0, 0, width, height);
      for (let i = 0, max = this.scene.entitiesKeys.length; i < max; i++) {
        const ek = this.scene.entitiesKeys[i];
        const et = this.scene.entities[ek];
        if (!et.visible || !this.camera.contains(et)) continue;
        et.render(this.camera, this.cache, ctx);
      }
    };
    render();
    let lastFrameTime = Date.now();
    this.gameLoop = function() {
      const now = Date.now();
      this.gameLoop.dt = (now - lastFrameTime) / 1000.0;
      Emmiter.emit(this.events, 'update', this.gameLoop.dt);
      update(this.gameLoop.dt);
      render();
      lastFrameTime = now;
      requestAnimationFrame(this.gameLoop);
    };
    this.gameLoop = this.gameLoop.bind(this);
    this.gameLoop.dt = 0;
    canvas.tabIndex = 1000;
    canvas.style.outline = 'none';
    const onInput = value => (evt = window.event) => {
      const { keyCode } = evt;
      const key =
        keyCode === 37
          ? 'left'
          : keyCode === 38
            ? 'up'
            : keyCode === 39 ? 'right' : keyCode === 40 ? 'down' : '';
      this.input[key] = value;
    };
    canvas.onkeydown = onInput(true);
    canvas.onkeyup = onInput(false);
    return this;
  },
  input: { up: false, down: false, left: false, right: false },
  clearColor: '#D90368',
  scene: {
    entitiesKeys: [],
    entities: {},
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
    },
    clear: () => {
      this.entitiesKeys.length = 0;
      this.entities = {};
    }
  },
  on: function(event, callback) {
    if (this.events[event]) this.events[event].subscribers.push(callback);
  },
  load: function(assets) {
    const loader = assets.map(assetDef => {
      return new Promise((res, rej) => {
        const asset = assetDef.type === 'image' ? new Image() : new Audio();
        asset.onerror = rej;
        asset[assetDef.type === 'image' ? 'onload' : 'oncanplaythrough'] = res;
        asset.src = assetDef.src;
        this.cache[assetDef.type][assetDef.id] = asset;
      });
    });
    Promise.all(loader).then(_ => {
      Emmiter.emit(this.events, 'loadcomplete');
    });
  }
};
*/

import {
  keys,
  createGame,
  ASSET_TYPE_IMAGE,
  LOAD_COMPLETE_EVENT,
  UPDATE_EVENT,
  PAUSE_EVENT
} from './vuni';

const game = createGame(400, 300);
game.on(LOAD_COMPLETE_EVENT, () => {
  console.log('Load complete!');
  game.start();
});

game.on(PAUSE_EVENT, () => {
  console.log('game paused!');
});

let counter = 0;

game.on(UPDATE_EVENT, dt => {
  counter += dt;
  console.log('updating');
  if (counter > 2) {
    game.pause();
  }
});

game.load([
  { type: ASSET_TYPE_IMAGE, src: 'knight.png' },
  { type: ASSET_TYPE_IMAGE, src: 'floor.png' }
]);
