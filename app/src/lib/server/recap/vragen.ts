/**
 * Levende vragen: vraag én antwoord komen uit de cijfers van resolution-recap.
 *
 * Elke sleutel (`live: "sport.meeste"` in index.html) hoort bij één functie
 * hieronder. Die kijkt naar de analyse van dat moment en schrijft de vraag,
 * het antwoord en een toelichting. Zo hoeft er op de ochtend van de quiz
 * niets met de hand bijgewerkt te worden, en kloppen de cijfers ook als er
 * de avond ervoor nog is gesport.
 *
 * De teksten passen zich aan de cijfers aan: is er niet één maar zijn er
 * twee mensen zonder sportschool, dan vraagt de vraag naar allebei.
 */
import type { Vraag } from '$lib/content/types';
import type { VoorspellingenUitslag } from '$lib/shared/state';
import { VOORSPELLING_OPLOSSERS } from './voorspellingen';
import {
  type Analyse, type Persoon, datumTekst, maandNaam, opsomming, sportNaam, telwoord, zoekSportTag,
} from './analyse';

export interface LevendAntwoord {
  v: string;
  a: string;
  toelichting?: string;
}

type Oplosser = (a: Analyse, arg: string) => LevendAntwoord;

const keer = (n: number) => `${n} keer`;
const gesorteerd = (a: Analyse, van: (p: Persoon) => number) => [...a.personen].sort((x, y) => van(y) - van(x) || x.naam.localeCompare(y.naam));
const rest = (lijst: Persoon[], van: (p: Persoon) => number, eenheid = '') =>
  lijst.map((p) => `${p.naam} met ${van(p)}${eenheid}`);

/** 'Daarna Liz met 91, Eva met 84, ...' */
function daarna(lijst: Persoon[], van: (p: Persoon) => number): string | undefined {
  if (lijst.length < 2) return undefined;
  return `Daarna ${opsomming(rest(lijst.slice(1), van))}.`;
}

