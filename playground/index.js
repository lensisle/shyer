import { Shyer, Sprite, Camera } from '../src/index';
const {
  createGame,
  ASSET_TYPE_IMAGE,
  LOAD_COMPLETE_EVT,
  UPDATE_EVT,
  RENDER_EVT
} = Shyer;
const {
  createAnimationClip,
  createSprite,
  createAnimatedSprite,
  collideWith,
  renderSprite,
  renderAnimatedSprite
} = Sprite;
const { createCamera } = Camera;

const game = createGame(600, 400);
game.setClearColor('#ffffff');
game.load([{ resId: 'boredcat', src: 'boredcat.png', type: ASSET_TYPE_IMAGE }]);

const camera = createCamera(
  { x: 0, y: 0, width: 600, height: 400 },
  { x: 0, y: 0, width: 4000, height: 1250 }
);

let player;
let obstacle;

const moveDownClip = createAnimationClip(0, 1, 0);
const moveUpClip = createAnimationClip(1, 1, 0);
const moveRightClip = createAnimationClip(2, 1, 0);
const moveLeftClip = createAnimationClip(3, 1, 0);

game.on(LOAD_COMPLETE_EVT, () => {
  player = createSprite('player', 'boredcat', 50, 50, 100, 100);
  obstacle = createSprite('obstacle', 'boredcat', 300, 300, 100, 100);
  player = createAnimatedSprite(
    player,
    { rows: 2, columns: 3, cropSize: 101 },
    {
      moveLeftClip,
      moveRightClip,
      moveUpClip,
      moveDownClip
    },
    'moveDownClip'
  );
  player.speed = 180;
  game.registerEntity(player);
  game.start();
});

game.on(UPDATE_EVT, dt => {
  if (game.keys.left) {
    player.setCurrentClip('moveLeftClip');
    player.x -= player.speed * dt;
  }

  if (game.keys.right) {
    player.setCurrentClip('moveRightClip');
    player.x += player.speed * dt;
  }

  if (game.keys.up) {
    player.setCurrentClip('moveUpClip');
    player.y -= player.speed * dt;
  }

  if (game.keys.down) {
    player.setCurrentClip('moveDownClip');
    player.y += player.speed * dt;
  }
});

game.on(UPDATE_EVT, dt => {
  camera.update(dt);
  camera.follow(player, 300, 200);
});

game.on(UPDATE_EVT, dt => {
  collideWith(
    player,
    obstacle,
    () => {
      console.log('collision!');
      obstacle.visible = false;
    },
    obstacle.visible
  );
});

game.on(RENDER_EVT, ({ ctx, cache }) => {
  camera.render([obstacle], renderSprite, ctx, cache);
  camera.render([player], renderAnimatedSprite, ctx, cache);
});
