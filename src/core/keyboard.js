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

const keyDownListener = function(event) {
  const { keyCode } = event;
  const keyName = keyMap[keyCode];
  const key = this.keyboard._keys[keyName];
  if (key) {
    key.pressed = true;
  }
};

const keyUpListener = function(event) {
  const { keyCode } = event;
  const keyName = keyMap[keyCode];
  const key = this.keyboard._keys[keyName];
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

  window.addEventListener('keydown', keyDownListener.bind(this), false);

  window.addEventListener('keyup', keyUpListener.bind(this), false);

  Object.defineProperty(this, 'keyboard', {
    enumerable: true,
    get: function() {
      return keyboard;
    }

  });

  return keyboard;
}

export function unsubscribeKeyboard() {
  window.removeEventListener('keydown', keyDownListener);
  window.removeEventListener('keyup', keyUpListener);
}