import createCanvas from './canvas';
import loadScenes from './scene';

export function initMixin(Shyer) {
  Shyer.prototype._initialize = function(options, scenes) {
    
    if (options.preloadImage) {
      options.ignoreDefaultLogo = true;
    }

    createCanvas.call(this, options);
    loadScenes.call(this, scenes, options.preloadImage).then((result) => {
      
      this._clearScreen();
      if (options.initScene) {
        this.ChangeScene(options.initScene);
      } else {
        const defaultSceneName = scenes[0].name || 'scene-0';
        this.ChangeScene(defaultSceneName);
      }

    });
  };
}

export function mixState(Shyer) {
  const globalEvents = {};
  const store = {};
  const scenes = {};
  let currentSceneName = '';

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
}

export function mixAPI(Shyer) {
  Shyer.prototype.LoadScene = function(sceneObject, onLoadCallback) {

  };

  Shyer.prototype.AddGlobalEvent = function(eventId, callback) {

  };

  Shyer.prototype.ChangeScene = function(sceneName) {
    const previousScene = this._scenes[this._currentSceneName];
    if (previousScene) {
      previousScene.exit();
    }

    const scene = this._scenes[sceneName];
    if (!scene.isLoaded) {
      console.error(`Scene ${sceneName} is not loaded!`);
      return;
    }
    
    this._currentSceneName = sceneName;
    scene.start();
  };

  Shyer.prototype.Send = function(eventName, data) {

  };
}

export function mixLifecycle(Shyer) {

  Shyer.prototype._render = function () {

  };

  Shyer.prototype._update = function() {

  };

  Shyer.prototype._clearScreen = function() {
    const { width, height } = this._dimensions;
    this._ctx.fillRect(0, 0, width, height);
  };
}
