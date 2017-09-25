const Vuni = {
  createGame: function(width, height) {
    const canvas = document.createElement("canvas");
    canvas["id"] = "vuniroot";
    canvas["width"] = width;
    canvas["height"] = height;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext`2d`;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    this.subs = {};
    this.assets = { image: {}, audio: {} };
    this.listener = canvas.addEventListener.bind(canvas);
    const listen = evt => (this.subs[evt.type] || (() => {}))(evt.detail);
    ["update", "render", "keypress", "keyrelease", "onloaded"].forEach(evtKey =>
      this.listener(evtKey, listen)
    );
    this.on = this.on.bind(this);
    let lastFrameTime = 0;
    const gameLoop = (ts = 0) => {
      if (ts < lastFrameTime + 33.3) {
        requestAnimationFrame(gameLoop);
        return;
      }
      const dt = ts - lastFrameTime;
      lastFrameTime = ts;
      canvas.dispatchEvent(new CustomEvent("update", { detail: dt }));
      canvas.dispatchEvent(new CustomEvent("render"));
      requestAnimationFrame(gameLoop);
    };
    canvas.tabIndex = 1000;
    canvas.style.outline = "none";
    const keyEvent = evtName => (evt = window.event) => {
      evt.preventDefault();
      canvas.dispatchEvent(
        new CustomEvent(evtName, { detail: evt.keyCode || 0 })
      );
    };
    canvas.onkeydown = keyEvent("keypress");
    canvas.onkeyup = keyEvent("keyrelease");
    this.canvas = canvas;
    return this;
  },
  on: function(event, callback) {
    this.subs[event] = callback;
  },
  load: function(assets) {
    const loader = assets.map(assetDef => {
      return new Promise((res, rej) => {
        const asset = assetDef.type === "image" ? new Image() : new Audio();
        asset.onerror = rej;
        asset[assetDef.type === "image" ? "onload" : "oncanplaythrough"] = res;
        asset.src = assetDef.src;
        this.assets[assetDef.type][assetDef.id] = asset;
      });
    });
    Promise.all(loader).then(_ => {
      this.canvas.dispatchEvent(new CustomEvent("onloaded"));
    });
  },
  start: () => gameLoop()
};

// Tests ->

Vuni.createGame(400, 300).load([
  { id: "mother", type: "image", src: "mother3.png" },
  { id: "mother2", type: "image", src: "mother3.png" }
]);

Vuni.on("onloaded", () => {
  console.log("Resources loaded");
  console.log(Vuni.assets);
});

export default Vuni;
