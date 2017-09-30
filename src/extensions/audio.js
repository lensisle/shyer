export function createAudioPlayer() {
  let audioCache;

  function start(game, cache) {
    audioCache = cache['audio'];
  }

  function getResource(resId) {
    if (audioCache) {
      return audioCache[resId];
    }
  }

  function play(resId, loop) {
    const audioResource = getResource(resId);
    audioResource.currentTime = 0;
    audioResource.loop = loop;
    if (canPlay(audioResource)) {
      audioResource.play();
    }
  }

  function stop(resId) {
    const audioResource = getResource(resId);
    audioResource.pause();
    audioResource.currentTime = 0;
  }

  function getDuration(resId) {
    const audioResource = getResource(resId);
    return audioResource['duration'];
  }

  function pause(resId) {
    const audioResource = getResource(resId);
    audioResource.pause();
  }

  function reset(resId) {
    const audioResource = getResource(resId);
    audioResource.stop();
    audioResource.volume = 1;
  }

  function setVolume(resId, volume) {
    const audioResource = getResource(resId);
    audioResource.volume = Math.min(Math.max(volume, 0), 1);
  }

  function setPlaybackTime(resId, second) {
    const audioResource = getResource(resId);
    audioResource.currentTime = Math.min(
      Math.max(second, 0),
      getAudioDuration(audioResource)
    );
  }

  function canPlay(audioResource) {
    if (audioResource.canPlayType) {
      const expected = [
        'audio/ogg; codecs="theora, vorbis"',
        'audio/mpeg;',
        'audio/wav; codecs="1"'
      ];
      return (
        expected.filter(x => audioResource.canPlayType(x) !== '').length > 0
      );
    }
    return false;
  }

  return {
    start,
    play,
    stop,
    getDuration,
    pause,
    reset,
    setVolume,
    setPlaybackTime,
    canPlay
  };
}
