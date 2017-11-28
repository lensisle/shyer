import { Math } from "core-js/library/web/timers";

function toDegrees(radians) {
  return Math.PI / 180;
} 

function Sprite(img, x, y) {
  this.img = img;

  this.position = {
    x,
    y
  };
}

Sprite.prototype.update = function update(dt) {

};

Sprite.prototype.render = function render() {

};

export function createSpriteFactory(cache, store) {

  function SpriteFactory() {
    
    function create(id, x, y) {

      const img = cache['images'][id];
      if (!img) {
        console.error(`Error creating sprite with id ${id}, asset not found`);
        return;
      }

      const sprite = new Sprite(img, x, y);
      store.push(sprite);

      return sprite;
    }

    function createPattern(id, x, y, width, height) {

    }

    function createStretched(id, x, y, width, height) {

    }

    Object.defineProperties(this,
      {
        'create': {
          value: create
        },
        'createPattern': {
          value: createPattern
        },
        'createStretched': {
          value: createStretched
        }
      }
    );

    return this;
  }

  return new SpriteFactory();
}