
function Vuni (width, height) {
  const canvas = document.createElement('canvas');
  canvas['id'] = 'vuniroot';
  canvas['width'] = width;
  canvas['height'] = height;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  this.subs = {};
  this.listener = canvas.addEventListener.bind(canvas);
  const listen = (evt) => (this.subs[evt.type] || (() => {}))(evt.detail);
  this.listener('update', listen);
  this.listener('render', listen);
  this.listener('keypress', listen);
  this.listener('keyrelease', listen);
  this.on = this.on.bind(this);
  let lastFrameTime = 0;
  const gameLoop = (ts = 0) => {
    if (ts < lastFrameTime + 33.3) {
      requestAnimationFrame(gameLoop);
      return;
    }
    const delta = ts - lastFrameTime
    lastFrameTime = ts;
    canvas.dispatchEvent(new CustomEvent('update', { detail: delta }));
    canvas.dispatchEvent(new CustomEvent('render'));
    requestAnimationFrame(gameLoop);
  };
  canvas.tabIndex = 1000;
  canvas.style.outline = "none";
  const keyEvent = (evtName) => (evt = window.event) => {
    evt.preventDefault();
    canvas.dispatchEvent(new CustomEvent(evtName, { detail: (evt.keyCode || 0) }));
  };
  canvas.onkeydown = keyEvent('keypress');
  canvas.onkeyup = keyEvent('keyrelease');
  gameLoop();
};

Vuni.prototype.on = function (event, callback) {
  this.subs[event] = callback;
};

// Tests ->

const game = new Vuni (600, 400);
game.on('keypress', (key) => {
  console.log('keypress', key);
});
game.on('keyrelease', (key) => {
  console.log('keyrelease', key);
})
game.on('render', () => {
  console.log('render');
});
game.on('update', (delta) => {
  console.log('update', delta);
});

export default Vuni;