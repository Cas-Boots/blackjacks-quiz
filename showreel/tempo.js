// Tempo and first downbeat per song, measured by `node muziek.js tempo`. Leave empty to use the score.
(function (root) {
  const TEMPO = {
    "mr-know-it-all.mp3": {
      "bpm": 126,
      "tel": 155.797
    },
    "i-just-might.mp3": {
      "bpm": 103,
      "tel": 140.119
    },
    "dai-dai.mp3": {
      "bpm": 123,
      "tel": 141.417
    },
    "fever-dream.mp3": {
      "bpm": 108,
      "tel": 41.009
    },
    "niemand.mp3": {
      "bpm": 84,
      "tel": 198.283
    },
    "cheerio.mp3": {
      "bpm": 130,
      "tel": 116.241
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = TEMPO; else root.TEMPO = TEMPO;
})(this);
