function checkPointInsideReact(point, rect) {

}

function Mouse() {
  this.x = 0;
  this.y = 0;

  this.leftClick = false;
  this.middleClick = false;
  this.rightClick = false;
  
  const canvas = document.querySelector('#shyer');
  this._canvasOffset = canvas.getBoundingClientRect();

  console.log(this._canvasOffset);

  this.clickEvents = {};
}

Mouse.prototype.click = function(button, clickFn) {

  this.clickEvents[button] = clickFn;

};

let onClickListener = function(event) {
  event.preventDefault();
};

let onMoveListener = function(event) {
  event.preventDefault();
  const { clientX, clientY } = event;
  this.mouse.x = clientX - this.mouse._canvasOffset.left;
  this.mouse.y = clientY - this.mouse._canvasOffset.top;
};

let onResizeListener = function(event) {
  event.preventDefault();
  this.mouse._canvasOffset = canvas.getBoundingClientRect();
};

export function initMouse() {

  const mouse = new Mouse();

  onMoveListener = onMoveListener.bind(this);
  onClickListener = onClickListener.bind(this);
  onResizeListener = onResizeListener.bind(this);

  window.addEventListener('mousemove', onMoveListener, false);
  window.addEventListener('click', onClickListener);

  Object.defineProperty(this, 'mouse', {
    get: function() {
      return mouse;
    }
  });

  return mouse;
}