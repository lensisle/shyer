const camera = {
  target: '',
  mtx: [{ x: 0, y: 0, w: 0, h: 0 }, { x: 0, y: 0, w: 0, h: 0 }],
  setRectCoords: function(t, x, y, w, h) {
    const i = t === 'viewport' ? 0 : t === 'world' ? 1 : -1;
    this.mtx[clamp(i, 0, 1)] =
      i === 0 || i === 1
        ? Object.assign({}, { x, y, w, h })
        : this.mtx[clamp(i, 0, 1)];
  },
  follow: function({ x, y }, dzx, dzy) {
    const vm = this.mtx[0],
      wm = this.mtx[1];
    const vx =
      x - vm.x + dzx > vm.w
        ? x - (vm.w - dzx)
        : x - dzx < vm.x ? x - dzx : vm.x;
    const vy =
      y - vm.y + dzy > vm.h
        ? y - (vm.h - dzy)
        : y - dzy < vm.y ? y - dzy : vm.y;
    this.mtx[0].x = clamp(vx, wm.x - dzx, wm.x + wm.w - dzx);
    this.mtx[0].y = clamp(vy, wm.y - dzy, wm.y + wm.h - dzy);
  },
  contains: function({ x, y, w, h }) {
    return (
      x - this.mtx[0].x + w / 2.0 >= 0 &&
      x - this.mtx[0].x - w / 2.0 <= this.mtx[0].w &&
      y - this.mtx[0].y + h / 2.0 >= 0 &&
      y - this.mtx[0].y - h / 2.0 <= this.mtx[0].h
    );
  }
};
