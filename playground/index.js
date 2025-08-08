import { Shyer, Sprite, Camera, UI, Particles } from "./shyer/index.js";
const {
  createGame,
  ASSET_TYPE_IMAGE,
  LOAD_COMPLETE_EVT,
  UPDATE_EVT,
  RENDER_EVT,
} = Shyer;
const {
  createAnimationClip,
  createSprite,
  createAnimatedSprite,
  collideWith,
  renderSprite,
  renderAnimatedSprite,
} = Sprite;
const { createCamera } = Camera;

const game = createGame(960, 540);
game.setClearColor("#111111");
game.loadImages({ boredcat: "boredcat.png", coin: "Sp_SCoinRed.png" });

const camera = createCamera(
  { x: 0, y: 0, width: 960, height: 540 },
  { x: 0, y: 0, width: 4000, height: 1250 }
);

let player;
let obstacle;
let totalEntities = 0;
let sw = 4000,
  sh = 1250; // world size

const moveDownClip = createAnimationClip(0, 1, 0);
const moveUpClip = createAnimationClip(1, 1, 0);
const moveRightClip = createAnimationClip(2, 1, 0);
const moveLeftClip = createAnimationClip(3, 1, 0);

game.on(LOAD_COMPLETE_EVT, () => {
  // HUD overlay
  const hud = document.createElement("div");
  hud.style.position = "fixed";
  hud.style.left = "8px";
  hud.style.top = "8px";
  hud.style.padding = "6px 8px";
  hud.style.background = "rgba(0,0,0,0.5)";
  hud.style.color = "#0f0";
  hud.style.font = "12px monospace";
  hud.style.zIndex = "10000";
  document.body.appendChild(hud);
  // UI: title
  const ui = UI.createUI();
  game.extend(ui);
  game.onRender(({ ctx }) => ui.render2D(ctx));
  ui.add({
    id: "title",
    type: "text",
    x: 16,
    y: 16,
    w: 0,
    h: 0,
    text: "Shyer Demo",
    color: "#0f0",
    font: "bold 18px monospace",
  });

  player = createSprite("player", "boredcat", 50, 50, 64, 64);
  obstacle = createSprite("obstacle", "boredcat", 300, 300, 64, 64);
  // Re-enable animation (2 rows x 3 columns)
  player = createAnimatedSprite(
    player,
    { rows: 2, columns: 3, cropSize: 100 },
    {
      moveLeftClip,
      moveRightClip,
      moveUpClip,
      moveDownClip,
    },
    "moveDownClip"
  );
  player.speed = 220;
  player.z = 10; // render on top
  game.registerEntity(player);
  game.registerEntity(obstacle);
  totalEntities += 2;

  // Spawn a lot of moving sprites to demonstrate batching + culling
  const COUNT = 2000;
  for (let i = 0; i < COUNT; i++) {
    const s = createSprite(
      "e" + i,
      "boredcat",
      Math.random() * sw,
      Math.random() * sh,
      24,
      24
    );
    s.vx = (Math.random() * 2 - 1) * 60;
    s.vy = (Math.random() * 2 - 1) * 60;
    s.update = (dt) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < 0 || s.x + s.width > sw) {
        s.vx *= -1;
      }
      if (s.y < 0 || s.y + s.height > sh) {
        s.vy *= -1;
      }
    };
    game.registerEntity(s);
  }
  totalEntities += COUNT;

  // Massive particle field (e.g., 500k)
  const particles = Particles.createParticles({
    textureId: "coin",
    count: 500000,
    spriteWidth: 4,
    spriteHeight: 4,
    worldWidth: sw,
    worldHeight: sh,
    initialSpeed: 40,
  });
  game.extend({ start: particles.start, update: particles.update });
  particles.hook(game);

  // FPS counter
  let smoothedFps = 0;
  function updateHud(dt) {
    const fps = 1 / Math.max(0.000001, dt);
    smoothedFps = smoothedFps ? smoothedFps * 0.9 + fps * 0.1 : fps;
    // Estimate visible entities based on camera view
    const view = camera.getViewRect();
    let visible = 0;
    // naive estimate: player + obstacle + random sample
    // For demo simplicity, assume roughly proportional to view/world area
    const ratio = (view.width * view.height) / (sw * sh);
    visible = Math.max(2, Math.floor(totalEntities * ratio));
    hud.textContent = `FPS: ${smoothedFps.toFixed(
      1
    )} | Entities: ${totalEntities} | Approx Visible: ${visible} | Zoom: ${zoomLevel().toFixed(
      2
    )} | Player: (${Math.round(player?.x ?? 0)}, ${Math.round(
      player?.y ?? 0
    )})`;
  }

  function zoomLevel() {
    return camera.getViewRect().width ? 600 / camera.getViewRect().width : 1;
  }

  game.on(UPDATE_EVT, (dt) => updateHud(dt));

  // Simple zoom controls for demo
  window.addEventListener("keydown", (e) => {
    if (e.key === "+") camera.zoomBy(-0.2, 0.2);
    if (e.key === "-") camera.zoomBy(0.2, 0.2);
  });

  game.start();
});

game.on(UPDATE_EVT, (dt) => {
  if (game.keys.left) {
    player.setCurrentClip("moveLeftClip");
    player.x -= player.speed * dt;
  }
  if (game.keys.right) {
    player.setCurrentClip("moveRightClip");
    player.x += player.speed * dt;
  }
  if (game.keys.up) {
    player.setCurrentClip("moveUpClip");
    player.y -= player.speed * dt;
  }
  if (game.keys.down) {
    player.setCurrentClip("moveDownClip");
    player.y += player.speed * dt;
  }
});

game.on(UPDATE_EVT, (dt) => {
  camera.update(dt);
  camera.follow(player, 300, 200);
  // sync GL view frustum with camera
  const vr = camera.getViewRect();
  game.setViewRect?.(vr.x, vr.y, vr.width, vr.height);
});

game.on(UPDATE_EVT, (dt) => {
  collideWith(
    player,
    obstacle,
    () => {
      console.log("collision!");
      obstacle.visible = false;
      // camera shake on collision
      camera.shake(0.4, 10, 20);
    },
    obstacle.visible
  );
});

// Rendering is handled by the core WebGL renderer now (automatic for registered entities)
