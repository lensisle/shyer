export interface AudioCache {
  [resId: string]: HTMLAudioElement;
}

export interface PlaySfxOptions {
  volume?: number;
  loop?: boolean;
  rate?: number; // playbackRate
  spatial?: boolean;
  position?: { x: number; y: number; z?: number };
  tag?: string;
  onEnded?: () => void;
}

export interface PlayMusicOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: number; // seconds
  crossfade?: number; // seconds
}

export function createAudioPlayer() {
  let audioCache: AudioCache | undefined;
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let sfxBus: GainNode | null = null;

  type MusicTrack = {
    resId: string;
    element: HTMLAudioElement;
    source: MediaElementAudioSourceNode;
    gain: GainNode;
  } | null;
  let currentMusic: MusicTrack = null;
  let previousMusic: MusicTrack = null;

  type SfxInstance = {
    resId: string;
    element: HTMLAudioElement;
    source: MediaElementAudioSourceNode;
    gain: GainNode;
    panner?: PannerNode;
    tag?: string;
    stop: () => void;
  };
  const activeSfx = new Set<SfxInstance>();

  const altSources = new Map<string, Array<{ src: string; type: string }>>();

  function start(_game: any, cache: Record<string, any>) {
    audioCache = cache["audio"];
  }

  function ensureContext(): void {
    if (ctx) return;
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    masterGain.gain.value = 1;
    musicBus.gain.value = 1;
    sfxBus.gain.value = 1;
    musicBus.connect(masterGain);
    sfxBus.connect(masterGain);
    masterGain.connect(ctx.destination);
  }

  function resumeContext(): void {
    ensureContext();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function getResource(resId: string): HTMLAudioElement | undefined {
    return audioCache ? audioCache[resId] : undefined;
  }

  function resolvePlayableSource(resId: string): string | undefined {
    const registered = altSources.get(resId);
    const base = getResource(resId);
    if (!base) return undefined;
    if (!registered || registered.length === 0) return base.src;
    const probe = document.createElement("audio");
    for (let i = 0; i < registered.length; i++) {
      const { src, type } = registered[i];
      if (probe.canPlayType(type)) return src;
    }
    return base.src;
  }

  function playMusic(resId: string, options: PlayMusicOptions = {}) {
    resumeContext();
    if (!ctx || !musicBus) return;
    const loop = !!options.loop;
    const targetVol = clamp01(options.volume ?? 1);
    const crossfade = Math.max(0, options.crossfade ?? 0);
    const fadeIn = Math.max(0, options.fadeIn ?? 0);

    const srcUrl = resolvePlayableSource(resId);
    if (!srcUrl) return;

    const element = getResource(resId) ?? new Audio();
    if (!getResource(resId)) {
      element.src = srcUrl;
      element.preload = "auto";
    }
    element.loop = loop;
    element.currentTime = 0;

    const source = ctx.createMediaElementSource(element);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(musicBus);

    if (currentMusic) {
      previousMusic = currentMusic;
      if (crossfade > 0) {
        rampGain(
          previousMusic.gain.gain,
          previousMusic.gain.gain.value,
          0,
          crossfade
        );
        safePlay(element);
        rampGain(gain.gain, 0, targetVol, crossfade);
        setTimeout(() => disposeMusic(previousMusic!), (crossfade * 1000) | 0);
      } else {
        disposeMusic(previousMusic);
        safePlay(element);
        if (fadeIn > 0) rampGain(gain.gain, 0, targetVol, fadeIn);
        else gain.gain.value = targetVol;
      }
    } else {
      safePlay(element);
      if (fadeIn > 0) rampGain(gain.gain, 0, targetVol, fadeIn);
      else gain.gain.value = targetVol;
    }

    currentMusic = { resId, element, source, gain };
  }

  function stopMusic(options: { fadeOut?: number } = {}) {
    if (!ctx || !currentMusic) return;
    const f = Math.max(0, options.fadeOut ?? 0);
    if (f > 0) {
      rampGain(currentMusic.gain.gain, currentMusic.gain.gain.value, 0, f);
      setTimeout(() => disposeMusic(currentMusic!), (f * 1000) | 0);
    } else {
      disposeMusic(currentMusic);
    }
    currentMusic = null;
  }

  function disposeMusic(track: MusicTrack) {
    if (!track) return;
    try {
      track.source.disconnect();
    } catch {}
    try {
      track.gain.disconnect();
    } catch {}
    try {
      track.element.pause();
    } catch {}
  }

  function playSfx(
    resId: string,
    options: PlaySfxOptions = {}
  ): SfxInstance | undefined {
    resumeContext();
    if (!ctx || !sfxBus) return;
    const base = getResource(resId);
    if (!base) return;
    const element = new Audio();
    element.src = base.currentSrc || base.src;
    element.preload = "auto";
    element.loop = !!options.loop;
    element.playbackRate = options.rate ?? 1;

    const source = ctx.createMediaElementSource(element);
    const gain = ctx.createGain();
    gain.gain.value = clamp01(options.volume ?? 1);

    let panner: PannerNode | undefined;
    if (options.spatial || options.position) {
      panner = ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;
      const pos = options.position ?? { x: 0, y: 0, z: 0 };
      panner.positionX.value = pos.x;
      panner.positionY.value = pos.y;
      panner.positionZ.value = pos.z ?? 0;
      source.connect(panner);
      panner.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(sfxBus);

    const inst: SfxInstance = {
      resId,
      element,
      source,
      gain,
      panner,
      tag: options.tag,
      stop: () => {
        try {
          element.pause();
        } catch {}
        try {
          source.disconnect();
        } catch {}
        try {
          gain.disconnect();
        } catch {}
        if (panner)
          try {
            panner.disconnect();
          } catch {}
        activeSfx.delete(inst);
      },
    };

    element.onended = () => {
      options.onEnded?.();
      inst.stop();
    };

    safePlay(element);
    activeSfx.add(inst);
    return inst;
  }

  function stopAllSfx() {
    activeSfx.forEach((i) => i.stop());
    activeSfx.clear();
  }

  function stopSfxByTag(tag?: string) {
    if (!tag) return;
    activeSfx.forEach((i) => {
      if (i.tag === tag) i.stop();
    });
  }

  function setMasterVolume(v: number) {
    ensureContext();
    if (!masterGain) return;
    masterGain.gain.value = clamp01(v);
  }

  function setMusicVolume(v: number) {
    ensureContext();
    if (!musicBus) return;
    musicBus.gain.value = clamp01(v);
  }

  function setSfxVolume(v: number) {
    ensureContext();
    if (!sfxBus) return;
    sfxBus.gain.value = clamp01(v);
  }

  function setVolume(resId: string, volume: number) {
    const e = getResource(resId);
    if (e) e.volume = clamp01(volume);
  }

  function setPlaybackTime(resId: string, second: number) {
    const e = getResource(resId);
    if (e)
      e.currentTime = Math.min(
        Math.max(second, 0),
        e.duration || Number.MAX_SAFE_INTEGER
      );
  }

  function setPlaybackRate(resId: string, rate: number) {
    const e = getResource(resId);
    if (e) e.playbackRate = Math.max(0.01, rate);
  }

  function getDuration(resId: string) {
    const e = getResource(resId);
    return e ? e.duration : 0;
  }

  function canPlay(audioResource: HTMLAudioElement): boolean {
    if (audioResource.canPlayType) {
      const expected = [
        'audio/ogg; codecs="theora, vorbis"',
        "audio/mpeg;",
        'audio/wav; codecs="1"',
      ];
      return expected.some((x) => audioResource.canPlayType(x) !== "");
    }
    return false;
  }

  function registerAlternateSources(
    resId: string,
    sources: Array<{ src: string; type: string }>
  ) {
    altSources.set(resId, sources);
  }

  function rampGain(
    param: AudioParam,
    from: number,
    to: number,
    seconds: number
  ) {
    if (!ctx) return;
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(from, now);
    param.linearRampToValueAtTime(to, now + seconds);
  }

  function safePlay(el: HTMLAudioElement) {
    const p = el.play();
    if (p && typeof p.catch === "function")
      p.catch(() => {
        /* ignore autoplay errors */
      });
  }

  function clamp01(v: number) {
    return Math.min(Math.max(v, 0), 1);
  }

  return {
    start,
    // music controls
    playMusic,
    stopMusic,
    setMusicVolume,
    // sfx controls
    playSfx,
    stopAllSfx,
    stopSfxByTag,
    setSfxVolume,
    // global
    setMasterVolume,
    // utilities / compatibility
    play: (resId: string, loop?: boolean) => playSfx(resId, { loop }),
    stop: (resId: string) => {
      const e = getResource(resId);
      if (!e) return;
      e.pause();
      e.currentTime = 0;
    },
    getDuration,
    pause: (resId: string) => {
      const e = getResource(resId);
      if (e) e.pause();
    },
    reset: (resId: string) => {
      const e = getResource(resId);
      if (e) {
        e.pause();
        e.currentTime = 0;
        e.volume = 1;
      }
    },
    setVolume,
    setPlaybackTime,
    setPlaybackRate,
    canPlay,
    registerAlternateSources,
  };
}
