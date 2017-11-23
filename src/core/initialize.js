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

    });
  };
}

export function mixState(Shyer) {
  const globalEvents = {};
  const store = {};
  const scenes = {};

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
}

export function mixAPI(Shyer) {
  Shyer.prototype.Preload = function(scenesIds = [], fallbackScene) {

  };

  Shyer.prototype.AddGlobalEvent = function(eventId, callback) {

  };

  Shyer.prototype.ChangeScene = function(sceneId) {

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
