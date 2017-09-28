import compose from './utils/compose';

export const ASSET_TYPE_IMAGE = 'image';
export const ASSET_TYPE_AUDIO = 'audio';
export const LOAD_COMPLETE_EVENT = 'loadcomplete';
export const UPDATE_EVENT = 'update';
export const PAUSE_EVENT = 'pause';

export function createGame(width, height) {
  let cache = {};
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
  let nativeUpdateEnabled = true;
  let nativeRenderEnabled = true;

  const clearColor = '#D90368';

  const canvas = document.createElement('canvas');
  canvas['id'] = 'vuni-root';
  canvas['width'] = width;
  canvas['height'] = height;
  canvas['tabIndex'] = 1000;
  canvas['style']['outline'] = 'none';

  document.body.appendChild(canvas);

  const ctx = canvas.getContext`2d`;
  ctx.fillStyle = clearColor;

  cache.default = new Image();

  [UPDATE_EVENT, LOAD_COMPLETE_EVENT, PAUSE_EVENT].forEach(evtKey =>
    addEvent(evtKey)
  );

  const onInput = value => (evt = window.event) => {
    const { keyCode } = evt;
    const key =
      keyCode === 37
        ? 'left'
        : keyCode === 38
          ? 'up'
          : keyCode === 39 ? 'right' : keyCode === 40 ? 'down' : '';
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
  function registerSprites() {
    const sprites = Array.prototype.slice.call(arguments, 0);
    sprites.forEach(sprite => {
      const { id } = sprite;
      entitiesKeys.unshift(id);
      entities[id] = sprite;
    });
    return sprites;
  }

  // public
  function unregisterSprites(sprites) {
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
    const loaders = assets.map(({ type, src }) => {
      return new Promise((resolve, reject) => {
        const asset = type === ASSET_TYPE_IMAGE ? new Image() : new Audio();
        asset.src = src;
        asset[type === ASSET_TYPE_IMAGE ? 'onload' : 'oncanplaythrough'] = () =>
          resolve(asset);
        asset.onerror = () => reject(src);
      });
    });

    let cache;
    Promise.all(loaders)
      .then(loadedAssets => {
        emit(events, LOAD_COMPLETE_EVENT, cache);
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

  // public
  function decorate(vuni, functionName, decorators) {
    if (vuni[functionName] && vuni[functionName] instanceof Function && decorators.length > 0) {
      const decorated = compose(...decorators)(vuni[functionName]);
      vuni[functionName] = decorated;
    }
    return vuni;
  }

  // public
  function start() {
    extensions.forEach(extension => {
      if (extension.start) extension.start(this);
    });
    entitiesKeys.forEach(key => entities[key].start(dt));
    gameLoop();
  }

  // public
  function resume() {
    paused = false;
    lastFrameTime = Date.now();
    gameLoop();
  }

  // public
  function pause() {
    paused = true;
    emit(events, PAUSE_EVENT);
  }

  // public
  function setNativeUpdateEnabled(enabled) {
    nativeUpdateEnabled = enabled;
  }

  function setNativeRenderEnabled(enabled) {
    nativeRenderEnabled = enabled;
  }

  function update(dt) {
    extensions.forEach(extension => {
      if (extension.update) extension.update(dt);
    });
    if(!nativeUpdateEnabled) return;
    entitiesKeys.forEach(key => entities[key].update(dt));
  }

  function render() {
    ctx.fillRect(0, 0, width, height);
    extensions.forEach(extension => {
      if (extension.render) extension.render(ctx, cache);
    });
    if(!nativeRenderEnabled) return;
    for (let i = 0, max = entitiesKeys.length; i < max; i++) {
      const key = entitiesKeys[i];
      const entity = entities[key];
      entity.render(ctx, cache);
    }
  }

  function gameLoop() {
    const now = Date.now();
    deltaTime = (now - lastFrameTime) / 1000.0;
    emit(events, UPDATE_EVENT, deltaTime);
    update(deltaTime);
    render();
    lastFrameTime = now;
    requestAnimationID = !paused ? requestAnimationFrame(gameLoop) : -1;
  }

  render();

  return {
    keys,
    emit,
    on,
    addEvent,
    removeEvent,
    registerSprites,
    unregisterSprites,
    clearEntities,
    load,
    extend,
    decorate,
    start,
    resume,
    pause,
    setNativeUpdateEnabled,
    setNativeRenderEnabled
  };
}
