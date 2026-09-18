/**
 * De afrekening van de voorspellingen van januari.
 *
 * Elke voorspelling wordt beoordeeld tegen zijn uitkomst. Een uitkomst kan
 * vast in het bestand staan, uit de cijfers van resolution-recap komen, of
 * uit de quiz zelf (hoeveel mensen er vanavond meespelen). Wat nog open
 * staat, telt niet mee — en dat zeggen de vragen er dan ook bij.
 */
import { VOORSPELLINGEN, VOORSPELLERS, type Voorspelling } from '$lib/content/voorspellingen';
import type { VoorspellingenUitslag, VoorspellingUitslag, VoorspellerStand } from '$lib/shared/state';
import { type Analyse, opsomming, telwoord } from './analyse';

export interface Omgeving {
  analyse: Analyse | null;
  /** Hoeveel mensen er vanavond meespelen; null als dat nog niet vaststaat. */
  aantalSpelers: number | null;
}

const normaliseer = (x: string | number | null | undefined) =>
  String(x ?? '').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

function beoordeelEen(v: Voorspelling, omgeving: Omgeving, eerder: VoorspellingUitslag[]): VoorspellingUitslag {
  const namen = VOORSPELLERS.filter((n) => n in v.antwoorden);
  let uitkomst: string | null = null;
  let open = false;
  let voorlopig = false;
  let goedVan: (naam: string) => boolean | null = () => null;
  let werkelijkVan: (naam: string) => string | undefined = () => undefined;
  const a = omgeving.analyse;
  // Zolang het jaar loopt, kunnen de cijfers uit de recap nog stijgen.
  const jaarVoorbij = a ? a.peildatum >= `${a.jaar}-12-31` : false;

  const vast = v.uitkomst;
  if (vast === null || vast === undefined || vast === '') {
    open = true;
  } else if (vast === 'auto:landen-meeste') {
    const max = a ? Math.max(0, ...a.personen.map((p) => p.landen.length)) : 0;
    uitkomst = a ? String(max) : null;
    open = !a;
    voorlopig = !!a && !jaarVoorbij;
    goedVan = (naam) => normaliseer(v.antwoorden[naam]) === String(max);
  } else if (vast === 'auto:sport-eigen') {
    open = !a;
    voorlopig = !!a && !jaarVoorbij;
    uitkomst = a ? 'Ieder tegen zijn eigen getal' : null;
    werkelijkVan = (naam) => {
      const p = a?.personen.find((x) => x.naam === naam);
      return p ? `${p.sport.totaal} keer` : undefined;
    };
    goedVan = (naam) => {
      const p = a?.personen.find((x) => x.naam === naam);
      if (!p) return null;
      if (p.sport.totaal >= Number(v.antwoorden[naam])) return true;
      // Nog niet gehaald, maar het jaar is nog niet om: dan is het nog niet mis.
      return jaarVoorbij ? false : null;
    };
  } else if (vast === 'auto:spelers') {
    const n = omgeving.aantalSpelers;
    open = n === null;
    uitkomst = n === null ? null : String(n);
    goedVan = (naam) => (n === null ? null : Number(v.antwoorden[naam]) === n);
  } else if (vast === 'auto:meeste-goed') {
    // De rest van de lijst bepaalt wie er bovenaan staat.
    const stand = telStand(eerder);
    const besliste = eerder.filter((e) => !e.open).length;
    open = besliste === 0;
    const top = stand.length ? stand.filter((s) => s.goed === stand[0].goed) : [];
    uitkomst = open ? null : opsomming(top.map((s) => s.naam));
    goedVan = (naam) => (open ? null : top.some((s) => normaliseer(s.naam) === normaliseer(v.antwoorden[naam])));
  } else {
    uitkomst = String(vast);
    if (v.soort === 'open') {
      const lijst = (v.goed ?? []).map(normaliseer);
      goedVan = (naam) => lijst.includes(normaliseer(naam));
    } else {
      goedVan = (naam) => normaliseer(v.antwoorden[naam]) === normaliseer(vast);
    }
  }

  // Nog niet beslist, maar wel al een lijst met wie het goed had? Dan telt die.
  if (open && v.goed?.length) {
    open = false;
    uitkomst = uitkomst ?? 'Beoordeeld door de quizmaster';
    const lijst = v.goed.map(normaliseer);
    goedVan = (naam) => lijst.includes(normaliseer(naam));
  }

  return {
    nr: v.nr,
    vraag: v.vraag,
    soort: v.soort,
    uitkomst,
    open,
    voorlopig,
    toelichting: v.toelichting,
    antwoorden: namen.map((naam) => ({
      naam,
      antwoord: String(v.antwoorden[naam]),
      inzet: v.inzet[naam] ?? 1,
      goed: open ? null : goedVan(naam),
      werkelijk: werkelijkVan(naam),
    })),
  };
}

