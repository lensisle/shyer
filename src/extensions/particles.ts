export interface ParticlesOptions {
  textureId: string;
  count: number;
  spriteWidth?: number;
  spriteHeight?: number;
  worldWidth: number;
  worldHeight: number;
  initialSpeed?: number; // px/s
}

export function createParticles(options: ParticlesOptions) {
  const {
    textureId,
    count,
    spriteWidth = 8,
    spriteHeight = 8,
    worldWidth,
    worldHeight,
    initialSpeed = 60,
  } = options;

  // State
  let cache: any;
  let img: HTMLImageElement | undefined;
  const px = new Float32Array(count);
  const py = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);

  // Batches
  type Batch = {
    capacity: number;
    start: number;
    end: number; // exclusive
    glBatch: any; // SpriteBatch
  };
  const batches: Batch[] = [];
  let lastVisibleCount = 0;

  function start(game: any, cacheRef: any) {
    cache = cacheRef;
    img = cache?.image?.[textureId];
    // Init random positions/velocities
    for (let i = 0; i < count; i++) {
      px[i] = Math.random() * worldWidth;
      py[i] = Math.random() * worldHeight;
      const a = Math.random() * Math.PI * 2;
      vx[i] = Math.cos(a) * initialSpeed;
      vy[i] = Math.sin(a) * initialSpeed;
    }

    // Wire physics and render hooks here for robustness
    game.on("physics", (dt: number) => updatePhysics(dt));
    game.on("render", ({ gl, viewRect }: any) => {
      if (!gl) return;
      // Create batches once when image becomes available
      if (img && batches.length === 0) {
        const perBatch = Math.min(
          options.count,
          options.count < 50000 ? options.count : 100000
        );
        let created = 0;
        while (created < count) {
          const take = Math.min(perBatch, count - created);
          const glBatch = gl.getOrCreateBatch(img, take);
          glBatch.uploadSizesAndUVs = false; // static size/uv
          glBatch.count = take;
          for (let i = 0; i < take; i++) {
            glBatch.sizes[i * 2 + 0] = spriteWidth;
            glBatch.sizes[i * 2 + 1] = spriteHeight;
            glBatch.uvs[i * 4 + 0] = 0;
            glBatch.uvs[i * 4 + 1] = 0;
            glBatch.uvs[i * 4 + 2] = 1;
            glBatch.uvs[i * 4 + 3] = 1;
          }
          batches.push({
            capacity: take,
            start: created,
            end: created + take,
            glBatch,
          });
          created += take;
        }
      }
      if (batches.length === 0 || !viewRect) return;
      const vx0 = viewRect.x;
      const vy0 = viewRect.y;
      const vw = viewRect.width;
      const vh = viewRect.height;
      let visible = 0;
      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        const gb = batch.glBatch;
        const start = batch.start;
        const end = batch.end;
        const n = end - start;
        let write = 0;
        for (let i = 0; i < n; i++) {
          const x = px[start + i];
          const y = py[start + i];
          if (
            x + spriteWidth > vx0 &&
            x < vx0 + vw &&
            y + spriteHeight > vy0 &&
            y < vy0 + vh
          ) {
            gb.translations[write * 2 + 0] = x - vx0;
            gb.translations[write * 2 + 1] = y - vy0;
            write++;
          }
        }
        gb.count = write;
        visible += write;
      }
      lastVisibleCount = visible;
    });
  }

  function updatePhysics(dt: number) {
    // Simple wrap physics
    for (let i = 0; i < count; i++) {
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
      if (px[i] < 0) px[i] += worldWidth;
      else if (px[i] > worldWidth) px[i] -= worldWidth;
      if (py[i] < 0) py[i] += worldHeight;
      else if (py[i] > worldHeight) py[i] -= worldHeight;
    }
  }

  function hook(_game: any) {
    // no-op (wired in start)
  }

  return {
    start,
    update: (_dt: number) => {},
    hook,
    getVisibleCount: () => lastVisibleCount,
  };
}
