const Emmiter = {
  emit: function(events, evt, data) {
    events[evt].subscribers.forEach(sub => sub(data));
  },
};

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const Vuni = {
  createGame: function(width, height) {
    const canvas = document.createElement('canvas');
    canvas['id'] = 'vuniroot';
    canvas['width'] = width;
    canvas['height'] = height;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext`2d`;
    this.cache = { image: {}, audio: {}, default: new Image() };
    this.events = {};
    ['update', 'keypress', 'keyrelease', 'onloaded'].forEach(
      evtKey => (this.events[evtKey] = { subscribers: [] })
    );
    this.on = this.on.bind(this);
    const render = () => {
      ctx.fillStyle = this.clearColor;
      ctx.fillRect(0, 0, width, height);
      this.scene.entitiesKeys.forEach(ek => {
        const et = this.scene.entities[ek];
        if (!et.visible) return;
        ctx.save();
        const img = this.cache.image[et.resId] || this.cache.default;
        ctx.drawImage(img, et.x, et.y, et.w, et.h);
        ctx.restore();
      });
    };
    render();
    let lastFrameTime = 0;
    this.gameLoop = function(ts = 0) {
      const now = Date.now();
      this.gameLoop.dt = (now - lastFrameTime) / 1000.0;
      Emmiter.emit(this.events, 'update', this.gameLoop.dt);
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
        this.entitiesKeys.push(id);
        this.entities[id] = { resId, x, y, w, h, speed, visible };
      });
    },
    clear: () => {
      this.entitiesKeys.length = 0;
      this.entities = {};
    },
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
      Emmiter.emit(this.events, 'onloaded');
      this.gameLoop();
    });
  },
};

Vuni.createGame(400, 300).load([
  {
    type: 'image',
    src: 'mother3.png',
    id: 'mother',
  },
]);

const motherSprite = {
  resId: 'mother',
  id: 'a',
  x: 0,
  y: 0,
  w: 144,
  h: 144,
  speed: 240,
  visible: true,
};

const spr2 = { ...motherSprite, id: 'b' };

Vuni.scene.registerSprites(motherSprite, spr2);

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
