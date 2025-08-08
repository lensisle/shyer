export type Binding =
  | { kind: "Key"; code: string }
  | { kind: "MouseButton"; button: number }
  | { kind: "MouseWheel"; direction: "up" | "down" }
  | { kind: "GamepadButton"; index: number }
  | { kind: "GamepadAxis"; index: number; sign: 1 | -1; threshold: number };

export interface InputPreset {
  [action: string]: string[];
}

export interface InputOptions {
  deadzone?: number; // gamepad axes
  useWindowListeners?: boolean; // default false -> attach to canvas
}

export interface InputAPI {
  start: (game: any) => void;
  update: (dt: number) => void;
  // action state
  isDown: (action: string) => boolean;
  isPressed: (action: string) => boolean;
  isReleased: (action: string) => boolean;
  getAxis2D: (map: {
    posX: string;
    negX: string;
    posY: string;
    negY: string;
  }) => { x: number; y: number };
  // mapping
  setActionMap: (preset: InputPreset) => void;
  addPreset: (name: string, preset: InputPreset) => void;
  loadPreset: (url: string) => Promise<void>;
  usePreset: (name: string) => void;
  // mouse helpers
  getMouse: () => {
    x: number;
    y: number;
    dx: number;
    dy: number;
    buttons: Set<number>;
  };
}

