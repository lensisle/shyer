import {
  createGame,
  START_EVT,
  RENDER_EVT,
  UPDATE_EVT,
  LOAD_COMPLETE_EVT,
  ASSET_TYPE_IMAGE
} from './index';

import {
  createSprite,
  renderGroup
} from './extensions/sprite';

let game = createGame(800, 600);
game = game.decorate(game, 'render', () => console.log('rendering!'));
console.log(game);

let player;
let enemy;

game.load([
  { resId: 'knight', type: ASSET_TYPE_IMAGE, src: 'knight.png' },
  { resId: 'floor', type: ASSET_TYPE_IMAGE, src: 'floor.png' }
]);

game.on(LOAD_COMPLETE_EVT, cache => {
  player = createSprite('player', 'knight', 50, 50, 80, 80, 200);
  enemy = createSprite('enemy', 'knight', 200, 100, 80, 80, 10, true, false);
  const sprites = game.registerSprites(player, enemy);
  game.start();
});

game.on(UPDATE_EVT, dt => {
  if (game.keys.left) {
    player.x -= player.speed * dt;
  }
  if (game.keys.right) {
    player.x += player.speed * dt;
  }
  if (game.keys.up) {
    player.y -= player.speed * dt;
  }
  if (game.keys.down) {
    player.y += player.speed * dt;
  }
});

game.on(RENDER_EVT, ({ctx, cache}) => {
  renderGroup([player, enemy], ctx, cache);
});