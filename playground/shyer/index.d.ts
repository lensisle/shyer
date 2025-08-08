declare const ASSET_TYPE_IMAGE = "image";
declare const ASSET_TYPE_AUDIO = "audio";
declare const LOAD_COMPLETE_EVT = "loadcomplete";
declare const START_EVT = "start";
declare const RENDER_EVT = "render";
declare const UPDATE_EVT = "update";
declare const PAUSE_EVT = "pause";
declare const PHYSICS_EVT = "physics";
type EventCallback<T = any> = (data: T) => void;
interface Entity {
    id: string;
    update: (dt: number) => void;
    [key: string]: any;
}
interface Game {
    keys: Record<string, boolean>;
    emit: (event: string, data?: any) => void;
    on: (event: string, callback: EventCallback) => void;
    addEvent: (name: string) => void;
    removeEvent: (name: string) => Record<string, any>;
    getEntity: (id: string) => Entity | undefined;
    registerEntity: (...targets: Entity[]) => Entity[];
    unregisterEntity: (...targets: Entity[]) => {
        entitiesKeys: string[];
        entities: Record<string, Entity>;
    };
    clearEntities: () => void;
    load: (assets: Array<{
        resId: string;
        type: string;
        src: string;
    }>) => void;
    extend: (...ext: any[]) => Game;
    decorate: (game: any, functionName: "update" | "render" | string, ...decorators: Array<(fn: any) => any>) => void;
    start: () => void;
    resume: () => void;
    pause: () => void;
    setClearColor: (color: string) => void;
    setViewRect?: (x: number, y: number, w: number, h: number) => void;
    setSpatialCellSize?: (size: number) => void;
}
declare function createGame(width: number, height: number): Game;

declare const shyer_ASSET_TYPE_AUDIO: typeof ASSET_TYPE_AUDIO;
declare const shyer_ASSET_TYPE_IMAGE: typeof ASSET_TYPE_IMAGE;
type shyer_Entity = Entity;
type shyer_EventCallback<T = any> = EventCallback<T>;
type shyer_Game = Game;
declare const shyer_LOAD_COMPLETE_EVT: typeof LOAD_COMPLETE_EVT;
declare const shyer_PAUSE_EVT: typeof PAUSE_EVT;
declare const shyer_PHYSICS_EVT: typeof PHYSICS_EVT;
declare const shyer_RENDER_EVT: typeof RENDER_EVT;
declare const shyer_START_EVT: typeof START_EVT;
declare const shyer_UPDATE_EVT: typeof UPDATE_EVT;
declare const shyer_createGame: typeof createGame;
declare namespace shyer {
  export { shyer_ASSET_TYPE_AUDIO as ASSET_TYPE_AUDIO, shyer_ASSET_TYPE_IMAGE as ASSET_TYPE_IMAGE, type shyer_Entity as Entity, type shyer_EventCallback as EventCallback, type shyer_Game as Game, shyer_LOAD_COMPLETE_EVT as LOAD_COMPLETE_EVT, shyer_PAUSE_EVT as PAUSE_EVT, shyer_PHYSICS_EVT as PHYSICS_EVT, shyer_RENDER_EVT as RENDER_EVT, shyer_START_EVT as START_EVT, shyer_UPDATE_EVT as UPDATE_EVT, shyer_createGame as createGame };
}