const OPLOSSERS: Record<string, Oplosser> = {
  /* ---- Sport --------------------------------------------------------- */

  'sport.meeste': (a) => {
    const lijst = gesorteerd(a, (p) => p.sport.totaal);
    const [eerste, tweede] = lijst;
    if (!eerste) return { v: 'Wie van ons sportte er dit jaar het vaakst?', a: 'Niemand heeft iets bijgehouden' };
    const verreweg = tweede ? eerste.sport.totaal >= tweede.sport.totaal * 1.1 : true;
    return {
      v: `Wie van ons sportte er dit jaar ${verreweg ? 'verreweg ' : ''}het vaakst?`,
      a: `${eerste.naam} — ${keer(eerste.sport.totaal)}`,
      toelichting: daarna(lijst, (p) => p.sport.totaal),
    };
  },

  'sport.geenGym': (a) => {
    const zonder = a.personen.filter((p) => !(p.perSport.get('gym') ?? 0));
    if (zonder.length === 1) {
      return {
        v: 'Wie is de enige van ons die het hele jaar geen enkele keer in de sportschool stond?',
        a: zonder[0].naam,
      };
    }
    if (zonder.length > 1) {
      return {
        v: 'Wie van ons stonden het hele jaar geen enkele keer in de sportschool?',
        a: opsomming(zonder.map((p) => p.naam)),
      };
    }
    const lijst = gesorteerd(a, (p) => -(p.perSport.get('gym') ?? 0));
    return {
      v: 'Wie van ons stond dit jaar het minst vaak in de sportschool?',
      a: `${lijst[0].naam} — ${keer(lijst[0].perSport.get('gym') ?? 0)}`,
      toelichting: daarna(lijst, (p) => p.perSport.get('gym') ?? 0)?.replace('Daarna', 'Dan'),
    };
  },

  'sport.favorietVan': (a) => {
    // Dezelfde persoon als bij sport.geenGym, zodat de vragen op elkaar aansluiten.
    const zonder = a.personen.filter((p) => !(p.perSport.get('gym') ?? 0));
    const wie = zonder.length ? gesorteerd({ ...a, personen: zonder }, (p) => p.sport.totaal)[0] : gesorteerd(a, (p) => -(p.perSport.get('gym') ?? 0))[0];
    if (!wie || !wie.sport.soorten.length) return { v: 'Welke sport deed Rik dan wel het vaakst?', a: 'Niets bijgehouden' };
    const [tag, aantal] = [...wie.perSport.entries()].sort((x, y) => y[1] - x[1])[0];
    const andereMeeste = Math.max(0, ...a.personen.filter((p) => p !== wie).map((p) => p.perSport.get(tag) ?? 0));
    const vakerDanIedereen = aantal > andereMeeste;
    return {
      v: `Welke sport deed ${wie.naam} dan wel${vakerDanIedereen ? ', vaker dan wie ook' : ' het vaakst'}?`,
      a: `${sportNaam(tag)} — ${keer(aantal)}`,
      toelichting: vakerDanIedereen && andereMeeste > 0 ? `De nummer twee zit op ${andereMeeste}.` : undefined,
    };
  },

  'sport.gezamenlijk': (a) => {
    const n = a.personen.length;
    const bijIedereen = [...a.sporten.keys()].filter((tag) => a.personen.every((p) => (p.perSport.get(tag) ?? 0) > 0));
    const preciesEen = bijIedereen.filter((tag) => a.personen.every((p) => p.perSport.get(tag) === 1));
    if (preciesEen.length === 1) {
      return {
        v: `Eén sport staat bij alle ${telwoord(n)} precies één keer genoteerd. Duidelijk één gezamenlijk uitje. Welke?`,
        a: sportNaam(preciesEen[0]),
      };
    }
    if (preciesEen.length > 1) {
      return {
        v: `${telwoord(preciesEen.length, true)} sporten staan bij alle ${telwoord(n)} precies één keer genoteerd. Welke?`,
        a: opsomming(preciesEen.map(sportNaam)),
      };
    }
    if (bijIedereen.length) {
      const tag = bijIedereen.sort((x, y) => (a.sporten.get(x) ?? 0) - (a.sporten.get(y) ?? 0))[0];
      return {
        v: `Eén sport staat bij alle ${telwoord(n)} genoteerd, maar bij bijna niemand vaker dan een paar keer. Welke?`,
        a: sportNaam(tag),
        toelichting: `Samen ${keer(a.sporten.get(tag) ?? 0)}.`,
      };
    }
    const [tag, deelnemers] = [...a.sporten.keys()]
      .map((t) => [t, a.personen.filter((p) => (p.perSport.get(t) ?? 0) > 0).length] as const)
      .sort((x, y) => y[1] - x[1])[0] ?? ['onbekend', 0];
    return {
      v: 'Welke sport is door de meesten van ons minstens één keer gedaan?',
      a: `${sportNaam(tag)} — door ${deelnemers} van de ${n}`,
    };
  },

  'sport.enige': (a, arg) => {
    const tag = zoekSportTag(arg || 'pilates');
    const naam = sportNaam(tag).toLowerCase();
    const wie = a.personen.filter((p) => (p.perSport.get(tag) ?? 0) > 0);
    if (wie.length === 1) {
      return { v: `Wie is de enige die ${naam} heeft bijgehouden?`, a: wie[0].naam, toelichting: keer(wie[0].perSport.get(tag) ?? 0) };
    }
    if (wie.length === 0) return { v: `Wie van ons heeft dit jaar ${naam} bijgehouden?`, a: 'Niemand' };
    return {
      v: `Wie hebben er ${naam} bijgehouden?`,
      a: opsomming(wie.map((p) => p.naam)),
      toelichting: opsomming(rest(wie, (p) => p.perSport.get(tag) ?? 0)) + '.',
    };
  },

  'sport.aantal': (a, arg) => {
    const tag = zoekSportTag(arg || 'physio');
    const naam = sportNaam(tag).toLowerCase();
    const lijst = gesorteerd(a, (p) => p.perSport.get(tag) ?? 0).filter((p) => (p.perSport.get(tag) ?? 0) > 0);
    if (!lijst.length) return { v: `Wie noteerde er dit jaar ${naam}?`, a: 'Niemand' };
    const top = lijst[0].perSport.get(tag) ?? 0;
    const gedeeld = lijst.filter((p) => p.perSport.get(tag) === top);
    if (gedeeld.length > 1) {
      return {
        v: `Wie noteerden er allebei ${telwoord(top)} keer ${naam}?`.replace('allebei', gedeeld.length === 2 ? 'allebei' : 'alle ' + telwoord(gedeeld.length)),
        a: opsomming(gedeeld.map((p) => p.naam)),
      };
    }
    return {
      v: `Wie noteerde er ${telwoord(top)} keer ${naam}?`,
      a: lijst[0].naam,
      toelichting: daarna(lijst, (p) => p.perSport.get(tag) ?? 0),
    };
  },

  'sport.hoogsteDoel': (a) => {
    const met = a.personen.filter((p) => p.sport.doel !== null);
    if (!met.length) return { v: 'Wie legde zichzelf in januari een jaardoel op?', a: 'Niemand' };
    const lijst = gesorteerd({ ...a, personen: met }, (p) => p.sport.doel ?? 0);
    const top = lijst[0].sport.doel ?? 0;
    const gedeeld = lijst.filter((p) => p.sport.doel === top);
    return {
      v: 'Wie legde zichzelf in januari het hoogste doel op?',
      a: gedeeld.length > 1 ? `${opsomming(gedeeld.map((p) => p.naam))} — ${keer(top)} sporten` : `${lijst[0].naam} — ${keer(top)} sporten`,
      toelichting: daarna(lijst.filter((p) => !gedeeld.includes(p) || p === lijst[0]), (p) => p.sport.doel ?? 0),
    };
  },

  'sport.doelBinnen': (a) => {
    const met = a.personen.filter((p) => p.sport.doel !== null);
    if (!met.length) return { v: 'Wie zat er het dichtst bij zijn jaardoel?', a: 'Niemand had een doel' };
    const maand = maandNaam(a.peildatum);
    const binnen = met.filter((p) => p.sport.totaal >= (p.sport.doel ?? Infinity));
    const stand = (p: Persoon) => `${p.naam} ${p.sport.totaal} van ${p.sport.doel}`;
    if (binnen.length) {
      const nog = met.filter((p) => !binnen.includes(p));
      return {
        v: binnen.length === 1 ? `Wie had zijn jaardoel in ${maand} al binnen?` : `Wie hadden hun jaardoel in ${maand} al binnen?`,
        a: opsomming(binnen.map((p) => p.naam)),
        toelichting: `${binnen.map(stand).join(', ')}.${nog.length ? ` ${opsomming(nog.map((p) => p.naam))} ${nog.length === 1 ? 'zat' : 'zaten'} er nog onder.` : ''}`,
      };
    }
    const lijst = gesorteerd({ ...a, personen: met }, (p) => p.sport.totaal / (p.sport.doel || 1));
    const p = lijst[0];
    return {
      v: `Niemand had in ${maand} zijn jaardoel al binnen. Wie zat er het dichtst bij?`,
      a: `${p.naam} — ${p.sport.totaal} van ${p.sport.doel}`,
      toelichting: `Dat is ${Math.round((100 * p.sport.totaal) / (p.sport.doel || 1))} procent.`,
    };
  },

  /* ---- Taart --------------------------------------------------------- */

  'taart.totaal': (a) => {
    const totaal = a.personen.reduce((n, p) => n + p.taart.totaal, 0);
    return { v: 'Hoeveel taarten hebben we dit jaar samen weggewerkt?', a: String(totaal) };
  },

  'taart.meeste': (a) => {
    const totaal = a.personen.reduce((n, p) => n + p.taart.totaal, 0);
    const lijst = gesorteerd(a, (p) => p.taart.totaal);
    const top = lijst[0];
    if (!top || totaal === 0) return { v: 'Wie at daar de meeste van?', a: 'Niemand at taart' };
    const aandeel = top.taart.totaal / totaal;
    const v =
      top.taart.totaal * 2 === totaal ? 'Wie at daar in zijn eentje precies de helft van?'
        : aandeel > 0.5 ? 'Wie at daar in zijn eentje meer dan de helft van?'
          : 'Wie at daar de meeste van?';
    return {
      v,
      a: `${top.naam} — ${top.taart.totaal} ${top.taart.totaal === 1 ? 'taart' : 'taarten'}`,
      toelichting: daarna(lijst, (p) => p.taart.totaal),
    };
  },

  'taart.minste': (a) => {
    const lijst = gesorteerd(a, (p) => -p.taart.totaal);
    if (!lijst.length) return { v: 'Wie at de minste taart?', a: 'Niemand' };
    const min = lijst[0].taart.totaal;
    const wie = lijst.filter((p) => p.taart.totaal === min);
    const v =
      min === 0 ? `Wie ${wie.length === 1 ? 'at' : 'aten'} het hele jaar geen enkele taart?`
        : min === 1 ? `Wie ${wie.length === 1 ? 'kwam' : 'kwamen'} het hele jaar niet verder dan één enkele taart?`
          : `Wie ${wie.length === 1 ? 'kwam' : 'kwamen'} het hele jaar niet verder dan ${telwoord(min)} taarten?`;
    return { v, a: opsomming(wie.map((p) => p.naam)) };
  },

  'taart.drukste': (a) => {
    const perDag = new Map<string, { n: number; wie: string[] }>();
    for (const p of a.personen) {
      for (const [dag, n] of Object.entries(p.taart.dagen)) {
        const rij = perDag.get(dag) ?? { n: 0, wie: [] };
        rij.n += n;
        rij.wie.push(n > 1 ? `${p.naam} (${n})` : p.naam);
        perDag.set(dag, rij);
      }
    }
    const dagen = [...perDag.entries()].sort((x, y) => y[1].n - x[1].n || x[0].localeCompare(y[0]));
    if (!dagen.length) return { v: 'Op welke dag ging de eerste taart erdoorheen?', a: 'Er is nog geen taart gegeten' };
    const [dag, { n, wie }] = dagen[0];
    const ook = dagen.slice(1).filter(([, r]) => r.n === n).map(([d]) => datumTekst(d));
    return {
      v: `Op welke dag gingen er ${telwoord(n)} taarten doorheen — de drukste taartdag van het jaar?`,
      a: datumTekst(dag),
      toelichting: `${opsomming(wie)}.${ook.length ? ` Ook goed: ${opsomming(ook)}.` : ''}`,
    };
  },

  /* ---- Landen -------------------------------------------------------- */

  'landen.meeste': (a) => {
    const lijst = gesorteerd(a, (p) => p.landen.length);
    const top = lijst[0];
    if (!top || !top.landen.length) return { v: 'Wie bezocht de meeste landen?', a: 'Niemand kwam ergens' };
    const gedeeld = lijst.filter((p) => p.landen.length === top.landen.length);
    return {
      v: 'Wie bezocht de meeste landen?',
      a: `${opsomming(gedeeld.map((p) => p.naam))} — ${telwoord(top.landen.length)} stuks`,
      toelichting: daarna(lijst.filter((p) => !gedeeld.includes(p) || p === top), (p) => p.landen.length),
    };
  },

  'landen.samen': (a) => {
    const codes = new Set(a.personen.flatMap((p) => p.landen.map((l) => l.code)));
    return {
      v: 'Hoeveel verschillende landen bezochten we samen?',
      a: telwoord(codes.size, true),
      toelichting: [...codes].map((c) => a.personen.flatMap((p) => p.landen).find((l) => l.code === c)?.naam ?? c).sort().join(', ') + '.',
    };
  },

  'landen.opEenDag': (a) => {
    let beste: { p: Persoon; dag: string; landen: string[] } | null = null;
    for (const p of a.personen) {
      const perDag = new Map<string, string[]>();
      for (const l of p.landen) perDag.set(l.datum, [...(perDag.get(l.datum) ?? []), l.naam]);
      for (const [dag, landen] of perDag) {
        // Landen op de eerste dag van het seizoen zijn meestal in één keer
        // ingevoerd, geen reis. Die tellen niet als 'op één dag'.
        if (dag.slice(5) === '01-01' || dag.slice(5) === '01-02') continue;
        if (!beste || landen.length > beste.landen.length) beste = { p, dag, landen };
      }
    }
    if (beste && beste.landen.length >= 2) {
      return {
        v: `${beste.p.naam} deed op één dag in ${maandNaam(beste.dag)} ${telwoord(beste.landen.length)} landen aan. Welke?`,
        a: opsomming(beste.landen),
      };
    }
    const laatste = a.personen
      .flatMap((p) => p.landen.map((l) => ({ p, l })))
      .sort((x, y) => y.l.datum.localeCompare(x.l.datum))[0];
    if (!laatste) return { v: 'Welk land werd als laatste aan de lijst toegevoegd?', a: 'Nog geen enkel land' };
    return {
      v: 'Welk land werd als laatste aan de lijst toegevoegd, en door wie?',
      a: `${laatste.l.naam}, door ${laatste.p.naam}`,
      toelichting: `Op ${datumTekst(laatste.l.datum)}.`,
    };
  },

  'landen.thuisblijvers': (a) => {
    const thuis = a.personen.filter((p) => p.landen.every((l) => l.code === 'NL'));
    if (thuis.length === 1) return { v: 'Wie van ons kwam het hele jaar niet buiten Nederland?', a: thuis[0].naam };
    if (thuis.length > 1) return { v: 'Wie van ons kwamen het hele jaar niet buiten Nederland?', a: opsomming(thuis.map((p) => p.naam)) };
    const lijst = gesorteerd(a, (p) => -p.landen.length);
    return {
      v: 'Iedereen kwam dit jaar buiten Nederland. Wie bezocht de minste landen?',
      a: `${lijst[0].naam} — ${telwoord(lijst[0].landen.length)}`,
    };
  },
};

