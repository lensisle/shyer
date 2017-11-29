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

function Sprite(img, x, y, width, height, pattern) {

  this.img = img;

  this.position = {
    x, 
    y
  };

  this.anchor = {
    x: 0,
    y: 0
  };

  this.scale = {
    x: 1,
    y: 1
  };

  this.width = width || img.width;
  this.height = height || img.height;

  this.pattern = pattern || null;

  this.rotation = 0;
}

Sprite.prototype.render = function (ctx) {

  ctx.save();

  if (this.pattern) {

    ctx.fillStyle = this.pattern;
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

  } else {

    ctx.translate(this.position.x, this.position.y);

    ctx.rotate(this.rotation);
    
    const width = this.width * this.scale.x;
    const height = this.height * this.scale.y;

    ctx.drawImage(
      this.img,
      width * -this.anchor.x,
      height * -this.anchor.y,
      width,
      height
    );

  }

  ctx.restore();

};

Sprite.prototype.update = function(dt) {

};

Sprite.prototype.rotate = function(angles) {
  this.rotation += angles * (Math.PI / 180);
};

Sprite.prototype.setAnchors = function(x, y) {

  this.anchor = {
    x, 
    y
  };

};

Sprite.prototype.setScale = function(x, y) {
  
  this.scale = {
    x,
    y
  };

};