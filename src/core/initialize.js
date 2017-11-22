import createCanvas from './canvas';

export function initMixin(Shyer) {
  Shyer.prototype._initialize = function(options) {
    
    createCanvas.call(this, options);

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

  Shyer.prototype.Scene = function(id, sceneObject) {
    
  };

  Shyer.prototype.AddGlobalEvent = function(eventId, callback) {

  };

  Shyer.prototype.ChangeScene = function() {

  };

  Shyer.prototype.Send = function(eventName, data) {

  };
}
