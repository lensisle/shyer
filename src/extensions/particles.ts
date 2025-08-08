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

    // Create GL batches on first render when gl is available
    game.on("render", ({ gl }: any) => {
      if (!gl || !img || batches.length > 0) return;
      const perBatch = Math.min(
        options.count,
        options.count < 50000 ? options.count : 100000
      );
      let created = 0;
      while (created < count) {
        const take = Math.min(perBatch, count - created);
        const glBatch = gl.getOrCreateBatch(img, take);
        glBatch.count = take;
        // Pre-fill sizes and uvs (constant)
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

  function hook(game: any) {
    game.on("physics", (dt: number) => updatePhysics(dt));
    game.on("render", ({ gl, cache }: any) => {
      if (!gl || batches.length === 0) return;
      // Copy positions into instance buffers per batch (view-space handled by core)
      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        const gb = batch.glBatch;
        const start = batch.start;
        const end = batch.end;
        const n = end - start;
        gb.count = n;
        for (let i = 0; i < n; i++) {
          gb.translations[i * 2 + 0] = px[start + i];
          gb.translations[i * 2 + 1] = py[start + i];
        }
      }
    });
  }

  return { start, update: (_dt: number) => {}, hook };
}
