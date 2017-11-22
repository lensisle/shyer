export default function createCanvas(options) {
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

  Object.defineProperty(this, '_bgColor', {
    get: function() {
      return bgColor;
    }
  });

  Object.defineProperty(this, '_ctx', {
    get: function() {
      return canvas.getContext`2d`;
    }
  });

  this._ctx.fillStyle = this._bgColor;
  this._ctx.fillRect(0, 0, width, height);
}