interface AudioCache {
    [resId: string]: HTMLAudioElement;
}
interface PlaySfxOptions {
    volume?: number;
    loop?: boolean;
    rate?: number;
    spatial?: boolean;
    position?: {
        x: number;
        y: number;
        z?: number;
    };
    tag?: string;
    onEnded?: () => void;
}
interface PlayMusicOptions {
    volume?: number;
    loop?: boolean;
    fadeIn?: number;
    crossfade?: number;
}
declare function createAudioPlayer(): {
    start: (_game: any, cache: Record<string, any>) => void;
    playMusic: (resId: string, options?: PlayMusicOptions) => void;
    stopMusic: (options?: {
        fadeOut?: number;
    }) => void;
    setMusicVolume: (v: number) => void;
    playSfx: (resId: string, options?: PlaySfxOptions) => {
        resId: string;
        element: HTMLAudioElement;
        source: MediaElementAudioSourceNode;
        gain: GainNode;
        panner?: PannerNode;
        tag?: string;
        stop: () => void;
    } | undefined;
    stopAllSfx: () => void;
    stopSfxByTag: (tag?: string) => void;
    setSfxVolume: (v: number) => void;
    setMasterVolume: (v: number) => void;
    play: (resId: string, loop?: boolean) => {
        resId: string;
        element: HTMLAudioElement;
        source: MediaElementAudioSourceNode;
        gain: GainNode;
        panner?: PannerNode;
        tag?: string;
        stop: () => void;
    } | undefined;
    stop: (resId: string) => void;
    getDuration: (resId: string) => number;
    pause: (resId: string) => void;
    reset: (resId: string) => void;
    setVolume: (resId: string, volume: number) => void;
    setPlaybackTime: (resId: string, second: number) => void;
    setPlaybackRate: (resId: string, rate: number) => void;
    canPlay: (audioResource: HTMLAudioElement) => boolean;
    registerAlternateSources: (resId: string, sources: Array<{
        src: string;
        type: string;
    }>) => void;
};

type audio_AudioCache = AudioCache;
type audio_PlayMusicOptions = PlayMusicOptions;
type audio_PlaySfxOptions = PlaySfxOptions;
declare const audio_createAudioPlayer: typeof createAudioPlayer;
declare namespace audio {
  export { type audio_AudioCache as AudioCache, type audio_PlayMusicOptions as PlayMusicOptions, type audio_PlaySfxOptions as PlaySfxOptions, audio_createAudioPlayer as createAudioPlayer };
}

interface BaseSprite {
    id: string;
    resId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    visible: boolean;
    isStatic: boolean;
    update: (dt: number) => void;
    [key: string]: any;
}
declare function createSprite(id: string, resId: string, x: number, y: number, width: number, height: number): BaseSprite;
declare function collideWith(source: Pick<BaseSprite, "x" | "y" | "width" | "height">, target: Pick<BaseSprite, "x" | "y" | "width" | "height">, onCollideFn: () => void, enablerExp?: boolean): void;
declare function renderSprite({ resId, x, y, width, height, visible, isStatic }: BaseSprite, ctx: CanvasRenderingContext2D, cache: {
    image: Record<string, HTMLImageElement>;
    default: HTMLImageElement;
}): void;
declare function renderGroup(sprites: BaseSprite[] | undefined, ctx: CanvasRenderingContext2D, cache: {
    image: Record<string, HTMLImageElement>;
    default: HTMLImageElement;
}, renderFn: (sprite: BaseSprite, ctx: CanvasRenderingContext2D, cache: any) => void): void;
interface AnimationClip {
    origin: number;
    length: number;
    duration: number;
    time: number;
    idx: number;
}
declare function createAnimatedSprite(sprite: BaseSprite, crop: {
    rows: number;
    columns: number;
    cropSize: number;
}, clips: Record<string, AnimationClip>, startingClip?: string): {
    rows: number;
    columns: number;
    cropSize: number;
    setCurrentClip: (clipName: string) => void;
    getCurrentClip: () => AnimationClip | undefined;
    update: (dt: number) => void;
    id: string;
    resId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    visible: boolean;
    isStatic: boolean;
};
declare function createAnimationClip(tileOrigin: number, tilesLength: number, secondsPerFrame: number): AnimationClip;
declare function renderAnimatedSprite({ resId, x, y, width, height, visible, isStatic, getCurrentClip, rows, columns, cropSize, }: any, ctx: CanvasRenderingContext2D, cache: {
    image: Record<string, HTMLImageElement>;
    default: HTMLImageElement;
}): void;

