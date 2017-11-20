const events = {};

const cache = {};

function SceneFactory(sceneObject) {

  let scene = ['load', 'start', 'update'].reduce((accum, key) => {
    accum[key] = (sceneObject[key] || function () {}).bind (sceneObject);
    return accum;
  }, sceneObject);

  function loadImage(id, src) {

    
  }

  function loadAudio(id, src) {
    
  }

  function listen(name, callback) {

    callback = (callback || function () {}).bind(scene);
    if (!events[name]) {
      events[name] = [];
    }

    events[name].push(callback);

    callback();

  }

  Object.defineProperty(scene, 'listen', {

    get: function() {
      return listen.bind(this);
    }

  });

  return scene;

}

export default SceneFactory;