/** Sleutels die je in `live:` kunt gebruiken. Voor het hostscherm en de tests. */
export const LIVE_SLEUTELS = [...Object.keys(OPLOSSERS), ...Object.keys(VOORSPELLING_OPLOSSERS)];

/** Lost één sleutel op; null als de sleutel onbekend is. Argument na de dubbele punt: 'sport.enige:pilates'. */
export function beantwoord(sleutel: string, analyse: Analyse, voorspellingen?: VoorspellingenUitslag): LevendAntwoord | null {
  const [naam, arg = ''] = sleutel.split(':');
  try {
    if (VOORSPELLING_OPLOSSERS[naam]) return voorspellingen ? VOORSPELLING_OPLOSSERS[naam](voorspellingen) : null;
    const oplosser = OPLOSSERS[naam];
    return oplosser ? oplosser(analyse, arg) : null;
  } catch (err) {
    console.error(`[recap] vraag ${sleutel} kon niet worden uitgerekend:`, err);
    return null;
  }
}

/** Een vraag met haar levende tekst en antwoord, of onveranderd als er niets te rekenen valt. */
export function verlevendig(vraag: Vraag, analyse: Analyse | null, voorspellingen?: VoorspellingenUitslag): Vraag {
  if (!vraag.live || !analyse) return vraag;
  const uit = beantwoord(vraag.live, analyse, voorspellingen);
  if (!uit) return vraag;
  return { ...vraag, v: uit.v, a: uit.a, toelichting: uit.toelichting, teVullen: false };
}
