/** Een portret mag nooit groter zijn dan dit: de telefoon verkleint het al tot 256 bij 256. */
export const MAX_FOTO_TEKENS = 200_000;

/** Alleen een kleine, ingebakken afbeelding; geen adressen naar elders. */
export function geldigeFoto(foto: string): boolean {
  return foto.length <= MAX_FOTO_TEKENS && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(foto);
}
