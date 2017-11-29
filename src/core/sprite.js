function getAssetImg(cache, id, imgRef) {
  if (!cache['images'][id]) {
    console.error(`Asset with id ${id} not found`);
    return null;
  }
  return cache['images'][id];
}

export function SpriteFactory(cache, store) {

  return {

    create: function(id, x ,y) {

      const img = getAssetImg(cache, id);
      if (img) {

        const sprite = new Sprite(img, x, y);
        store.push(sprite);
        return sprite;
      }

    },
    createStretched: function(id, x, y, width, height) {

      const img = getAssetImg(cache, id);
      if (img) {

        const sprite = new Sprite(img, x, y, width, height);
        store.push(sprite);
        return sprite;
      }

    },
    createTiled: (id, x, y, width, height) => {

      const img = getAssetImg(cache, id);
      if (img) {

        const pattern = this._ctx.createPattern(img, 'repeat');
        const sprite = new Sprite(img, x, y, width, height, pattern);

        store.push(sprite);

        return sprite;
      }
      
    }

  }  

}

function Sprite(img, x = 0, y = 0, width, height, pattern) {

  this.img = img;

  this.position = {
    x, 
    y
  };

  this.anchors = {
    x: 0,
    y: 0
  };

  this.width = width || img.width;
  this.height = height || img.height;

  this.pattern = pattern || null;

  this.rotation = 0;
}

Sprite.prototype.render = function (ctx) {

  if (this.pattern) {

    ctx.fillStyle = this.pattern;
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

  } else {
    

  }

};

Sprite.prototype.update = function(dt) {

};