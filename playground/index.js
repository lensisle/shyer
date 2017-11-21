import Shyer from '../src/core/shyer';

const game = new Shyer({
  width: 800,
  height: 600,
  el: '#container',
  bgColor: 'pink'
});

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
