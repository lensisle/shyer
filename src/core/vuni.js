import compose from "../utils/compose";

export const ASSET_TYPE_IMAGE = "image";
export const ASSET_TYPE_AUDIO = "audio";

export const LOAD_COMPLETE_EVT = "loadcomplete";
export const START_EVT = "start";
export const RENDER_EVT = "render";
export const UPDATE_EVT = "update";
export const PAUSE_EVT = "pause";

export function createGame(width, height) {
  let cache = { image: {}, audio: {} };
  let lastFrameTime = Date.now();
  let requestAnimationID;
  let deltaTime = 0;
  let entitiesKeys = [];
  let entities = {};
  let events = {};
  let extensions = [];
  let paused = false;
  let keys = {
    left: false,
    right: false,
    up: false,
    down: false
  };

  const clearColor = "#D90368";

  const canvas = document.createElement("canvas");
  canvas["id"] = "vuni-root";
  canvas["width"] = width;
  canvas["height"] = height;
  canvas["tabIndex"] = 1000;
  canvas["style"]["outline"] = "none";

  document.body.appendChild(canvas);

  const ctx = canvas.getContext`2d`;
  ctx.fillStyle = clearColor;

  cache.default = new Image();

  [
    LOAD_COMPLETE_EVT,
    START_EVT,
    RENDER_EVT,
    UPDATE_EVT,
    PAUSE_EVT
  ].forEach(evtKey => addEvent(evtKey));

  const onInput = value => (evt = window.event) => {
    const { keyCode } = evt;
    const key =
      keyCode === 37
        ? "left"
        : keyCode === 38
          ? "up"
          : keyCode === 39 ? "right" : keyCode === 40 ? "down" : "";
    keys[key] = value;
  };

  canvas.onkeydown = onInput(true);
  canvas.onkeyup = onInput(false);

  // public
  function emit(events, eventName, data) {
    events[eventName].subscribers.forEach(sub => sub(data));
  }

  // public
  function on(event, callback) {
    if (events[event]) {
      events[event].subscribers.push(callback);
    }
  }

  // public
  function addEvent(name) {
    events[name] = { subscribers: [] };
  }

  // public
  function removeEvent(name) {
    const { [name]: deleted, ...others } = events;
    events = others;
    return events;
  }

  // public
  function getEntity(id) {
    return entities[id];
  }

  // public
  function registerEntity() {
    const sprites = Array.prototype.slice.call(arguments, 0);
    sprites.forEach(sprite => {
      const { id } = sprite;
      entitiesKeys.unshift(id);
      entities[id] = sprite;
    });
    return sprites;
  }

  // public
  function unregisterEntity(sprites) {
    sprites.forEach(sprite => {
      const { id } = sprite;
      entitiesKeys = entitiesKeys.filter(({ currId }) => currId !== id);
      const { [id]: deleted, ...others } = entities;
      entities = others;
    });
    return { entitiesKeys, entities };
  }

  // public
  function clearEntities() {
    entitiesKeys.length = 0;
    entities = {};
  }

  // public
  async function load(assets = []) {
    const loaders = assets.map(({ resId, type, src }) => {
      return new Promise((resolve, reject) => {
        const asset = type === ASSET_TYPE_IMAGE ? new Image() : new Audio();
        asset.src = src;
        asset[
          type === ASSET_TYPE_IMAGE ? "onload" : "oncanplaythrough"
        ] = () => {
          cache[type][resId] = asset;
          resolve(asset);
        };
        asset.onerror = () => reject(src);
      });
    });

    Promise.all(loaders)
      .then(loadedAssets => {
        emit(events, LOAD_COMPLETE_EVT, cache);
      })
      .catch(e => {
        console.log(
          `Error loading your assets 8-| [[psss!!... check path: ${e}]`
        );
        setTimeout(function() {
          throw e;
        });
      });
  }

  // public
  function extend() {
    const args = Array.prototype.slice.call(arguments, 0);
    extensions.push(...args);
    return this;
  }

  // private
  function accessPrivateRegistry(functionName) {
    switch (functionName) {
      case "update":
        return update;
      case "render":
        return render;
    }
  }

  // private
  function replacePrivateRegistry(functionName, func) {
    switch (functionName) {
      case "update":
        update = func;
        break;
      case "render":
        render = func;
        break;
    }
  }

  // public
  function decorate(vuni, functionName, ...decorators) {
    let target = accessPrivateRegistry(functionName);
    if (!target) {
      target = vuni[functionName];
    }
    if (target && target instanceof Function && decorators.length > 0) {
      const decorated = compose(...decorators)(target);
      replacePrivateRegistry(functionName, decorated);
    }
  }

  // public
  function start() {
    extensions.forEach(extension => {
      if (extension.start) extension.start(this);
    });
    emit(events, START_EVT);
    gameLoop();
  }

  // public
  function resume() {
    paused = false;
    lastFrameTime = Date.now();
    emit(events, PAUSE_EVT, false);
    gameLoop();
  }

  // public
  function pause() {
    paused = true;
    emit(events, PAUSE_EVT, true);
  }

  // private
  function update(dt) {
    emit(events, UPDATE_EVT, dt);
    extensions.forEach(extension => {
      if (extension.update) extension.update(dt);
    });
    entitiesKeys.forEach(key => entities[key].update(dt));
  }

  // private
  function render(ctx, cache) {
    ctx.fillRect(0, 0, width, height);
    emit(events, RENDER_EVT, { ctx, cache });
  }

  // private
  function gameLoop() {
    const now = Date.now();
    deltaTime = (now - lastFrameTime) / 1000.0;
    update(deltaTime);
    render(ctx, cache);
    lastFrameTime = now;
    requestAnimationID = !paused ? requestAnimationFrame(gameLoop) : -1;
  }

  ctx.fillRect(0, 0, width, height);

  return {
    keys,
    emit,
    on,
    addEvent,
    removeEvent,
    getEntity,
    registerEntity,
    unregisterEntity,
    clearEntities,
    load,
    extend,
    decorate,
    start,
    resume,
    pause
  };
}
