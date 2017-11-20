import { scene, scenes } from '../src/core/shyer';


scene('level1', {

  load: function() {
    this.coinCount = 5;
  },

  start: function() {
    console.log(this.getCoins());
    console.log(this.name);
  },

  getCoins: function() {
    this.name = 'cam';
    return 'Coins ' + this.coinCount;
  }

});

scenes['level1'].load();
scenes['level1'].start();

scenes['level1'].listen('on-coin-grabbed', function(value) {

  console.log('THISSSS', this);

  return 1;

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