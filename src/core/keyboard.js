import keyMap from './keymap';

function hasKey(key) {
  return !!keyMap[key];
}

function createKey(key) {

  const keyObject = {};

  const keyCode = keyMap[key.toUpperCase()];
  keyObject.key = key;
  keyObject.keyCode = keyCode;
  keyObject.pressed = false;

  return keyObject;
}

function Keyboard() {

  this.keys = {};

}

Keyboard.prototype.keys = function(keys = []) {

  keys.forEach((key) => {

    if (hasKey(key)) {
      const key = createKey(key);
      this.keys[key.keyCode] = key;
    } else {
      console.error(`Keycode not found for key ${key}`);
    }

  });

};

Keyboard.prototype.isPressed = function(key) {

  return hasKey(key) && ;
};

const keyDownListener = (event) => {
  const { keyCode } = event;
  keyboard[keyCode].pressed = true;
};

const keyUpListener = (event) => {
  const { keyCode } = event;
  keyboard[keyCode].pressed = false;
};

export function initKeyboard(auto = true) {

  const keyboard = new Keyboard();

  if (auto) {

    keyboard.keys([
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

  }

  window.addEventListener('keydown', keyDownListener, false);

  window.addEventListener('keyup', keyUpListener, false);

  Object.defineProperty(this, 'keyboard', {

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