// Tempo and first downbeat per song, measured by `node muziek.js tempo`. Leave empty to use the score.
(function (root) {
  const TEMPO = {
    "mr-know-it-all.mp3@HET AFTELLEN": {
      "bpm": 126,
      "tel": 155.797
    },
    "i-just-might.mp3@JANUARI": {
      "bpm": 103,
      "tel": 140.119
    },
    "dai-dai.mp3@MEI": {
      "bpm": 123,
      "tel": 141.417
    },
    "fever-dream.mp3@SEPTEMBER": {
      "bpm": 108,
      "tel": 41.009
    },
    "cheerio.mp3@IN MEMORIAM": {
      "bpm": 130,
      "tel": 71.46
    },
    "cheerio.mp3@HET DOSSIER": {
      "bpm": 130,
      "tel": 116.241
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = TEMPO; else root.TEMPO = TEMPO;
})(this);
