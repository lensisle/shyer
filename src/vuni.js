const Vuni = {
  createGame: function(width, height) {
    const canvas = document.createElement('canvas');
    canvas['id'] = 'vuniroot';
    canvas['width'] = width;
    canvas['height'] = height;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext`2d`;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    this.assets = { image: {}, audio: {} };
    this.emmiter = {
      events: {},
      emit: (evt, data) =>
        this.emmiter.events[evt].subscribers.forEach(sub => sub(data))
    };
    ['update', 'render', 'keypress', 'keyrelease', 'onloaded'].forEach(
      evtKey => (this.emmiter.events[evtKey] = { subscribers: [] })
    );
    this.on = this.on.bind(this);
    let lastFrameTime = 0;
    this.gameLoop = (ts = 0) => {
      if (ts < lastFrameTime + 33.3) {
        requestAnimationFrame(this.gameLoop);
        return;
      }
      const dt = ts - lastFrameTime;
      lastFrameTime = ts;
      this.emmiter.emit('update', dt);
      this.emmiter.emit('render');
      requestAnimationFrame(this.gameLoop);
    };
    canvas.tabIndex = 1000;
    canvas.style.outline = 'none';
    const keyEvent = evtName => (evt = window.event) => {
      evt.preventDefault();
      this.emmiter.emit(evtName, evt.keyCode || 0);
    };
    canvas.onkeydown = keyEvent('keypress');
    canvas.onkeyup = keyEvent('keyrelease');
    return this;
  },
  on: function(event, callback) {
    if (this.emmiter.events[event])
      this.emmiter.events[event].subscribers.push(callback);
  },
  load: function(assets) {
    const loader = assets.map(assetDef => {
      return new Promise((res, rej) => {
        const asset = assetDef.type === 'image' ? new Image() : new Audio();
        asset.onerror = rej;
        asset[assetDef.type === 'image' ? 'onload' : 'oncanplaythrough'] = res;
        asset.src = assetDef.src;
        this.assets[assetDef.type][assetDef.id] = asset;
      });
    });
    Promise.all(loader).then(_ => {
      this.emmiter.emit('onloaded');
      this.gameLoop();
    });
  }
};

// Tests ->

Vuni.createGame(400, 300).load([
  { id: 'mother', type: 'image', src: 'mother3.png' },
  { id: 'mother2', type: 'image', src: 'mother3.png' }
]);

Vuni.on('onloaded', () => {
  console.log('Resources loaded');
  console.log(Vuni.assets);
});

Vuni.on('keyrelease', keycode => {
  console.log(keycode);
});

export default Vuni;
