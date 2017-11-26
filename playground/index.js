import Shyer from '../src/core/shyer';

const level = {
  name: 'level-1',
  load: function() {
    this.loadImage('cat', 'boredcat.png');
    this.loadImage('cat2', 'boredcat.png');
    this.loadImage('cat3', 'boredcat.png');
    this.loadImage('cat4', 'boredcat.png');
  },
  start: function() {
    this.initMouse();
    this.initKeyboard();
  },
  update: function() {

    this.mouse.click(this.click);

  },
  click: function() {
    console.log('this', this);
  }
};


const game = new Shyer({
  width: 800,
  height: 600,
  el: '#container',
  initScene: 'level-1'
}, [level]);

// game.configureKeys(['left', 'right', 'up', 'down']);

/*
const game = Shyer.create(800, 600);
game.preload(['level1', 'level2']);

game.state({

  currentLevel: 1

});

game.scene('level1', {

  load() {
    
    this.loadImage('player', 'assets/img/player.png');
    this.loadImage('coin', 'assets/img/coin.png');

  },

  start() {

    this.player = this.sprite('player').size(400, 300).position(30, 40);

    this.coin = this.sprite('coin').size(30, 30).position(50, 50);

    this.coinCount = 0;

  },

  update() {

    this.collide(this.player, this.coin, function(player, coin) {

      this.emit('addCoin', 1);
      coin.destroy();

    });
  
  }

});

game.addEvent('level1', 'addCoin', function(value) {
  
  this.coinCount += value;
  if (this.coinCount > 10) {

    this.emit('nextLevel');

  }
 
});

game.addGlobalEvent('nextLevel', function() {

  if (this.state.currentLevel === 1) {
    this.changeScene('level2', true); // change scene to level1 scene and preserve the loaded assets.
  }

});

game.scene('level2', {

  load() {

  },

  start() {

  },

  update() {

  },

});

*/