export function createInputManager(options: InputOptions = {}): InputAPI {
  const deadzone = options.deadzone ?? 0.25;
  let targetEl: HTMLElement | null = null;

  // Raw device states
  const keysDown = new Set<string>();
  const mouseButtons = new Set<number>();
  let mouseX = 0,
    mouseY = 0,
    prevMouseX = 0,
    prevMouseY = 0;
  let wheelUp = false,
    wheelDown = false;

  // Gamepad snapshot
  let pads: (Gamepad | null)[] = [];

  // Action mapping
  const actionToBindings = new Map<string, Binding[]>();
  const presets = new Map<string, InputPreset>();

  // Action state
  const down = new Set<string>();
  const pressed = new Set<string>();
  const released = new Set<string>();

  // Default preset
  const DEFAULT: InputPreset = {
    up: ["ArrowUp", "KeyW", "Gamepad:Button:12", "Gamepad:Axis:1:-"],
    down: ["ArrowDown", "KeyS", "Gamepad:Button:13", "Gamepad:Axis:1:+"],
    left: ["ArrowLeft", "KeyA", "Gamepad:Button:14", "Gamepad:Axis:0:-"],
    right: ["ArrowRight", "KeyD", "Gamepad:Button:15", "Gamepad:Axis:0:+"],
    accept: ["Enter", "Space", "KeyZ", "Gamepad:Button:0"],
    cancel: ["Escape", "Backspace", "KeyX", "Gamepad:Button:1"],
  };

  function parseBinding(token: string): Binding | undefined {
    // Mouse
    if (token.startsWith("Mouse:Button:")) {
      const n = Number(token.split(":")[2]);
      return { kind: "MouseButton", button: Number.isFinite(n) ? n : 0 };
    }
    if (token === "Mouse:Wheel:Up")
      return { kind: "MouseWheel", direction: "up" };
    if (token === "Mouse:Wheel:Down")
      return { kind: "MouseWheel", direction: "down" };
    // Gamepad
    if (token.startsWith("Gamepad:Button:")) {
      const n = Number(token.split(":")[2]);
      if (Number.isFinite(n)) return { kind: "GamepadButton", index: n };
    }
    if (token.startsWith("Gamepad:Axis:")) {
      const parts = token.split(":"); // Gamepad:Axis:<idx>:(+/-)
      const idx = Number(parts[2]);
      const sign = parts[3] === "-" ? -1 : 1;
      if (Number.isFinite(idx))
        return {
          kind: "GamepadAxis",
          index: idx,
          sign: sign as 1 | -1,
          threshold: deadzone,
        };
    }
    // Key (KeyboardEvent.code)
    return { kind: "Key", code: token };
  }

  function setActionMap(preset: InputPreset) {
    actionToBindings.clear();
    for (const action of Object.keys(preset)) {
      const list = preset[action];
      const bindings: Binding[] = [];
      for (let i = 0; i < list.length; i++) {
        const b = parseBinding(list[i]);
        if (b) bindings.push(b);
      }
      actionToBindings.set(action, bindings);
    }
  }

  function addPreset(name: string, preset: InputPreset) {
    presets.set(name, preset);
  }
  async function loadPreset(url: string) {
    const res = await fetch(url);
    const json = await res.json();
    setActionMap(json as InputPreset);
  }
  function usePreset(name: string) {
    const p = presets.get(name);
    if (p) setActionMap(p);
  }

  function start(game: any) {
    // defaults
    addPreset("default", DEFAULT);
    setActionMap(DEFAULT);
    // attach events
    const canvas = document.getElementById("shyer-root");
    targetEl = (options.useWindowListeners ? window : canvas) as any;
    if (!targetEl) return;
    const keyTarget: any = targetEl;
    keyTarget.addEventListener("keydown", onKeyDown);
    keyTarget.addEventListener("keyup", onKeyUp);
    keyTarget.addEventListener("blur", clearKeys, true);
    keyTarget.addEventListener("mousedown", onMouseDown);
    keyTarget.addEventListener("mouseup", onMouseUp);
    keyTarget.addEventListener("mousemove", onMouseMove);
    keyTarget.addEventListener("wheel", onWheel, { passive: true });

    // keep backward compat by filling game.keys each update
    game.on("update", () => {
      game.keys["up"] = isDown("up");
      game.keys["down"] = isDown("down");
      game.keys["left"] = isDown("left");
      game.keys["right"] = isDown("right");
      game.keys["accept"] = isDown("accept");
      game.keys["cancel"] = isDown("cancel");
    });
  }

  function update(_dt: number) {
    // reset edge states
    pressed.clear();
    released.clear();
    wheelUp = false;
    wheelDown = false;
    // poll gamepads
    pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    // recompute action states
    const prev = new Set(down);
    down.clear();
    actionToBindings.forEach((bindings, action) => {
      let active = false;
      for (let i = 0; i < bindings.length && !active; i++)
        active = evaluateBinding(bindings[i]);
      if (active) down.add(action);
    });
    // edges
    down.forEach((a) => {
      if (!prev.has(a)) pressed.add(a);
    });
    prev.forEach((a) => {
      if (!down.has(a)) released.add(a);
    });
    // mouse delta
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }

  function evaluateBinding(b: Binding): boolean {
    switch (b.kind) {
      case "Key":
        return keysDown.has(b.code);
      case "MouseButton":
        return mouseButtons.has(b.button);
      case "MouseWheel":
        return b.direction === "up" ? wheelUp : wheelDown;
      case "GamepadButton": {
        for (let i = 0; i < pads.length; i++) {
          const p = pads[i];
          if (!p) continue;
          const btn = p.buttons[b.index];
          if (btn && btn.pressed) return true;
        }
        return false;
      }
      case "GamepadAxis": {
        for (let i = 0; i < pads.length; i++) {
          const p = pads[i];
          if (!p) continue;
          const v = p.axes[b.index] ?? 0;
          if (b.sign === 1 && v > b.threshold) return true;
          if (b.sign === -1 && v < -b.threshold) return true;
        }
        return false;
      }
    }
  }

  // Listeners
  function onKeyDown(e: KeyboardEvent) {
    keysDown.add(e.code);
  }
  function onKeyUp(e: KeyboardEvent) {
    keysDown.delete(e.code);
  }
  function clearKeys() {
    keysDown.clear();
  }
  function onMouseDown(e: MouseEvent) {
    mouseButtons.add(e.button);
  }
  function onMouseUp(e: MouseEvent) {
    mouseButtons.delete(e.button);
  }
  function onMouseMove(e: MouseEvent) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
  }
  function onWheel(e: WheelEvent) {
    if (e.deltaY < 0) wheelUp = true;
    if (e.deltaY > 0) wheelDown = true;
  }

  // Public API
  function isDown(action: string) {
    return down.has(action);
  }
  function isPressed(action: string) {
    return pressed.has(action);
  }
  function isReleased(action: string) {
    return released.has(action);
  }
  function getAxis2D(map: {
    posX: string;
    negX: string;
    posY: string;
    negY: string;
  }) {
    const x = (isDown(map.posX) ? 1 : 0) + (isDown(map.negX) ? -1 : 0);
    const y = (isDown(map.posY) ? 1 : 0) + (isDown(map.negY) ? -1 : 0);
    return { x, y };
  }
  function getMouse() {
    return {
      x: mouseX,
      y: mouseY,
      dx: mouseX - prevMouseX,
      dy: mouseY - prevMouseY,
      buttons: new Set(mouseButtons),
    };
  }

  return {
    start,
    update,
    isDown,
    isPressed,
    isReleased,
    getAxis2D,
    setActionMap,
    addPreset,
    loadPreset,
    usePreset,
    getMouse,
  };
}