export function telStand(vragen: VoorspellingUitslag[]): VoorspellerStand[] {
  const per = new Map<string, VoorspellerStand>();
  for (const naam of VOORSPELLERS) per.set(naam, { naam, goed: 0, fout: 0, open: 0, punten: 0 });
  for (const v of vragen) {
    for (const a of v.antwoorden) {
      const s = per.get(a.naam);
      if (!s) continue;
      if (a.goed === null) s.open += 1;
      else if (a.goed) {
        s.goed += 1;
        s.punten += a.inzet;
      } else s.fout += 1;
    }
  }
  return [...per.values()].sort((x, y) => y.punten - x.punten || y.goed - x.goed || x.naam.localeCompare(y.naam));
}

export function beoordeelVoorspellingen(omgeving: Omgeving): VoorspellingenUitslag {
  const vragen: VoorspellingUitslag[] = [];
  for (const v of VOORSPELLINGEN) vragen.push(beoordeelEen(v, omgeving, vragen));
  return { vragen, stand: telStand(vragen), open: vragen.filter((v) => v.open).length };
}

/* ---- De vragen van de ronde 'De Voorspellingen' ------------------------ */

export interface LevendAntwoord {
  v: string;
  a: string;
  toelichting?: string;
}

const nogOpen = (u: VoorspellingenUitslag) =>
  u.open ? ` (${telwoord(u.open)} van de ${telwoord(u.vragen.length)} ${u.open === 1 ? 'staat' : 'staan'} nog open)` : '';

/** Bij een open voorspelling: hoe vaak dezelfde tekst is gegeven. */
function meerderheid(v: VoorspellingUitslag) {
  const telling = new Map<string, string[]>();
  for (const a of v.antwoorden) telling.set(normaliseer(a.antwoord), [...(telling.get(normaliseer(a.antwoord)) ?? []), a.naam]);
  return [...telling.entries()].sort((x, y) => y[1].length - x[1].length)[0];
}

