import compose from "../utils/compose";
import { createWebGLSpriteBatchRenderer } from "./renderer/webgl";
import { createAudioPlayer } from "../extensions/audio";
import { createTweenManager } from "../extensions/tween";
import { createInputManager } from "../extensions/input";

export const ASSET_TYPE_IMAGE = "image";
export const ASSET_TYPE_AUDIO = "audio";

export const LOAD_COMPLETE_EVT = "loadcomplete";
export const START_EVT = "start";
export const RENDER_EVT = "render";
export const UPDATE_EVT = "update";
export const PAUSE_EVT = "pause";
export const PHYSICS_EVT = "physics";

export type EventCallback<T = any> = (data: T) => void;
export interface Entity {
  id: string;
  update: (dt: number) => void;
  [key: string]: any;
}

export interface Game {
  keys: Record<string, boolean>;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: EventCallback) => void;
  addEvent: (name: string) => void;
  removeEvent: (name: string) => Record<string, any>;
  getEntity: (id: string) => Entity | undefined;
  registerEntity: (...targets: Entity[]) => Entity[];
  unregisterEntity: (...targets: Entity[]) => {
    entitiesKeys: string[];
    entities: Record<string, Entity>;
  };
  clearEntities: () => void;
  load: (assets: Array<{ resId: string; type: string; src: string }>) => void;
  extend: (...ext: any[]) => Game;
  decorate: (
    game: any,
    functionName: "update" | "render" | string,
    ...decorators: Array<(fn: any) => any>
  ) => void;
  start: () => void;
  resume: () => void;
  pause: () => void;
  setClearColor: (color: string) => void;
  setViewRect?: (x: number, y: number, w: number, h: number) => void;
  setSpatialCellSize?: (size: number) => void;
}

