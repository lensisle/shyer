export interface SpriteInstance {
  x: number;
  y: number;
  width: number;
  height: number;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface SpriteBatch {
  capacity: number;
  count: number;
  texture: WebGLTexture;
  imageWidth: number;
  imageHeight: number;
  translations: Float32Array;
  sizes: Float32Array;
  uvs: Float32Array; // u0 v0 u1 v1 per instance
  push: (sprite: SpriteInstance) => void;
  clear: () => void;
}

export interface WebGLSpriteBatchRendererOptions {
  premultiplyAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: WebGLPowerPreference;
  maxInstances?: number;
  clearColor?: [number, number, number, number];
  sortInstancesByY?: boolean;
}

export function createWebGLSpriteBatchRenderer(
  options: WebGLSpriteBatchRendererOptions = {}
) {
  let gl: WebGL2RenderingContext | null = null;
  let canvasGL: HTMLCanvasElement | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let program: WebGLProgram | null = null;
  let quadVBO: WebGLBuffer | null = null;
  let quadUVVBO: WebGLBuffer | null = null;
  let indexEBO: WebGLBuffer | null = null;
  let translationsVBO: WebGLBuffer | null = null;
  let sizesVBO: WebGLBuffer | null = null;
  let uvsVBO: WebGLBuffer | null = null;
  let uProjectionLoc: WebGLUniformLocation | null = null;
  let uSamplerLoc: WebGLUniformLocation | null = null;
  let projection: Float32Array | null = null;
  const batches: SpriteBatch[] = [];
  let clearColor: [number, number, number, number] = options.clearColor ?? [
    0, 0, 0, 0,
  ];
  let viewRect: { x: number; y: number; width: number; height: number } | null =
    null;
  const imageKeyToBatches = new Map<string, SpriteBatch[]>();

  function start(game: any) {
    const canvas2D = document.getElementById("shyer-root") as HTMLCanvasElement;
    if (!canvas2D) return;

    canvasGL = document.createElement("canvas");
    canvasGL.id = "shyer-gl";
    canvasGL.width = canvas2D.width;
    canvasGL.height = canvas2D.height;
    canvasGL.style.width = canvas2D.width + "px";
    canvasGL.style.height = canvas2D.height + "px";
    canvasGL.style.position = "absolute";
    canvasGL.style.left = canvas2D.offsetLeft + "px";
    canvasGL.style.top = canvas2D.offsetTop + "px";
    // Ensure GL canvas overlays 2D canvas
    canvasGL.style.zIndex = "9999";
    (canvasGL.style as any).pointerEvents = "none";
    canvas2D.style.position = "relative";
    canvas2D.style.zIndex = "0";
    canvas2D.parentElement?.appendChild(canvasGL);

    gl = canvasGL.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: options.premultiplyAlpha ?? true,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference ?? "high-performance",
    } as WebGLContextAttributes) as WebGL2RenderingContext;
    if (!gl) throw new Error("WebGL2 not supported");

    initGL();

    // Subscribe to render loop
    game.on("render", () => {
      if (!gl || !canvasGL) return;
      resizeToDisplaySize(canvasGL, gl);
      // Update orthographic projection when size changes
      projection = ortho(0, canvasGL.width, canvasGL.height, 0, -1, 1);
      gl.viewport(0, 0, canvasGL.width, canvasGL.height);
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniformMatrix4fv(uProjectionLoc, false, projection);

      gl.bindVertexArray(vao);
      for (let i = 0; i < batches.length; i++) drawBatch(batches[i]);
      gl.bindVertexArray(null);
      gl.useProgram(null);
      // clear batch counts for next frame
      for (let i = 0; i < batches.length; i++) batches[i].clear();
    });
  }

  function initGL() {
    if (!gl) return;
    program = createProgram(gl, VERT_SRC, FRAG_SRC);
    uProjectionLoc = gl.getUniformLocation(program!, "u_projection");
    uSamplerLoc = gl.getUniformLocation(program!, "u_sampler");

    // blending for sprites
    gl.enable(gl.BLEND);
    if (options.premultiplyAlpha ?? true) {
      gl.blendFuncSeparate(
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );
    } else {
      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );
    }

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Quad geometry (two triangles) centered at origin in unit square [0..1]
    const quad = new Float32Array([
      0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1,
    ]);
    quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const stride = 4 * 4; // 4 floats per vertex (pos.xy, uv.xy)
    // a_position (location 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    // a_uv (location 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);

    // Indices
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    indexEBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexEBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Instance buffers
    translationsVBO = gl.createBuffer();
    sizesVBO = gl.createBuffer();
    uvsVBO = gl.createBuffer();

    // translation (location 2)
    gl.bindBuffer(gl.ARRAY_BUFFER, translationsVBO);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8, 0);
    gl.vertexAttribDivisor(2, 1);

    // size (location 3)
    gl.bindBuffer(gl.ARRAY_BUFFER, sizesVBO);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 8, 0);
    gl.vertexAttribDivisor(3, 1);

    // uv rect (location 4)
    gl.bindBuffer(gl.ARRAY_BUFFER, uvsVBO);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(4, 1);

    gl.bindVertexArray(null);
  }

  function createTextureFromImage(image: HTMLImageElement): WebGLTexture {
    const tex = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.pixelStorei(
      gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
      options.premultiplyAlpha ? 1 : 0
    );
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.RGBA,
      gl!.RGBA,
      gl!.UNSIGNED_BYTE,
      image
    );
    gl!.bindTexture(gl!.TEXTURE_2D, null);
    return tex;
  }

  function createBatch(image: HTMLImageElement, capacity: number): SpriteBatch {
    const texture = createTextureFromImage(image);
    const translations = new Float32Array(capacity * 2);
    const sizes = new Float32Array(capacity * 2);
    const uvs = new Float32Array(capacity * 4);
    const batch: SpriteBatch = {
      capacity,
      count: 0,
      texture,
      imageWidth: image.width,
      imageHeight: image.height,
      translations,
      sizes,
      uvs,
      push(sprite: SpriteInstance) {
        if (this.count >= this.capacity) return;
        const i = this.count;
        translations[i * 2 + 0] = sprite.x;
        translations[i * 2 + 1] = sprite.y;
        sizes[i * 2 + 0] = sprite.width;
        sizes[i * 2 + 1] = sprite.height;
        uvs[i * 4 + 0] = sprite.u0;
        uvs[i * 4 + 1] = sprite.v0;
        uvs[i * 4 + 2] = sprite.u1;
        uvs[i * 4 + 3] = sprite.v1;
        this.count++;
      },
      clear() {
        this.count = 0;
      },
    };
    batches.push(batch);
    return batch;
  }

  function getOrCreateBatch(
    image: HTMLImageElement,
    capacityHint: number = options.maxInstances ?? 4096
  ): SpriteBatch {
    const key =
      image.src || `${image.width}x${image.height}-${image.currentSrc}`;
    let list = imageKeyToBatches.get(key);
    if (!list) {
      const b = createBatch(image, capacityHint);
      list = [b];
      imageKeyToBatches.set(key, list);
      return b;
    }
    const last = list[list.length - 1];
    if (last.count < last.capacity) return last;
    const next = createBatch(image, last.capacity);
    list.push(next);
    return next;
  }

  function setViewRect(x: number, y: number, width: number, height: number) {
    viewRect = { x, y, width, height };
  }

  function setClearColor(r: number, g: number, b: number, a: number) {
    clearColor = [r, g, b, a];
  }

  function isVisible(_x: number, _y: number, _w: number, _h: number): boolean {
    // Culling is handled in core for now (temporarily disabled). Always true here.
    return true;
  }

  function pushSprite(image: HTMLImageElement, sprite: SpriteInstance) {
    if (!isVisible(sprite.x, sprite.y, sprite.width, sprite.height)) return;
    const batch = getOrCreateBatch(image);
    batch.push(sprite);
  }

  function drawBatch(batch: SpriteBatch) {
    const glctx = gl!;
    if (batch.count === 0) return;
    // optional front-to-back to reduce overdraw
    if (options.sortInstancesByY) {
      const indices = new Uint32Array(batch.count);
      for (let i = 0; i < batch.count; i++) indices[i] = i;
      indices.sort(
        (a, b) => batch.translations[a * 2 + 1] - batch.translations[b * 2 + 1]
      );
      const t = new Float32Array(batch.count * 2);
      const s = new Float32Array(batch.count * 2);
      const u = new Float32Array(batch.count * 4);
      for (let ri = 0; ri < batch.count; ri++) {
        const i = indices[ri];
        t[ri * 2 + 0] = batch.translations[i * 2 + 0];
        t[ri * 2 + 1] = batch.translations[i * 2 + 1];
        s[ri * 2 + 0] = batch.sizes[i * 2 + 0];
        s[ri * 2 + 1] = batch.sizes[i * 2 + 1];
        u[ri * 4 + 0] = batch.uvs[i * 4 + 0];
        u[ri * 4 + 1] = batch.uvs[i * 4 + 1];
        u[ri * 4 + 2] = batch.uvs[i * 4 + 2];
        u[ri * 4 + 3] = batch.uvs[i * 4 + 3];
      }
      batch.translations.set(t);
      batch.sizes.set(s);
      batch.uvs.set(u);
    }
    glctx.activeTexture(glctx.TEXTURE0);
    glctx.bindTexture(glctx.TEXTURE_2D, batch.texture);
    glctx.uniform1i(uSamplerLoc, 0);

    // upload instance data
    glctx.bindBuffer(glctx.ARRAY_BUFFER, translationsVBO);
    glctx.bufferData(
      glctx.ARRAY_BUFFER,
      batch.translations.subarray(0, batch.count * 2),
      glctx.DYNAMIC_DRAW
    );
    glctx.bindBuffer(glctx.ARRAY_BUFFER, sizesVBO);
    glctx.bufferData(
      glctx.ARRAY_BUFFER,
      batch.sizes.subarray(0, batch.count * 2),
      glctx.DYNAMIC_DRAW
    );
    glctx.bindBuffer(glctx.ARRAY_BUFFER, uvsVBO);
    glctx.bufferData(
      glctx.ARRAY_BUFFER,
      batch.uvs.subarray(0, batch.count * 4),
      glctx.DYNAMIC_DRAW
    );

    glctx.drawElementsInstanced(
      glctx.TRIANGLES,
      6,
      glctx.UNSIGNED_SHORT,
      0,
      batch.count
    );
  }

  function dispose() {
    if (!gl) return;
    if (vao) gl.deleteVertexArray(vao);
    if (program) gl.deleteProgram(program);
    if (quadVBO) gl.deleteBuffer(quadVBO);
    if (quadUVVBO) gl.deleteBuffer(quadUVVBO);
    if (indexEBO) gl.deleteBuffer(indexEBO);
    if (translationsVBO) gl.deleteBuffer(translationsVBO);
    if (sizesVBO) gl.deleteBuffer(sizesVBO);
    if (uvsVBO) gl.deleteBuffer(uvsVBO);
    if (canvasGL && canvasGL.parentElement)
      canvasGL.parentElement.removeChild(canvasGL);
    gl = null;
  }

  return {
    start,
    createBatch,
    getOrCreateBatch,
    pushSprite,
    setViewRect,
    setClearColor,
    dispose,
  };
}

function createShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + info);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string
): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a_position");
  gl.bindAttribLocation(prog, 1, "a_uv");
  gl.bindAttribLocation(prog, 2, "i_translation");
  gl.bindAttribLocation(prog, 3, "i_size");
  gl.bindAttribLocation(prog, 4, "i_uvRect");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Program link error: " + info);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function ortho(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number
) {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = -2 * lr; // 2/(right-left)
  out[5] = -2 * bt; // 2/(top-bottom)
  out[10] = 2 * nf; // -2/(far-near)
  out[12] = (left + right) * lr; // (right+left)/(left-right)
  out[13] = (top + bottom) * bt; // (top+bottom)/(bottom-top)
  out[14] = (far + near) * nf; // (far+near)/(near-far)
  out[15] = 1;
  return out;
}

function resizeToDisplaySize(
  canvas: HTMLCanvasElement,
  _gl: WebGL2RenderingContext
) {
  const cssW = Math.max(1, Math.floor(canvas.clientWidth || canvas.width));
  const cssH = Math.max(1, Math.floor(canvas.clientHeight || canvas.height));
  // Cap DPR to avoid gigantic canvases on buggy environments
  const dprRaw = Number((window as any).devicePixelRatio) || 1;
  const dpr = Math.min(3, Math.max(1, dprRaw));
  const displayWidth = Math.floor(cssW * dpr);
  const displayHeight = Math.floor(cssH * dpr);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

const VERT_SRC = `#version 300 es
layout(location=0) in vec2 a_position;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec2 i_translation;
layout(location=3) in vec2 i_size;
layout(location=4) in vec4 i_uvRect;

uniform mat4 u_projection;

out vec2 v_uv;

void main() {
  vec2 world = i_translation + a_position * i_size;
  // Convert from pixel space to NDC using the projection
  gl_Position = u_projection * vec4(world, 0.0, 1.0);
  // map quad uv [0..1] into rect uv
  v_uv = mix(i_uvRect.xy, i_uvRect.zw, a_uv);
}
`;

const FRAG_SRC = `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_sampler;
out vec4 outColor;
void main(){
  outColor = texture(u_sampler, v_uv);
  // Debug: visualize UV if texture missing
  if (outColor.a == 0.0) {
    outColor = vec4(v_uv, 0.0, 1.0);
  }
}
`;
