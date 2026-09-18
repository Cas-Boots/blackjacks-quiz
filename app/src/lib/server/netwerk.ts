/**
 * Op welk adres de telefoons en de televisie deze computer kunnen vinden.
 *
 * Een laptop op het thuisnetwerk heeft een adres als 192.168.1.10, maar weet
 * dat zelf niet zomaar: Node ziet alleen een lijst netwerkkaarten. Dit bestand
 * zeeft die lijst tot de adressen die er op de avond toe doen — in de
 * volgorde waarin je ze het liefst op de televisie tikt. Het startscript
 * (`npm run lokaal`), het beheerscherm en de waarschuwing op de televisie
 * gebruiken allemaal dezelfde lijst.
 */
import { networkInterfaces } from 'node:os';
import { existsSync, readFileSync } from 'node:fs';

export interface NetwerkAdres {
  /** Naam van de netwerkkaart, zoals 'Wi-Fi' of 'eth0'. */
  naam: string;
  /** Het IPv4-adres. */
  adres: string;
}

/** Het kleinste deel van wat os.networkInterfaces() teruggeeft dat we nodig hebben. */
export type Netwerkkaarten = Record<string, { family: string | number; internal: boolean; address: string }[] | undefined>;

/**
 * Hoe waarschijnlijk het is dat een adres het thuisnetwerk is.
 *
 * 192.168.x.x is wat bijna elke thuisrouter uitdeelt; 10.x.x.x komt daarna;
 * 172.16–31 is vaker een virtuele kaart (Docker, WSL, een VPN) dan de wifi.
 * Alles buiten de privéreeksen staat achteraan: een publiek adres op een
 * laptop is zeldzaam en bijna nooit wat je wilt.
 */
function rang(adres: string): number {
  if (adres.startsWith('192.168.')) return 0;
  if (adres.startsWith('10.')) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(adres)) return 2;
  return 3;
}

/** Zelf toegekende adressen (169.254.x.x) betekenen 'geen router gevonden'; daar kom je niet mee bij een telefoon. */
function bruikbaar(adres: string): boolean {
  return !adres.startsWith('169.254.');
}

/**
 * Zeeft en sorteert de netwerkkaarten tot een lijst adressen om op de
 * televisie te tikken: alleen IPv4, geen lus naar zichzelf, geen adressen
 * zonder router, het thuisnetwerk voorop.
 *
 * Zuiver, zodat het te testen is met een verzonnen lijst kaarten.
 */
export function lanAdressen(kaarten: Netwerkkaarten): NetwerkAdres[] {
  const lijst: NetwerkAdres[] = [];
  for (const [naam, adressen] of Object.entries(kaarten)) {
    for (const a of adressen ?? []) {
      // Oudere Node-versies geven family als getal (4), nieuwere als 'IPv4'.
      if (a.family !== 'IPv4' && a.family !== 4) continue;
      if (a.internal || !bruikbaar(a.address)) continue;
      lijst.push({ naam, adres: a.address });
    }
  }
  return lijst.sort((x, y) => rang(x.adres) - rang(y.adres) || x.naam.localeCompare(y.naam));
}

/** Draait dit in een container? Dan zijn de eigen adressen niet die van de pc. */
export function inContainer(): boolean {
  return existsSync('/.dockerenv');
}

/**
 * Draait dit in WSL (Linux binnen Windows)?
 *
 * WSL2 heeft standaard een eigen virtueel netwerk: het adres dat Node ziet
 * (172.x.x.x) bestaat alleen binnen WSL, en een telefoon op de wifi komt er
 * niet bij. Dat is precies de valkuil die je pas op de avond ontdekt, dus
 * het startscript waarschuwt ervoor. Met `networkingMode=mirrored` in
 * `.wslconfig` deelt WSL het adres van Windows en is er niets aan de hand.
 */
export function inWsl(): boolean {
  if (process.platform !== 'linux') return false;
  try {
    return /microsoft|wsl/i.test(readFileSync('/proc/version', 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Of het bovenste adres er een is waar een telefoon waarschijnlijk niet bij
 * kan: WSL zonder gespiegeld netwerk laat alleen een 172-adres zien.
 */
export function lijktAfgeschermd(adressen: NetwerkAdres[], wsl: boolean): boolean {
  if (!wsl) return false;
  return adressen.length === 0 || !adressen[0].adres.startsWith('192.168.');
}

/**
 * De adressen van deze computer, klaar om te tonen.
 *
 * In een container ziet Node alleen het adres van de container zelf, niet
 * dat van de pc waarop Docker draait; dan is de lijst leeg in plaats van
 * misleidend.
 */
export function netwerkAdressen(): NetwerkAdres[] {
  if (inContainer()) return [];
  return lanAdressen(networkInterfaces() as Netwerkkaarten);
}

/** Het volledige adres van een scherm op deze computer, zoals `http://192.168.1.10:3000/tv`. */
export function adresUrl(adres: string, poort: number | string, pad = '/'): string {
  return `http://${adres}:${poort}${pad}`;
}
