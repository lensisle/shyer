export type UIEventHandler = (el: UIElement) => void;

export type UIElement = {
  id: string;
  type: "panel" | "text" | "image" | "button";
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  font?: string;
  color?: string;
  imageId?: string;
  children?: UIElement[];
  onClick?: UIEventHandler;
  onHover?: UIEventHandler;
};

export function createUI() {
  const roots: UIElement[] = [];
  let cache: any;

  function start(_game: any, cacheRef: any) {
    cache = cacheRef;
  }

  function add(el: UIElement) {
    roots.push(el);
    return el;
  }
  function clear() {
    roots.length = 0;
  }

  function update(_dt: number) {
    /* handle focus/navigation later */
  }

  function render2D(ctx: CanvasRenderingContext2D) {
    for (const r of roots) draw(r, ctx);
  }

  function draw(el: UIElement, ctx: CanvasRenderingContext2D) {
    switch (el.type) {
      case "panel":
        ctx.save();
        ctx.fillStyle = el.color || "rgba(0,0,0,0.4)";
        ctx.fillRect(el.x, el.y, el.w, el.h);
        ctx.restore();
        break;
      case "text":
        ctx.save();
        ctx.fillStyle = el.color || "#fff";
        ctx.font = el.font || "14px monospace";
        ctx.textBaseline = "top";
        ctx.fillText(el.text || "", el.x, el.y);
        ctx.restore();
        break;
      case "image":
        if (el.imageId && cache?.image?.[el.imageId]) {
          const img = cache.image[el.imageId];
          ctx.drawImage(img, el.x, el.y, el.w, el.h);
        }
        break;
      case "button":
        ctx.save();
        ctx.fillStyle = el.color || "#333";
        ctx.fillRect(el.x, el.y, el.w, el.h);
        ctx.fillStyle = "#fff";
        ctx.font = el.font || "14px monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(el.text || "Button", el.x + el.w / 2, el.y + el.h / 2);
        ctx.restore();
        break;
    }
    if (el.children) el.children.forEach((c) => draw(c, ctx));
  }

  return { start, update, add, clear, render2D };
}
