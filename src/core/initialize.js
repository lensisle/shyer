export function initCanvas(Shyer) {
  Shyer.prototype._initialize = function(options) {
    const el = options.el;
    const width = options.width || 800;
    const height = options.height || 600;
    const bgColor = options.bgColor || '#000000';

    const canvas = document.createElement('canvas');
    canvas['id'] = 'shyer';
    canvas['width'] = width;
    canvas['height'] = height;
    canvas['tabIndex'] = 1000;
    canvas['style']['outline'] = 'none';

    const targetNode = document.querySelector(el);
    if (targetNode) {
      targetNode.appendChild(canvas);
    } else {
      document.body.appendChild(canvas);
    }

    this._bgColor = bgColor;
    this._ctx = canvas.getContext`2d`;
    this._ctx.fillStyle = this._bgColor;
    this._ctx.fillRect(0, 0, width, height);
  };
}

export function initState(Shyer) {
  const globalEvents = {};
  const scenes = {};
  const store = {};
}