export function createGame(width: number, height: number): Game {
  let cache: any = {
    image: {} as Record<string, HTMLImageElement>,
    audio: {} as Record<string, HTMLAudioElement>,
  };
  let lastFrameTime = Date.now();
  let deltaTime = 0;
  let entitiesKeys: string[] = [];
  let entities: Record<string, Entity> = {};
  let events: Record<string, { subscribers: EventCallback[] }> = {};
  let extensions: any[] = [];
  let paused = false;
  let requestAnimationID = -1;
  let keys: Record<string, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false,
    accept: false,
    cancel: false,
  };

  const clearColor = "#D90368";

  const canvas = document.createElement("canvas");
  (canvas as any)["id"] = "shyer-root";
  canvas.width = width;
  canvas.height = height;
  (canvas as any)["tabIndex"] = 1000;
  (canvas.style as any)["outline"] = "none";

  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = clearColor;
  // Register core extensions by default (Audio, Tween, Input)
  extensions.push(createAudioPlayer());
  extensions.push(createTweenManager());
  extensions.push(createInputManager());
  // WebGL renderer as main renderer
  const glRenderer = createWebGLSpriteBatchRenderer({
    clearColor: [0, 0, 0, 0],
    // Sorting costs CPU every frame; disable by default for perf
    sortInstancesByY: false,
  });
  let viewRect: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width,
    height,
  };

  // Incremental spatial hash grid
  let spatialCellSize = 128;
  type CellKey = string;
  function cellKey(cx: number, cy: number): CellKey {
    return `${cx},${cy}`;
  }
  const grid = new Map<CellKey, Set<string>>();
  const occupancy = new Map<string, CellKey[]>();
  function aabbToCells(x: number, y: number, w: number, h: number): CellKey[] {
    if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) return [];
    const minCx = Math.floor(x / spatialCellSize);
    const minCy = Math.floor(y / spatialCellSize);
    const maxCx = Math.floor((x + Math.max(0, w)) / spatialCellSize);
    const maxCy = Math.floor((y + Math.max(0, h)) / spatialCellSize);
    const keys: CellKey[] = [];
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) keys.push(cellKey(cx, cy));
    }
    return keys;
  }
  function insertToGrid(id: string, keys: CellKey[]) {
    occupancy.set(id, keys);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      let set = grid.get(k);
      if (!set) {
        set = new Set<string>();
        grid.set(k, set);
      }
      set.add(id);
    }
  }
  function removeFromGrid(id: string) {
    const keys = occupancy.get(id);
    if (keys) {
      for (let i = 0; i < keys.length; i++) {
        const set = grid.get(keys[i]);
        if (set) {
          set.delete(id);
          if (set.size === 0) grid.delete(keys[i]);
        }
      }
    }
    occupancy.delete(id);
  }
  function updateInGrid(id: string, nextKeys: CellKey[]) {
    const prev = occupancy.get(id) || [];
    // Early out if identical
    if (
      prev.length === nextKeys.length &&
      prev.every((k, i) => k === nextKeys[i])
    )
      return;
    // Remove from cells no longer covered
    const prevSet = new Set(prev);
    const nextSet = new Set(nextKeys);
    for (const k of prevSet)
      if (!nextSet.has(k)) {
        const set = grid.get(k);
        if (set) {
          set.delete(id);
          if (set.size === 0) grid.delete(k);
        }
      }
    // Add to new cells
    for (const k of nextSet)
      if (!prevSet.has(k)) {
        let set = grid.get(k);
        if (!set) {
          set = new Set<string>();
          grid.set(k, set);
        }
        set.add(id);
      }
    occupancy.set(id, nextKeys);
  }
  function collectVisibleEntityIds(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): string[] {
    // Re-enable spatial culling
    const cellMinX = Math.floor(rect.x / spatialCellSize);
    const cellMinY = Math.floor(rect.y / spatialCellSize);
    const cellMaxX = Math.floor((rect.x + rect.width) / spatialCellSize);
    const cellMaxY = Math.floor((rect.y + rect.height) / spatialCellSize);
    const resultSet = new Set<string>();
    for (let cy = cellMinY; cy <= cellMaxY; cy++) {
      for (let cx = cellMinX; cx <= cellMaxX; cx++) {
        const set = grid.get(cellKey(cx, cy));
        if (!set) continue;
        for (const id of set) resultSet.add(id);
      }
    }
    if (resultSet.size === 0) return entitiesKeys.slice();
    return Array.from(resultSet);
  }

  (cache as any).default = new Image();

  [
    LOAD_COMPLETE_EVT,
    START_EVT,
    RENDER_EVT,
    UPDATE_EVT,
    PAUSE_EVT,
    PHYSICS_EVT,
  ].forEach((evtKey) => addEvent(evtKey));

  function emit(eventName: string, data?: any) {
    const e = events[eventName];
    if (!e) return;
    for (let i = 0; i < e.subscribers.length; i++) e.subscribers[i](data);
  }

  function on(event: string, callback: EventCallback) {
    if (events[event]) {
      events[event].subscribers.push(callback);
    }
  }

  function addEvent(name: string) {
    events[name] = { subscribers: [] };
  }

  function removeEvent(name: string) {
    const { [name]: _deleted, ...others } = events;
    events = others;
    return events;
  }

  function getEntity(id: string) {
    return entities[id];
  }

  function registerEntity(...targets: Entity[]) {
    const proxies: Entity[] = [];
    targets.forEach((entity) => {
      const { id } = entity;
      // Install reactive transform props so grid updates even if user mutates the original object
      (function setupReactiveTransform(target: any, entId: string) {
        let bx = target.x ?? 0;
        let by = target.y ?? 0;
        let bw = target.width ?? 0;
        let bh = target.height ?? 0;
        let bvis = target.visible !== false;
        const recompute = (
          px: number,
          py: number,
          pw: number,
          ph: number,
          pvis: boolean,
          nx: number,
          ny: number,
          nw: number,
          nh: number,
          nvis: boolean
        ) => {
          const had = pvis && pw > 0 && ph > 0;
          const have = nvis && nw > 0 && nh > 0;
          if (had && !have) {
            removeFromGrid(entId);
          } else if (!had && have) {
            insertToGrid(entId, aabbToCells(nx, ny, nw, nh));
          } else if (had && have) {
            updateInGrid(entId, aabbToCells(nx, ny, nw, nh));
          }
        };
        const define = (prop: "x" | "y" | "width" | "height" | "visible") => {
          const desc: any = {
            configurable: true,
            enumerable: true,
          };
          if (prop === "visible") {
            desc.get = () => bvis;
            desc.set = (v: any) => {
              const pv = bvis;
              bvis = !!v;
              recompute(bx, by, bw, bh, pv, bx, by, bw, bh, bvis);
            };
          } else if (prop === "x") {
            desc.get = () => bx;
            desc.set = (v: any) => {
              const px0 = bx;
              bx = Number(v) || 0;
              recompute(px0, by, bw, bh, bvis, bx, by, bw, bh, bvis);
            };
          } else if (prop === "y") {
            desc.get = () => by;
            desc.set = (v: any) => {
              const py0 = by;
              by = Number(v) || 0;
              recompute(bx, py0, bw, bh, bvis, bx, by, bw, bh, bvis);
            };
          } else if (prop === "width") {
            desc.get = () => bw;
            desc.set = (v: any) => {
              const pw0 = bw;
              bw = Math.max(0, Number(v) || 0);
              recompute(bx, by, pw0, bh, bvis, bx, by, bw, bh, bvis);
            };
          } else if (prop === "height") {
            desc.get = () => bh;
            desc.set = (v: any) => {
              const ph0 = bh;
              bh = Math.max(0, Number(v) || 0);
              recompute(bx, by, bw, ph0, bvis, bx, by, bw, bh, bvis);
            };
          }
          Object.defineProperty(target, prop, desc);
        };
        define("x");
        define("y");
        define("width");
        define("height");
        define("visible");
        // Initialize occupancy with current values
        if (bvis && bw > 0 && bh > 0)
          insertToGrid(entId, aabbToCells(bx, by, bw, bh));
      })(entity as any, id);

      const proxy = new Proxy(entity, {
        set(target, prop: string | symbol, value) {
          const p = String(prop);
          if (
            p === "x" ||
            p === "y" ||
            p === "width" ||
            p === "height" ||
            p === "visible"
          ) {
            // Delegate to reactive descriptor setter installed above
            (target as any)[p] = value as any;
            return true;
          }
          (target as any)[p] = value as any;
          return true;
        },
      });
      entitiesKeys.unshift(id);
      entities[id] = proxy;
      proxies.push(proxy);
    });
    return proxies;
  }

  function unregisterEntity(...targets: Entity[]) {
    targets.forEach((entity) => {
      const { id } = entity;
      entitiesKeys = entitiesKeys.filter((currId) => currId !== id);
      const { [id]: _deleted, ...others } = entities as any;
      entities = others;
      removeFromGrid(id);
    });
    return { entitiesKeys, entities };
  }

  function clearEntities() {
    entitiesKeys.length = 0;
    entities = {};
    grid.clear();
    occupancy.clear();
  }

  function load(
    assets: Array<{ resId: string; type: string; src: string }> = []
  ) {
    const loaders = assets.map(({ resId, type, src }) => {
      return new Promise((resolve, reject) => {
        const asset: HTMLImageElement | HTMLAudioElement =
          type === ASSET_TYPE_IMAGE ? new Image() : new Audio();
        (asset as any).src = src;
        (asset as any)[
          type === ASSET_TYPE_IMAGE ? "onload" : "oncanplaythrough"
        ] = () => {
          cache[type][resId] = asset as any;
          resolve(asset);
        };
        (asset as any).onerror = () => reject(src);
      });
    });

    Promise.all(loaders)
      .then(() => {
        emit(LOAD_COMPLETE_EVT, cache);
      })
      .catch((e) => {
        console.log(
          `Error loading your assets 8-| [[psss!!... check path: ${e}]`
        );
        setTimeout(function () {
          throw e;
        });
      });
  }

  // Convenience asset loaders
  function loadImages(images: Record<string, string>) {
    const items = Object.keys(images).map((id) => ({
      resId: id,
      type: ASSET_TYPE_IMAGE,
      src: images[id],
    }));
    load(items);
  }
  function loadAudioMap(audios: Record<string, string>) {
    const items = Object.keys(audios).map((id) => ({
      resId: id,
      type: ASSET_TYPE_AUDIO,
      src: audios[id],
    }));
    load(items);
  }

  function extend(...args: any[]) {
    extensions.push(...args);
    return gameInstance as any;
  }

  function accessPrivateRegistry(functionName: string) {
    switch (functionName) {
      case "update":
        return update;
      case "render":
        return render;
    }
  }

  function replacePrivateRegistry(functionName: string, func: any) {
    switch (functionName) {
      case "update":
        update = func;
        break;
      case "render":
        render = func;
        break;
    }
  }

  function decorate(
    game: any,
    functionName: "update" | "render" | string,
    ...decorators: Array<(fn: any) => any>
  ) {
    let target = accessPrivateRegistry(functionName);
    if (!target) {
      target = (game as any)[functionName];
    }
    if (target && target instanceof Function && decorators.length > 0) {
      const decorated = compose<any>(...(decorators as any))(target);
      replacePrivateRegistry(functionName, decorated);
    }
  }

  function start() {
    // Initialize GL renderer last subscriber for render (to draw after others push)
    glRenderer.start(gameInstance);
    extensions.forEach((extension) => {
      if (extension.start) extension.start(gameInstance, cache);
    });
    emit(START_EVT);
    gameLoop();
  }

  function resume() {
    paused = false;
    lastFrameTime = Date.now();
    emit(PAUSE_EVT, false);
    gameLoop();
  }

  function pause() {
    paused = true;
    emit(PAUSE_EVT, true);
  }

  // Fixed-step physics before variable-step update
  let physicsAccumulator = 0;
  const fixedStep = 1 / 120; // 120 Hz

  let update = (dt: number) => {
    physicsAccumulator += dt;
    while (physicsAccumulator >= fixedStep) {
      emit(PHYSICS_EVT, fixedStep);
      physicsAccumulator -= fixedStep;
    }
    emit(UPDATE_EVT, dt);
    extensions.forEach((extension) => {
      if (extension.update) extension.update(dt);
    });
    for (let i = 0; i < entitiesKeys.length; i++) {
      entities[entitiesKeys[i]].update(dt);
    }
  };

  let render = (gameCtx: CanvasRenderingContext2D, cacheObj: any) => {
    // 2D clear only if needed; GL does its own clear
    // gameCtx.fillRect(0, 0, width, height);

    // Prepare GL frame and view
    glRenderer.setViewRect(
      viewRect.x,
      viewRect.y,
      viewRect.width,
      viewRect.height
    );
    (glRenderer as any).beginFrame?.();

    // Collect entities to GL batches (z-order aware)
    const candidates = collectVisibleEntityIds(viewRect);
    const ordered = candidates
      .map((id) => entities[id] as any)
      .filter(Boolean)
      .sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || 0);
    for (let i = 0; i < ordered.length; i++) {
      const e = ordered[i] as any;
      if (!e || e.visible === false) continue;
      // Tilemap fast path
      if ((e as any).isTilemap) {
        const tm = e as any;
        const image = cacheObj.image[tm.resId] || cacheObj.default;
        const tileSize = tm.tileSize as number;
        const sheetColumns = tm.sheetColumns as number;
        const startCol = Math.max(
          0,
          Math.floor((viewRect.x - tm.x) / tileSize)
        );
        const endCol = Math.min(
          tm.mapCols - 1,
          Math.floor((viewRect.x + viewRect.width - tm.x) / tileSize)
        );
        const startRow = Math.max(
          0,
          Math.floor((viewRect.y - tm.y) / tileSize)
        );
        const endRow = Math.min(
          tm.mapRows - 1,
          Math.floor((viewRect.y + viewRect.height - tm.y) / tileSize)
        );
        for (let ry = startRow; ry <= endRow; ry++) {
          for (let rx = startCol; rx <= endCol; rx++) {
            const idx = tm.map[ry][rx];
            if (idx < 0) continue;
            const sx = idx % sheetColumns;
            const sy = Math.floor(idx / sheetColumns);
            const u0 = (sx * tileSize) / image.width;
            const v0 = (sy * tileSize) / image.height;
            const u1 = ((sx + 1) * tileSize) / image.width;
            const v1 = ((sy + 1) * tileSize) / image.height;
            glRenderer.pushSprite(image, {
              x: tm.x + rx * tileSize,
              y: tm.y + ry * tileSize,
              width: tileSize,
              height: tileSize,
              u0,
              v0,
              u1,
              v1,
            });
          }
        }
        continue;
      }

      // Sprite / animated sprite
      const image = cacheObj.image[e.resId] || cacheObj.default;
      // If the resId image isn't loaded yet, skip drawing just this entity
      if (
        !image ||
        !(image instanceof HTMLImageElement) ||
        !image.width ||
        !image.height
      ) {
        continue;
      }
      let u0 = 0,
        v0 = 0,
        u1 = 1,
        v1 = 1;
      if (
        typeof e.getCurrentClip === "function" &&
        typeof e.columns === "number" &&
        typeof e.rows === "number"
      ) {
        const clip = e.getCurrentClip();
        if (clip) {
          const col = clip.idx % e.columns | 0;
          const row = Math.floor(clip.idx / e.columns) % e.rows | 0;
          const tileW = image.width / e.columns;
          const tileH = image.height / e.rows;
          u0 = (col * tileW) / image.width;
          v0 = (row * tileH) / image.height;
          u1 = ((col + 1) * tileW) / image.width;
          v1 = ((row + 1) * tileH) / image.height;
          // Clamp UVs to [0,1] to avoid sampling outside texture if crop metadata doesn't match
          u0 = Math.max(0, Math.min(1, u0));
          v0 = Math.max(0, Math.min(1, v0));
          u1 = Math.max(0, Math.min(1, u1));
          v1 = Math.max(0, Math.min(1, v1));
          if (u1 <= u0 || v1 <= v0) {
            // invalid rect, skip
            continue;
          }
        }
      }
      const sx = (e.x as number) - viewRect.x;
      const sy = (e.y as number) - viewRect.y;
      glRenderer.pushSprite(image, {
        x: sx,
        y: sy,
        width: e.width,
        height: e.height,
        u0,
        v0,
        u1,
        v1,
      });
      if (e.id === "player") {
        (window as any).__dbg = {
          sx,
          sy,
          w: e.width,
          h: e.height,
          uv: [u0, v0, u1, v1],
        };
      }
    }

    // Allow user code to participate before we flush GL
    emit(RENDER_EVT, {
      ctx: gameCtx,
      cache: cacheObj,
      gl: glRenderer,
      viewRect,
    });
    (glRenderer as any).flush?.();
  };

  function gameLoop() {
    const now = Date.now();
    deltaTime = (now - lastFrameTime) / 1000.0;
    update(deltaTime);
    render(ctx, cache);
    lastFrameTime = now;
    requestAnimationID = !paused ? requestAnimationFrame(gameLoop) : -1;
  }

  function setClearColor(color: string) {
    ctx.fillStyle = color;
  }

  function setViewRect(x: number, y: number, w: number, h: number) {
    viewRect = { x, y, width: w, height: h };
  }
  function setSpatialCellSize(size: number) {
    spatialCellSize = Math.max(16, size | 0);
    // Rebuild occupancy at new resolution
    grid.clear();
    occupancy.clear();
    for (let i = 0; i < entitiesKeys.length; i++) {
      const e = entities[entitiesKeys[i]] as any;
      if (!e || e.visible === false) continue;
      const w = e.width ?? 0,
        h = e.height ?? 0;
      if (w <= 0 || h <= 0) continue;
      insertToGrid(e.id, aabbToCells(e.x ?? 0, e.y ?? 0, w, h));
    }
  }

  ctx.fillRect(0, 0, width, height);

  const gameInstance: Game = {
    keys,
    emit,
    on,
    // convenience
    onLoadComplete: (cb: EventCallback) => {
      on(LOAD_COMPLETE_EVT, cb);
      return gameInstance as any;
    },
    onUpdate: (cb: EventCallback) => {
      on(UPDATE_EVT, cb);
      return gameInstance as any;
    },
    onRender: (cb: EventCallback) => {
      on(RENDER_EVT, cb);
      return gameInstance as any;
    },
    addEvent,
    removeEvent,
    getEntity,
    registerEntity,
    unregisterEntity,
    clearEntities,
    load,
    loadImages,
    loadAudio: loadAudioMap,
    extend,
    decorate,
    start,
    resume,
    pause,
    setClearColor,
    setViewRect,
    setSpatialCellSize,
  } as any;

  return gameInstance;
}
