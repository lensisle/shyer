import { clamp } from '../utils/math_utils';

export function createCamera(viewportRect, worldRect) {
  let { x: vx, y: vy, width: vw, height: vh } = viewportRect;
  let { x: wx, y: wy, width: ww, height: wh } = worldRect;

  let currentTarget = { x: 0, y: 0 };
  let dzx = 0;
  let dzy = 0;

  function setViewportSize(x, y, width, height) {
    vx = x;
    vy = y;
    vw = width;
    vh = height;
  }

  function setWorldSize(x, y, width, height) {
    wx = x;
    wy = y;
    ww = width;
    wh = height;
  }

  function follow({ x, y }, deadZoneX, deadZoneY) {
    currentTarget.x = x;
    currentTarget.y = y;
    dzx = deadZoneX;
    dzy = deadZoneY;
  }

  function update(dt) {
    const vxNext =
      currentTarget.x - vx + dzx > vw
        ? currentTarget.x - (vw - dzx)
        : currentTarget.x - dzx < vx ? currentTarget.x - dzx : vx;
    const vyNext =
      currentTarget.y - vy + dzy > vh
        ? currentTarget.y - (vh - dzy)
        : currentTarget.y - dzy < vy ? currentTarget.y - dzy : vy;
    vx = clamp(vxNext, wx - dzx, wx + ww - dzx);
    vy = clamp(vyNext, wy - dzy, wy + wh - dzy);
  }

  function render(entities = [], renderFn, ctx, cache) {
    for (let i = 0, max = entities.length; i < max; i++) {
      const entity = entities[i];
      if (!contains(entity)) continue;
      const renderEntity = Object.assign({}, entities[i]);
      renderEntity.x = entity.x - entity.width / 2 - vx;
      renderEntity.y = entity.y - entity.height / 2 - vy;
      renderFn(renderEntity, ctx, cache);
    }
  }

  function contains({ x, y, width, height }) {
    return (
      x - vx + width / 2.0 >= 0 &&
      x - vx - width / 2.0 <= vw &&
      y - vy + height / 2.0 >= 0 &&
      y - vy - height / 2.0 <= vh
    );
  }

  return {
    setViewportSize,
    setWorldSize,
    follow,
    render,
    update
  };
}
