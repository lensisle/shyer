const imagePromises = [];
const audioPromises = [];

async function showPreloadImage(preloadImage) {

  const { src, width, height } = preloadImage;

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

  return await Promise.all([imagePromises, audioPromises]);
}

function SceneFactory(sceneObject) {

  let scene = ['load', 'start', 'update', 'exit'].reduce((accum, key) => {
    accum[key] = (sceneObject[key] || function () {}).bind (sceneObject);
    return accum;
  }, sceneObject);

  const events = {};
  const cache = {
    images: {},
    audios: {}
  };

  function loadImage(id, src) {
    const imagePromise = new Promise((resolve, reject) => {
      const asset = new Image();
      asset.src = src;
      asset.onload = () => {
        cache['images'][id] = asset;
        resolve(asset);
      };
      asset.onerror = () => reject(src);
    }).catch((e) => {
      console.error(`Error loading asset file id ${id}: ${e}`);
    });
    imagePromises.push(imagePromise);
  }
  
  function loadAudio(id, src) {
    const audioPromise = new Promise((resolve, reject) => {
      const asset = new Audio();
      asset.src = src;
      asset.oncanplaythrough = () => {
        cache['audios'][id] = asset;
        resolve(asset);
      };
      asset.onerror = () => reject(src);
    }).catch((e) => {
      console.error(`Error loading asset file id ${id}: ${e}`);
    });
    audioPromises.push(audioPromise);
  }
  
  function listen(name, callback) {
    callback = (callback || function () {}).bind(scene);
    if (!scene.events[name]) {
      scene.events[name] = [];
    }
    scene.events[name].push(callback);
  }

  Object.defineProperty(scene, 'events', {
    
    get: function() {
      return events;
    }

  });

  Object.defineProperty(scene, 'listen', {

    get: function() {
      return listen;
    }

  });

  Object.defineProperty(scene, 'loadImage', {
    get: function() {
      return loadImage;
    }
  });

  return scene;
}