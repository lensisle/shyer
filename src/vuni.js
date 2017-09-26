const Emmiter = {
  emit: function(events, evt, data) {
    events[evt].subscribers.forEach(sub => sub(data));
  }
};

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const camera = {
  target: '',
  v: { x: 0, y: 0, w: 0, h: 0 },
  w: { x: 0, y: 0, w: 0, h: 0 },
  setViewportRect: function(x, y, w, h) {
    this.v.x = x;
    this.v.y = y;
    this.v.w = w;
    this.v.h = h;
  },
  setWorldRect: function(x, y, w, h) {
    this.w.x = x;
    this.w.y = y;
    this.w.w = w;
    this.w.h = h;
  },
  follow: function({ x, y }, dzx, dzy) {
    this.v.x =
      x - this.v.x + dzx > this.v.w
        ? x - (this.v.w - dzx)
        : x - dzx < this.v.x ? x - dzx : this.v.x;
    this.v.y =
      y - this.v.y + dzy > this.v.h
        ? y - (this.v.h - dzy)
        : y - dzy < this.v.y ? y - dzy : this.v.y;
    this.v.x = clamp(this.v.x, this.w.x - dzx, this.w.x + this.w.w - dzx);
    this.v.y = clamp(this.v.y, this.w.y - dzy, this.w.y + this.w.h - dzy);
  },
  contains: function({ x, y }) {
    return (
      x >= this.v.x &&
      x <= this.v.x + this.v.w &&
      y >= this.v.y &&
      y <= this.v.y + this.v.h
    );
  }
};

const Vuni = {
  createGame: function(width, height) {
    const canvas = document.createElement('canvas');
    canvas['id'] = 'vuni-root';
    canvas['width'] = width;
    canvas['height'] = height;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext`2d`;
    this.cache = { image: {}, audio: {}, default: new Image() };
    this.events = {};
    ['update', 'loadcomplete'].forEach(
      evtKey => (this.events[evtKey] = { subscribers: [] })
    );
    this.on = this.on.bind(this);
    this.camera = { ...camera };
    this.camera.setViewportRect(0, 0, width, height);
    this.camera.setWorldRect(0, 0, width, width);
    const update = () => {
      this.scene.entitiesKeys.forEach(ek => {
        const et = this.scene.entities[ek];
        if (!et.visible) return;
        if (this.camera.target && ek === this.camera.target)
          this.camera.follow(et, width / 2.0, height / 2.0);
        et.update();
      });
    };
    const render = () => {
      ctx.fillStyle = this.clearColor;
      ctx.fillRect(0, 0, width, height);
      this.scene.entitiesKeys.forEach(ek => {
        const et = this.scene.entities[ek];
        if (!et.visible && !this.camera.contains(et)) return;
        ctx.save();
        const img = this.cache.image[et.resId] || this.cache.default;
        ctx.drawImage(
          img,
          et.x - et.w / 2 - this.camera.v.x,
          et.y - et.h / 2 - this.camera.v.y,
          et.w,
          et.h
        );
        ctx.restore();
      });
    };
    render();
    let lastFrameTime = 0;
    this.gameLoop = function() {
      const now = Date.now();
      this.gameLoop.dt = (now - lastFrameTime) / 1000.0;
      Emmiter.emit(this.events, 'update', this.gameLoop.dt);
      update();
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
      sprites.forEach(({ resId, id, x, y, w, h, speed, visible }) => {
        this.entitiesKeys.unshift(id);
        this.entities[id] = { resId, x, y, w, h, speed, visible };
      });
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
      this.gameLoop();
    });
  }
};

Vuni.createGame(400, 300).load([
  {
    type: 'image',
    src: 'mother3.png',
    id: 'mother'
  }
]);

const motherSprite = {
  resId: 'mother',
  id: 'a',
  x: 0,
  y: 0,
  w: 144,
  h: 144,
  speed: 240,
  visible: true
};

const spr2 = { ...motherSprite, id: 'b', x: 50, y: 50 };

Vuni.on('loadcomplete', () => {
  Vuni.scene.registerSprites(motherSprite, spr2);
  Vuni.camera.target = 'a';
});

Vuni.on('update', dt => {
  const a = Vuni.scene.entities['a'];

  if (Vuni.input.left) {
    a.x -= a.speed * dt;
  }
  if (Vuni.input.right) {
    a.x += a.speed * dt;
  }
  if (Vuni.input.up) {
    a.y -= a.speed * dt;
  }
  if (Vuni.input.down) {
    a.y += a.speed * dt;
  }
});

export default Vuni;
