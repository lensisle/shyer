import createCanvas from './canvas';
import loadScenes from './scene';
import requestAnimationFrame from '../utils/requestAnimationFrame';

export function initMixin(Shyer) {
  Shyer.prototype._initialize = function(options, scenes) {
    
    if (options.preloadImage) {
      options.ignoreDefaultLogo = true;
    }

    createCanvas.call(this, options);
    loadScenes.call(this, scenes, options.preloadImage).then((result) => {

      this._clearScreen();

      if (options.initScene) {
        this.changeScene(options.initScene);
      } else {
        const defaultSceneName = scenes[0].name || 'scene-0';
        this.changeScene(defaultSceneName);
      }

      this._gameLoop();

    });
  };
}

export function mixState(Shyer) {
  const globalEvents = {};
  const store = {};
  const scenes = {};

  let currentSceneName = '';
  let gamePaused = false; 

  Object.defineProperty(Shyer.prototype, '_globalEvents', {
    get: function () {
      return globalEvents;
    }
  });

  Object.defineProperty(Shyer.prototype, '_store', {
    get: function() {
      return store;
    }
  });

  Object.defineProperty(Shyer.prototype, '_scenes', {
    get: function() {
      return scenes;
    }
  });

  Object.defineProperty(Shyer.prototype, '_currentSceneName', {
    
    get: function() {
      return currentSceneName;
    },

    set: function(value) {
      if (value && scenes[value]) {
        currentSceneName = value;
      }
    }

  });

  Object.defineProperty(Shyer.prototype, '_gamePaused', {
    
    get: function() {
      return gamePaused;
    },

    set: function(value) {
      gamePaused = value;
    }

  });
}

export function mixAPI(Shyer) {
  Shyer.prototype.loadScene = function(sceneObject, onLoadCallback) {

  };

  Shyer.prototype.addGlobalEvent = function(eventId, callback) {

  };

  Shyer.prototype.changeScene = function(sceneName) {
    
    const previousScene = this._scenes[this._currentSceneName];
    if (previousScene) {
      previousScene.exit();
    }

    const scene = this._scenes[sceneName];

    if (!scene) {
      console.log(`Scene ${sceneName} not found!`);
      return;
    }

    if (!scene.isLoaded) {
      console.error(`Scene ${sceneName} is not loaded!`);
      return;
    }
    
    this._currentSceneName = sceneName;
    scene.start();
  };

  Shyer.prototype.send = function(eventName, data) {
    const currentScene = this._scenes[this._currentSceneName];
    currentScene.events[eventName].forEach(listener => {
      listener(data);
    });
  };
}

export function mixLifecycle(Shyer) {

  let lastFrameTime = Date.now();
  let deltaTime = 0;
  let requestAnimationID = 0;

  function render(ctx) {
    const currentScene = this._scenes[this._currentSceneName];
    if (currentScene) {

      for (const key of Object.keys(currentScene.entities)) {
        currentScene.entities[key].render(ctx);
      }
      
    }
  }

  function update(dt) {
    const currentScene = this._scenes[this._currentSceneName];
    if (currentScene) {

      for (const key of Object.keys(currentScene.entities)) {
        currentScene.entities[key].update(dt);
      }

      currentScene.update(dt);
      
    }
  }

  Shyer.prototype._clearScreen = function() {
    const { width, height } = this._dimensions;
    this._ctx.fillRect(0, 0, width, height);
  };

  Shyer.prototype._gameLoop = function() {
    const now = Date.now();
    deltaTime = (now - lastFrameTime) / 1000.0;
    update.call(this, deltaTime);
    render.call(this, this._ctx);
    lastFrameTime = now;
    requestAnimationID = !this._gamePaused ? requestAnimationFrame(this._gameLoop) : -1;
  }

  Shyer.prototype._gameLoop = Shyer.prototype._gameLoop.bind(Shyer.prototype);
}