export const VOORSPELLING_OPLOSSERS: Record<string, (u: VoorspellingenUitslag) => LevendAntwoord> = {
  'voorspellingen.meesteGoed': (u) => {
    const [top] = u.stand;
    if (!top || u.stand.every((s) => s.goed === 0)) return { v: 'Wiens voorspellingen kwamen dit jaar het vaakst uit?', a: 'Nog niemand heeft er een goed' + nogOpen(u) };
    const gedeeld = u.stand.filter((s) => s.goed === top.goed && s.punten === top.punten);
    return {
      v: 'Wiens voorspellingen kwamen dit jaar het vaakst uit?',
      a: `${opsomming(gedeeld.map((s) => s.naam))} — ${top.goed} goed, ${top.punten} punten`,
      toelichting: `Daarna ${opsomming(u.stand.filter((s) => !gedeeld.includes(s)).map((s) => `${s.naam} met ${s.goed} goed`))}.${nogOpen(u)}`,
    };
  },
  'voorspellingen.meesteFout': (u) => {
    const lijst = [...u.stand].sort((x, y) => y.fout - x.fout || x.punten - y.punten);
    const [top] = lijst;
    if (!top || top.fout === 0) return { v: 'En wie zat er het vaakst volledig naast?', a: 'Nog niemand zat ernaast' + nogOpen(u) };
    const gedeeld = lijst.filter((s) => s.fout === top.fout);
    return {
      v: 'En wie zat er het vaakst volledig naast?',
      a: `${opsomming(gedeeld.map((s) => s.naam))} — ${top.fout} keer mis`,
      toelichting: nogOpen(u).trim() || undefined,
    };
  },
  'voorspellingen.tegenDeStroom': (u) => {
    // Een ja/nee die uitkwam terwijl niemand of bijna niemand het geloofde.
    const kandidaten = u.vragen
      .filter((v) => !v.open && v.soort !== 'open')
      .map((v) => ({ v, goed: v.antwoorden.filter((a) => a.goed).length }))
      .filter((k) => k.goed <= 1)
      .sort((x, y) => x.goed - y.goed || x.v.nr - y.v.nr);
    const k = kandidaten[0];
    if (!k) return { v: 'Welke voorspelling kwam uit terwijl niemand erin geloofde?', a: 'Nog geen enkele' + nogOpen(u) };
    const wie = k.v.antwoorden.filter((a) => a.goed).map((a) => a.naam);
    return {
      v: k.goed === 0 ? 'Bij welke voorspelling zat werkelijk iedereen ernaast?' : 'Welke voorspelling kwam uit terwijl bijna niemand erin geloofde?',
      a: `Nummer ${k.v.nr}: ${k.v.vraag}`,
      toelichting: `Uitkomst: ${k.v.uitkomst}.${wie.length ? ` Alleen ${opsomming(wie)} had het goed.` : ''}`,
    };
  },
  'voorspellingen.bijnaIedereen': (u) => {
    const kandidaten = u.vragen
      .filter((v) => !v.open)
      .map((v) => ({ v, m: meerderheid(v) }))
      .filter((k) => k.m && k.m[1].length >= Math.ceil(k.v.antwoorden.length * 0.6))
      .filter((k) => k.v.antwoorden.filter((a) => a.goed).length === 0)
      .sort((x, y) => y.m[1].length - x.m[1].length);
    const k = kandidaten[0];
    if (!k) return { v: 'Welke voorspelling deed bijna iedereen, en kwam toch niet uit?', a: 'Geen enkele, tot nu toe' + nogOpen(u) };
    return {
      v: 'Welke voorspelling deed bijna iedereen, en kwam toch niet uit?',
      a: `Nummer ${k.v.nr}: ${k.v.vraag}`,
      toelichting: `${k.m[1].length} van de ${k.v.antwoorden.length} zeiden "${k.v.antwoorden.find((a) => normaliseer(a.antwoord) === k.m[0])?.antwoord}". Uitkomst: ${k.v.uitkomst}.`,
    };
  },
  'voorspellingen.totaalGoed': (u) => {
    const goed = u.vragen.reduce((n, v) => n + v.antwoorden.filter((a) => a.goed).length, 0);
    const totaal = u.vragen.reduce((n, v) => n + v.antwoorden.length, 0);
    return {
      v: 'Hoeveel van alle voorspellingen zijn er samen uitgekomen?',
      a: `${goed} van de ${totaal}`,
      toelichting: nogOpen(u).trim() || undefined,
    };
  },
  'voorspellingen.pijnlijkst': (u) => {
    const mis = u.vragen
      .flatMap((v) => v.antwoorden.filter((a) => a.goed === false).map((a) => ({ v, a })))
      .sort((x, y) => y.a.inzet - x.a.inzet || x.v.nr - y.v.nr);
    const k = mis[0];
    if (!k) return { v: 'Welke voorspelling is het pijnlijkst verkeerd afgelopen?', a: 'Nog geen enkele' + nogOpen(u) };
    return {
      v: 'Welke voorspelling is het pijnlijkst verkeerd afgelopen?',
      a: `${k.a.naam} bij nummer ${k.v.nr}: "${k.a.antwoord}"`,
      toelichting: `${k.a.inzet} ${k.a.inzet === 1 ? 'punt' : 'punten'} ingezet. Uitkomst: ${k.a.werkelijk ?? k.v.uitkomst}.`,
    };
  },
  'voorspellingen.vooruitziend': (u) => {
    const raak = u.vragen
      .map((v) => ({ v, goed: v.antwoorden.filter((a) => a.goed) }))
      .filter((k) => k.goed.length === 1)
      .sort((x, y) => y.goed[0].inzet - x.goed[0].inzet || x.v.nr - y.v.nr);
    const k = raak[0];
    if (!k) return { v: 'Wiens voorspelling verdient de prijs voor beste vooruitziende blik?', a: 'Niemand stond er alleen in' + nogOpen(u) };
    return {
      v: 'Wiens voorspelling verdient de prijs voor beste vooruitziende blik?',
      a: `${k.goed[0].naam} — als enige goed bij nummer ${k.v.nr}`,
      toelichting: `"${k.goed[0].antwoord}" op: ${k.v.vraag}`,
    };
  },
  'voorspellingen.nogOpen': (u) => {
    const open = u.vragen.filter((v) => v.open);
    if (!open.length) return { v: 'Welke voorspelling kan nog net uitkomen in de laatste dagen van het jaar?', a: 'Geen — alles is beslist' };
    return {
      v: open.length === 1 ? 'Welke voorspelling kan nog net uitkomen in de laatste dagen van het jaar?' : 'Welke voorspellingen kunnen nog net uitkomen in de laatste dagen van het jaar?',
      a: opsomming(open.map((v) => `nummer ${v.nr}`)),
      toelichting: open.map((v) => `${v.nr}. ${v.vraag}`).join(' '),
    };
  },
};
