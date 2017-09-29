import {
  createGame,
  createSprite,
  ASSET_TYPE_IMAGE,
  PAUSE_EVENT,
  LOAD_COMPLETE_EVENT,
  UPDATE_EVENT
} from './index';

const game = createGame(800, 600);
game.on(LOAD_COMPLETE_EVENT, cache => {
  const knight = createSprite('knight', 'knight', 50, 50, 80, 80, 200);
  const sprites = game.registerSprites(knight);
  game.start();
});

game.on(PAUSE_EVENT, () => {});

game.on(UPDATE_EVENT, dt => {
  const knight = game.getEntity('knight');

  if (game.keys.left) {
    knight.x -= knight.speed * dt;
  }
});

game.load([
  { resId: 'knight', type: ASSET_TYPE_IMAGE, src: 'knight.png' },
  { resId: 'floor', type: ASSET_TYPE_IMAGE, src: 'floor.png' }
]);
