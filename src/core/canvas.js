import shyerLogo64 from './shyerlogo';

export default function createCanvas(options) {
  const el = options.el;
  const width = options.width || 800;
  const height = options.height || 600;
  const bgColor = options.bgColor || '#00D3FF';
  const ignoreDefaultLogo = options.ignoreDefaultLogo || false;

  const canvas = document.createElement('canvas');
  canvas['id'] = 'shyer';
  canvas['width'] = width;
  canvas['height'] = height;
  canvas['tabIndex'] = 1000;
  canvas['style']['outline'] = 'none';

  document.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
  };

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

  Object.defineProperty(this, '_dimensions', {
    get: function() {
      return { width, height };
    }
  });

  this._ctx.fillStyle = this._bgColor;
  this._ctx.fillRect(0, 0, width, height);

  if (!ignoreDefaultLogo) {
    const logo = new Image();
    logo.onload = () => {
      this._ctx.drawImage(logo, (width * 0.5) - 125, (height * 0.5) - 175 - 40, 250, 350);
    };
    logo.src = shyerLogo64;
  }
}