function checkClickInsideCanvas(x, y, rect) {

  const { left, top, right, bottom } = rect;

  if (x >= left && x <= right && y <= bottom && y >= top) {
    return true;
  }

  return false;
}

function Mouse() {
  this.position = {
    x: 0,
    y: 0
  };
  
  const canvas = document.querySelector('#shyer');

  this._canvasOffset = canvas.getBoundingClientRect();
}

Mouse.prototype.click = function(clickFn) {
  if (!this._clickFn || this._clickFn !== clickFn) {
    this._clickFn = clickFn;
  }
};

Mouse.prototype.unsubscribe = function() {
  
  window.removeEventListener('mousemove', onMoveListener);
  window.removeEventListener('click', onClickListener);
  window.removeEventListener('resize', onResizeListener);

};

let onClickListener = function(event) {
  event.preventDefault();
  if (!this.mouse._clickFn) {
    return;
  }

  const { clientX, clientY } = event;

  if (checkClickInsideCanvas(clientX, clientY, this.mouse._canvasOffset)) {

    this.mouse._clickFn.call(this, this.mouse.position.x, this.mouse.position.y);

  }
};

let onMoveListener = function(event) {
  event.preventDefault();
  const { clientX, clientY } = event;
  this.mouse.position.x = clientX - this.mouse._canvasOffset.left;
  this.mouse.position.y = clientY - this.mouse._canvasOffset.top;
};

let onResizeListener = function(event) {
  event.preventDefault();
  const canvas = document.querySelector('#shyer');
  this.mouse._canvasOffset = canvas.getBoundingClientRect();
};

export function initMouse() {

  const mouse = new Mouse();

  onMoveListener = onMoveListener.bind(this);
  onClickListener = onClickListener.bind(this);
  onResizeListener = onResizeListener.bind(this);

  window.addEventListener('mousemove', onMoveListener, false);
  window.addEventListener('click', onClickListener, false);
  window.addEventListener('resize', onResizeListener, false);

  Object.defineProperty(this, 'mouse', {
    get: function() {
      return mouse;
    },
    configurable: true,
    enumerable: true
  });

  return mouse;
}
