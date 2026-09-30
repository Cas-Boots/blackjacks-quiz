// Tempo and first downbeat per song, measured by `node muziek.js tempo`. Leave empty to use the score.
(function (root) {
  const TEMPO = {};
  if (typeof module !== 'undefined' && module.exports) module.exports = TEMPO; else root.TEMPO = TEMPO;
})(this);
