import keyMap from './keymap';

function hasKey(key) {
  let exist = false;
  for (let keyItem of Object.values(keyMap)) {
    if (keyItem === key) {
      exist = true;
      break;
    }
  }
  return exist;
}

function getKey(keyboard, keyCode) {
  const keyName = keyMap[keyCode];
  return keyboard._keys[keyName];
}

function Keyboard() {

  const keys = {};

  Object.defineProperty(this, '_keys', {
    get: function() {
      return keys;
    },
    enumerable: false
  });

}

Keyboard.prototype.setKeys = function(keys = []) {

  keys.forEach((key) => {
    
    const keyName = key.toLowerCase();

    if (hasKey(keyName)) {
      this._keys[keyName] = {};
      this._keys[keyName].pressed = false;
    } else {
      console.error(`Keycode not found for key ${key}`);
    }

  });

};

Keyboard.prototype.isPressed = function(key) {

  if (this._keys[key]) {
    return this._keys[key].pressed;
  }

  return false;
};

Keyboard.prototype.unsubscribe = function() {

  window.removeEventListener('keydown', keyDownListener);
  window.removeEventListener('keyup', keyUpListener);

  for (let key of Object.values(this._keys)) {
    key.pressed = false;
  }
};

let keyDownListener = function(event) {
  event.preventDefault();
  const { keyCode } = event;
  const key = getKey(this.keyboard, keyCode);
  if (key) {
    key.pressed = true;
  }
};

let keyUpListener = function(event) {
  event.preventDefault();
  const { keyCode } = event;
  const key = getKey(this.keyboard, keyCode);
  if (key) {
    key.pressed = false;
  }
};

export function initKeyboard(keys = [], auto = true) {

  const keyboard = new Keyboard();

  if (auto && keys.length < 1) {

    keyboard.setKeys([
      'up',
      'down',
      'left',
      'right',
      'a',
      'b',
      'enter',
      'space',
      'esc'
    ]);

  } else {

    keyboard.setKeys(keys);

  }

  keyDownListener = keyDownListener.bind(this);
  keyUpListener = keyUpListener.bind(this);

  window.addEventListener('keydown', keyDownListener, false);

  window.addEventListener('keyup', keyUpListener, false);

  Object.defineProperty(this, 'keyboard', {
    enumerable: true,
    configurable: true,
    get: function() {
      return keyboard;
    }
  });

  return keyboard;
}
