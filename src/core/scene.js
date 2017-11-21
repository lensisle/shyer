function SceneFactory(sceneObject) {

  let scene = ['load', 'start', 'update'].reduce((accum, key) => {
    accum[key] = (sceneObject[key] || function () {}).bind (sceneObject);
    return accum;
  }, sceneObject);

  const events = {};
  const cache = {};
  const loadPromises = [];

  let loadCounter = 0;

  function loadImage(id, src) {
    const imagePromise = new Promise((resolve, reject) => {
      const asset = new Image();
      asset.src = src;
      asset[onload] = () => {
        cache['images'][resId] = asset;
        resolve(asset);
      };
      asset.onerror = () => reject(src);
    });

    loadPromises.push(imagePromise);
    
    loadCounter++;

    console.log(loadPromises, loadCounter);
  }
  
  function loadAudio(id, src) {

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

export default SceneFactory;