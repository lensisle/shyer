import { initKeyboard } from './keyboard';
import { initMouse } from './mouse';
import { SpriteFactory } from './sprite';

const imagePromises = [];
const audioPromises = [];

async function showPreloadImage(preloadImage) {

  const { src, width = 300, height = 300 } = preloadImage;

  const preloadPromise = new Promise((resolve, reject) => {
    const preloadImage = new Image();
    preloadImage.src = src;
    preloadImage.onload = () => {
      resolve(preloadImage);
    };
  });

  const logo = await preloadPromise;
  const { width: canvasWidth, height: canvasHeight } = this._dimensions;
  this._ctx.drawImage(
    logo,
    (canvasWidth * 0.5) - (width / 2),
    (canvasHeight * 0.5) - (height / 2),
    width, height
  );
} 

export default async function loadScenes(scenes, preloadImage) {

  if (preloadImage) {
    await showPreloadImage.call(this, preloadImage);
  }

  for (let i = 0; i < scenes.length; i++) {

    const scene = SceneFactory(scenes[i]);
    if (!scenes[i].name) {
      scenes[i].name = `scene-${i}`;
    }
    this._scenes[scenes[i].name] = scene;
    scene.load();

  }

  return Promise.all([...imagePromises, ...audioPromises]);
}

function SceneFactory(sceneObject) {

  let scene = ['load', 'start', 'update', 'exit'].reduce((accum, key) => {
    accum[key] = (sceneObject[key] || function () {}).bind (sceneObject);
    return accum;
  }, sceneObject);

  Object.defineProperty(scene, '_ctx', {
    configurable: true,
    value: null
  });

  const cache = {
    images: {},
    audios: {}
  };

  const entitiesObjects = [];
  const audioObjects = [];

  let loadCount = 0;
  let loadedCount = 0;

  const loadProperties = {
    images: 'onload',
    audios: 'oncanplaythrough'
  };

  function getLoadFunc(type) {
    const loadProperty = loadProperties[type];
    return function(id, src) {
      const loadPromise = new Promise((resolve, reject) => {
        const asset =
          type === 'images' ? new Image() :
          type === 'audios' ? new Audio() :
          null;
        if (asset === null) {
          reject(`Wrong asset type ${type}`);
        }  
        asset.src = src;
        asset[loadProperty] = () => {
          cache[type][id] = asset;
          loadedCount++;
          resolve(asset);
        };
        asset.onerror = () => reject(src);
      }).catch((e) => {
        console.error(`Error loading asset file id ${id}: ${e}`);
      });
      return loadPromise;
    }
  }

  function loadImage(id, src) {
    const loadFunc = getLoadFunc('images');
    const loadPromise = loadFunc(id, src);
    imagePromises.push(loadPromise);
    loadCount++;
  }
  
  function loadAudio(id, src) {
    const loadFunc = getLoadFunc('audios');
    const loadPromise = loadFunc(id, src);
    audioPromises.push(loadPromise);
    loadCount++;
  }

  Object.defineProperty(scene, 'loadImage', {
    get: function() {
      return loadImage;
    }
  });

  Object.defineProperty(scene, 'loadAudio', {
    get: function() {
      return loadAudio;
    }
  });

  Object.defineProperty(scene, 'isLoaded', {
    enumerable: true,
    get: function() {
      return loadCount <= loadedCount;
    }
  });

  Object.defineProperty(scene, '_entities', {
    get: function() {
      return entitiesObjects;
    }
  })

  Object.defineProperty(scene, 'initKeyboard', {
    get: function() {
      return initKeyboard;
    }
  });

  Object.defineProperty(scene, 'initMouse', {
    get: function() {
      return initMouse;
    }
  });

  const spriteFactory = SpriteFactory.call(scene, cache, entitiesObjects);

  Object.defineProperty(scene, 'sprite', {
    get: function() {
      return spriteFactory;
    }
  });

  return scene;
}