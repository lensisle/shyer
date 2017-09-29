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

const renderDecorator = (fn) => {
  return (ctx, cache) => {
    fn(ctx, cache);
  };
}

game.decorate(game, 'render', renderDecorator);

let player;
let enemy;

game.load([
  { resId: 'knight', type: ASSET_TYPE_IMAGE, src: 'knight.png' },
  { resId: 'floor', type: ASSET_TYPE_IMAGE, src: 'floor.png' }
]);

game.on(LOAD_COMPLETE_EVT, () => {
  player = createSprite('player', 'knight', 50, 50, 80, 80, 200);
  enemy = createSprite('enemy', 'knight', 300, 300, 80, 80, 10, true, false);
  const sprites = game.registerEntity(player, enemy);
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
  renderGroup([enemy, player], ctx, cache);
});