type sprite_AnimationClip = AnimationClip;
type sprite_BaseSprite = BaseSprite;
declare const sprite_collideWith: typeof collideWith;
declare const sprite_createAnimatedSprite: typeof createAnimatedSprite;
declare const sprite_createAnimationClip: typeof createAnimationClip;
declare const sprite_createSprite: typeof createSprite;
declare const sprite_renderAnimatedSprite: typeof renderAnimatedSprite;
declare const sprite_renderGroup: typeof renderGroup;
declare const sprite_renderSprite: typeof renderSprite;
declare namespace sprite {
  export { type sprite_AnimationClip as AnimationClip, type sprite_BaseSprite as BaseSprite, sprite_collideWith as collideWith, sprite_createAnimatedSprite as createAnimatedSprite, sprite_createAnimationClip as createAnimationClip, sprite_createSprite as createSprite, sprite_renderAnimatedSprite as renderAnimatedSprite, sprite_renderGroup as renderGroup, sprite_renderSprite as renderSprite };
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Renderable {
    x: number;
    y: number;
    width: number;
    height: number;
}
type Easing$1 = (t: number) => number;
declare function createCamera(viewportRect: Rect, worldRect: Rect): {
    setViewportSize: (x: number, y: number, width: number, height: number) => void;
    setWorldSize: (x: number, y: number, width: number, height: number) => void;
    setWorldBounds: (x: number, y: number, width: number, height: number) => void;
    follow: (entity: {
        x: number;
        y: number;
    }, deadZoneX?: number, deadZoneY?: number) => void;
    followPoint: (x: number, y: number, deadZoneX?: number, deadZoneY?: number) => void;
    stopFollowing: () => void;
    panTo: (targetX: number, targetY: number, duration: number, ease?: Easing$1) => void;
    setZoom: (next: number) => void;
    zoomTo: (targetZoom: number, duration: number, ease?: Easing$1) => void;
    zoomBy: (delta: number, duration: number, ease?: Easing$1) => void;
    shake: (duration: number, amplitude: number, frequency?: number) => void;
    flash: (duration?: number, color?: string, maxAlpha?: number) => void;
    getViewRect: () => Rect;
    update: (dt: number) => void;
    render: (entities: Renderable[] | undefined, renderFn: (entity: Renderable, ctx: CanvasRenderingContext2D, cache: any) => void, ctx: CanvasRenderingContext2D, cache: any, useTransform?: boolean) => void;
};

type camera_Rect = Rect;
type camera_Renderable = Renderable;
declare const camera_createCamera: typeof createCamera;
declare namespace camera {
  export { type camera_Rect as Rect, type camera_Renderable as Renderable, camera_createCamera as createCamera };
}

type EasingFunction = (t: number) => number;
declare const Easing: Record<string, EasingFunction>;
interface TweenOptions {
    target?: Record<string, any>;
    props?: Record<string, number>;
    from?: Record<string, number>;
    to?: Record<string, number>;
    duration: number;
    delay?: number;
    ease?: EasingFunction | keyof typeof Easing;
    yoyo?: boolean;
    repeat?: number;
    onUpdate?: (values: Record<string, number>) => void;
    onComplete?: () => void;
}
interface TweenHandle {
    stop: () => void;
    pause: () => void;
    resume: () => void;
    isFinished: () => boolean;
}
declare function createTweenManager(): {
    start(_game: any): void;
    update: (dt: number) => void;
    clear: () => void;
    pauseAll: () => void;
    resumeAll: () => void;
    to: (options: TweenOptions) => TweenHandle;
    value: (from: number, toVal: number, duration: number, onUpdate: (v: number) => void, opts?: {
        delay?: number;
        ease?: EasingFunction | keyof typeof Easing;
        yoyo?: boolean;
        repeat?: number;
        onComplete?: () => void;
    }) => TweenHandle;
    toObject: (target: Record<string, any>, toProps: Record<string, number>, duration: number, opts?: Omit<TweenOptions, "target" | "props" | "duration" | "to">) => TweenHandle;
    volume: (audio: {
        setVolume: (resId: string, v: number) => void;
        getDuration?: (resId: string) => number;
    }, resId: string, toVol: number, duration: number, fromVol?: number, ease?: EasingFunction | keyof typeof Easing) => TweenHandle;
};

declare const tween_Easing: typeof Easing;
type tween_EasingFunction = EasingFunction;
type tween_TweenHandle = TweenHandle;
type tween_TweenOptions = TweenOptions;
declare const tween_createTweenManager: typeof createTweenManager;
declare namespace tween {
  export { tween_Easing as Easing, type tween_EasingFunction as EasingFunction, type tween_TweenHandle as TweenHandle, type tween_TweenOptions as TweenOptions, tween_createTweenManager as createTweenManager };
}

type Binding = {
    kind: "Key";
    code: string;
} | {
    kind: "MouseButton";
    button: number;
} | {
    kind: "MouseWheel";
    direction: "up" | "down";
} | {
    kind: "GamepadButton";
    index: number;
} | {
    kind: "GamepadAxis";
    index: number;
    sign: 1 | -1;
    threshold: number;
};
interface InputPreset {
    [action: string]: string[];
}
interface InputOptions {
    deadzone?: number;
    useWindowListeners?: boolean;
}
interface InputAPI {
    start: (game: any) => void;
    update: (dt: number) => void;
    isDown: (action: string) => boolean;
    isPressed: (action: string) => boolean;
    isReleased: (action: string) => boolean;
    getAxis2D: (map: {
        posX: string;
        negX: string;
        posY: string;
        negY: string;
    }) => {
        x: number;
        y: number;
    };
    setActionMap: (preset: InputPreset) => void;
    addPreset: (name: string, preset: InputPreset) => void;
    loadPreset: (url: string) => Promise<void>;
    usePreset: (name: string) => void;
    getMouse: () => {
        x: number;
        y: number;
        dx: number;
        dy: number;
        buttons: Set<number>;
    };
}
declare function createInputManager(options?: InputOptions): InputAPI;

type input_Binding = Binding;
type input_InputAPI = InputAPI;
type input_InputOptions = InputOptions;
type input_InputPreset = InputPreset;
declare const input_createInputManager: typeof createInputManager;
declare namespace input {
  export { type input_Binding as Binding, type input_InputAPI as InputAPI, type input_InputOptions as InputOptions, type input_InputPreset as InputPreset, input_createInputManager as createInputManager };
}

type UIEventHandler = (el: UIElement) => void;
type UIElement = {
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
declare function createUI(): {
    start: (_game: any, cacheRef: any) => void;
    update: (_dt: number) => void;
    add: (el: UIElement) => UIElement;
    clear: () => void;
    render2D: (ctx: CanvasRenderingContext2D) => void;
};

type ui_UIElement = UIElement;
type ui_UIEventHandler = UIEventHandler;
declare const ui_createUI: typeof createUI;
declare namespace ui {
  export { type ui_UIElement as UIElement, type ui_UIEventHandler as UIEventHandler, ui_createUI as createUI };
}

interface ParticlesOptions {
    textureId: string;
    count: number;
    spriteWidth?: number;
    spriteHeight?: number;
    worldWidth: number;
    worldHeight: number;
    initialSpeed?: number;
}
declare function createParticles(options: ParticlesOptions): {
    start: (game: any, cacheRef: any) => void;
    update: (_dt: number) => void;
    hook: (_game: any) => void;
    getVisibleCount: () => number;
};

type particles_ParticlesOptions = ParticlesOptions;
declare const particles_createParticles: typeof createParticles;
declare namespace particles {
  export { type particles_ParticlesOptions as ParticlesOptions, particles_createParticles as createParticles };
}

export { audio as Audio, camera as Camera, input as Input, particles as Particles, shyer as Shyer, sprite as Sprite, tween as Tween, ui as UI };
