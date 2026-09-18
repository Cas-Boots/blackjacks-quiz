/**
 * Houdt het scherm wakker.
 *
 * Een telefoon die na dertig seconden op slot gaat, verliest de live stroom
 * en verbergt het antwoordveld; een laptop aan de televisie schiet halverwege
 * een ronde in de schermbeveiliging. De Screen Wake Lock voorkomt allebei.
 * Browsers geven hem alleen als het tabblad zichtbaar is en laten hem vallen
 * zodra dat niet meer zo is, dus na elke terugkeer wordt hij opnieuw gevraagd.
 * Zonder ondersteuning gebeurt er niets — de quiz werkt dan gewoon door.
 */
export function houdWakker(): () => void {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return () => {};

  let slot: WakeLockSentinel | null = null;
  let gestopt = false;

  const vraag = async () => {
    if (gestopt || document.visibilityState !== 'visible') return;
    try {
      slot = await navigator.wakeLock.request('screen');
      slot.addEventListener('release', () => {
        slot = null;
      });
    } catch {
      /* geen toestemming of batterijbesparing; volgende aanraking proberen we opnieuw */
    }
  };

  const bijZichtbaar = () => void vraag();
  // Sommige browsers geven het slot pas na een aanraking.
  const bijGebaar = () => {
    if (!slot) void vraag();
  };

  void vraag();
  document.addEventListener('visibilitychange', bijZichtbaar);
  window.addEventListener('pointerdown', bijGebaar);
  window.addEventListener('keydown', bijGebaar);

  return () => {
    gestopt = true;
    document.removeEventListener('visibilitychange', bijZichtbaar);
    window.removeEventListener('pointerdown', bijGebaar);
    window.removeEventListener('keydown', bijGebaar);
    void slot?.release();
    slot = null;
  };
}
