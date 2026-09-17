/**
 * Maakt van een gekozen foto een klein vierkant portret.
 *
 * Vierkant bijgesneden uit het midden, 256 bij 256, als JPEG. Zo blijft
 * elk portret onder de twintig kilobyte en past de hele tafel ruim in de
 * momentopname die naar elke telefoon gaat.
 */
export async function maakPortret(bestand: File, maat = 256): Promise<string> {
  const bron = await laadAfbeelding(bestand);
  const kant = Math.min(bron.width, bron.height);
  const x = (bron.width - kant) / 2;
  const y = (bron.height - kant) / 2;

  const doek = document.createElement('canvas');
  doek.width = maat;
  doek.height = maat;
  const ctx = doek.getContext('2d');
  if (!ctx) throw new Error('geen canvas');
  ctx.drawImage(bron, x, y, kant, kant, 0, 0, maat, maat);
  return doek.toDataURL('image/jpeg', 0.82);
}

async function laadAfbeelding(bestand: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap kent de EXIF-draaiing, zodat een selfie rechtop staat.
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(bestand, { imageOrientation: 'from-image' });
    } catch {
      /* val terug op een gewoon Image-element */
    }
  }
  return new Promise((los, wijsAf) => {
    const url = URL.createObjectURL(bestand);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      los(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      wijsAf(new Error('afbeelding niet leesbaar'));
    };
    img.src = url;
  });
}
