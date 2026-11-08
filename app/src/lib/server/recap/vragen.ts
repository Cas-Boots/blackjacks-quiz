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
import { POULE_OPLOSSERS, pouleAnalyse } from './poule';
import { SPORT_2025, TAART_2024 } from './vorigjaar';
import {
  type Analyse, type Persoon, datumTekst, maandNaam, opsomming, sportNaam, telwoord, zoekSportTag,
} from './analyse';

export interface LevendAntwoord {
  v: string;
  a: string;
  toelichting?: string;
  /** Bij een dichtstbij-vraag: het getal dat het dichtst benaderd moet worden. */
  getal?: number;
  eenheid?: string;
  /** Bij ieder zijn eigen getal: het juiste antwoord per speler. */
  eigenGetal?: Record<string, number>;
  /** Een regel per speler, alleen op diens eigen telefoon: het houvast bij de vraag. */
  perSpelerTekst?: Record<string, string>;
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

  /** Wie het hoogste percentage van zijn jaardoel haalde, of met 'laagst' het laagste. */
  'sport.doelProcent': (a, arg) => {
    const met = a.personen.filter((p) => p.sport.doel);
    if (!met.length) return { v: 'Wie kwam het dichtst bij zijn jaardoel?', a: 'Niemand had een doel' };
    const pct = (p: Persoon) => Math.round((100 * p.sport.totaal) / (p.sport.doel || 1));
    const laagst = arg.trim() === 'laagst';
    const lijst = gesorteerd({ ...a, personen: met }, (p) => (laagst ? -1 : 1) * (p.sport.totaal / (p.sport.doel || 1)));
    const [eerste, tweede] = lijst;
    return {
      v: laagst
        ? 'Wie zat er dit jaar, gemeten aan zijn eigen jaardoel, het verst vanaf?'
        : 'Wie haalde dit jaar het hoogste percentage van zijn eigen jaardoel?',
      a: `${eerste.naam} — ${pct(eerste)} procent`,
      toelichting: `${eerste.sport.totaal} keer sporten op een doel van ${eerste.sport.doel}.${tweede ? ` Daarna ${tweede.naam} met ${pct(tweede)} procent.` : ''}`,
    };
  },

  /** Wie als eerste zijn jaardoel binnen had, en op welke dag. */
  'sport.doelEerst': (a, arg) => {
    const gehaald = a.personen
      .filter((p) => p.sport.doel)
      .map((p) => {
        let som = 0;
        const dag = Object.entries(p.sport.dagen)
          .sort(([x], [y]) => x.localeCompare(y))
          .find(([, n]) => (som += n) >= (p.sport.doel ?? Infinity))?.[0];
        return { p, dag };
      })
      .filter((x): x is { p: Persoon; dag: string } => !!x.dag)
      .sort((x, y) => x.dag.localeCompare(y.dag) || x.p.naam.localeCompare(y.p.naam));
    if (!gehaald.length) {
      return OPLOSSERS['sport.doelProcent'](a, '');
    }
    const [eerste, ...rest] = gehaald;
    // Met 'anders': is dit dezelfde als wie het hoogste percentage haalde
    // (sport.doelProcent), vraag dan wie er het verst vanaf zat.
    if (arg.trim() === 'anders') {
      const hoogste = gesorteerd({ ...a, personen: a.personen.filter((p) => p.sport.doel) }, (p) => p.sport.totaal / (p.sport.doel || 1))[0];
      if (hoogste === eerste.p) return OPLOSSERS['sport.doelProcent'](a, 'laagst');
    }
    return {
      v: 'Wie had als eerste zijn jaardoel binnen?',
      a: `${eerste.p.naam} — op ${datumTekst(eerste.dag)}`,
      toelichting: rest.length ? `Daarna ${opsomming(rest.map((x) => `${x.p.naam} op ${datumTekst(x.dag)}`))}.` : undefined,
    };
  },

  /**
   * De inhaalrace ('sport.inhalen:Cas'; zonder naam wie het vaakst sportte):
   * de haas stopt om middernacht met sporten, ieder ander sport in het
   * nieuwe jaar door in zijn eigen tempo van dit jaar. In welke week haalt
   * hij de haas in? Ieder heeft zijn eigen antwoord, de haas zelf doet niet
   * mee. Het tempo is het totaal gedeeld door het aantal weken tot de
   * peildatum (op oudejaarsdag het hele jaar). Wie de haas al voorbij is,
   * zit op week 0; wie niets bijhield, kan niet inhalen en blijft erbuiten.
   *
   * Als houvast staat het totaal van de haas in de vraag, en krijgt ieder
   * op de telefoon zijn eigen totaal: zo valt het te beredeneren, zonder
   * dat het een rekensom met één antwoord wordt.
   */
  'sport.inhalen': (a, arg) => {
    const haas = arg.trim()
      ? a.personen.find((p) => p.naam.toLowerCase() === arg.trim().toLowerCase())
      : gesorteerd(a, (p) => p.sport.totaal)[0];
    if (!haas) throw new Error(`onbekende haas: ${arg}`);
    const eind = a.peildatum < `${a.jaar}-12-31` ? a.peildatum : `${a.jaar}-12-31`;
    const verstreken = (Date.parse(eind) - Date.parse(`${a.jaar}-01-01`)) / (7 * 86_400_000) + 1 / 7;
    const lijst = a.personen
      .filter((p) => p !== haas && p.sport.totaal > 0)
      .map((p) => {
        const tempo = p.sport.totaal / verstreken;
        return { p, week: Math.max(0, Math.ceil((haas.sport.totaal - p.sport.totaal) / tempo - 1e-9)) };
      })
      .sort((x, y) => x.week - y.week || x.p.naam.localeCompare(y.p.naam));
    if (!lijst.length) throw new Error('niemand om te vergelijken');
    const volgend = a.jaar + 1;
    /** 'in maart' of 'in februari 2028': het midden van die week. */
    const wanneer = (week: number) => {
      const dag = new Date(Date.UTC(volgend, 0, 1) + (7 * Math.max(1, week) - 4) * 86_400_000).toISOString().slice(0, 10);
      return `in ${maandNaam(dag)}${Number(dag.slice(0, 4)) > volgend ? ` ${dag.slice(0, 4)}` : ''}`;
    };
    const [eerste] = lijst;
    const laatste = lijst[lijst.length - 1];
    const wie = (x: (typeof lijst)[number]) => (x.week === 0 ? `${x.p.naam} is ${haas.naam} al voorbij` : `${x.p.naam} haalt ${haas.naam} ${wanneer(x.week)} in`);
    return {
      v: `Om middernacht stopt ${haas.naam} met sporten, na ${keer(haas.sport.totaal)} dit jaar. Jij gaat door, in je eigen tempo van ${a.jaar}. In welke week van ${volgend} haal jij ${haas.naam} in?`,
      a: lijst.map((x) => `${x.p.naam} ${x.week}`).join(' · '),
      toelichting: `${wie(eerste)}${laatste !== eerste ? `, ${laatste.p.naam} ${laatste.week === 0 ? 'ook' : `pas ${wanneer(laatste.week)}`}` : ''}. Je tempo: wat je dit jaar sportte, gedeeld door het aantal weken. Speling: per vijf weken een week, en altijd minstens twee.`,
      eigenGetal: Object.fromEntries(lijst.map((x) => [x.p.naam, x.week])),
      perSpelerTekst: Object.fromEntries(lijst.map((x) => [x.p.naam, `Jij sportte dit jaar ${keer(x.p.sport.totaal)}.`])),
      eenheid: 'week',
    };
  },

  /** Een duel tussen twee van ons: 'sport.duel:Liz/Eva'. */
  'sport.duel': (a, arg) => {
    const [x, y] = arg.split('/').map((n) => a.personen.find((p) => p.naam.toLowerCase() === n.trim().toLowerCase()));
    if (!x || !y) throw new Error(`onbekend duel: ${arg}`);
    const [winnaar, verliezer] = x.sport.totaal >= y.sport.totaal ? [x, y] : [y, x];
    return {
      v: `Wie sportte dit jaar vaker: ${x.naam} of ${y.naam}?`,
      a: winnaar.sport.totaal === verliezer.sport.totaal
        ? `Gelijk — allebei ${keer(winnaar.sport.totaal)}`
        : `${winnaar.naam} — ${winnaar.sport.totaal} tegen ${verliezer.sport.totaal}`,
    };
  },

  /**
   * Vier of vijf sporten uit onze top, en één die er net buiten valt: welke
   * hoort er niet bij? De top is zo groot als kan zonder gelijkspel op de
   * grens, zodat het antwoord altijd eenduidig is.
   */
  'sport.nietInTop': (a) => {
    const lijst = [...a.sporten.entries()]
      .filter(([t]) => !['physio', 'other', 'onbekend'].includes(t))
      .sort((x, y) => y[1] - x[1] || sportNaam(x[0]).localeCompare(sportNaam(y[0])));
    let k = Math.min(5, lijst.length - 1);
    while (k > 2 && lijst[k - 1][1] === lijst[k][1]) k--;
    if (k < 3) throw new Error('te weinig verschillende sporten voor een top');
    const top = lijst.slice(0, k);
    const [buiten, n] = lijst[k];
    const opties = [...top.map(([t]) => t), buiten].map(sportNaam).sort((p, q) => p.localeCompare(q));
    return {
      v: `Welke van deze sporten staat níet in onze top ${telwoord(k)}: ${opsomming(opties.map((o) => o.toLowerCase())).replace(/ en ([^ ]+)$/, ' of $1')}?`,
      a: `${sportNaam(buiten)} — ${keer(n)}`,
      toelichting: `De top ${telwoord(k)}: ${opsomming(top.map(([t, m]) => `${sportNaam(t).toLowerCase()} (${m})`))}.`,
    };
  },

  /** Wie er ten opzichte van 2025 in verhouding het meest op vooruitging. */
  'sport.vooruit': (a) => {
    const met = a.personen
      .filter((p) => SPORT_2025[p.naam])
      .map((p) => ({ p, toen: SPORT_2025[p.naam], groei: p.sport.totaal / SPORT_2025[p.naam] - 1 }))
      .sort((x, y) => y.groei - x.groei || x.p.naam.localeCompare(y.p.naam));
    if (!met.length) throw new Error('geen cijfers van vorig jaar');
    const [eerste, tweede] = met;
    const pct = (g: number) => `${Math.round(100 * g)} procent`;
    return {
      v: 'Wie ging er vergeleken met vorig jaar het meest op vooruit?',
      a: `${eerste.p.naam} — van ${eerste.toen} naar ${eerste.p.sport.totaal} keer`,
      toelichting: `Dat is ${pct(eerste.groei)} meer.${tweede ? ` Daarna ${tweede.p.naam}: van ${tweede.toen} naar ${tweede.p.sport.totaal}.` : ''}`,
    };
  },

  /** De nummers twee en drie van onze sporten tegen elkaar (de sportschool is altijd één). */
  'sport.sportDuel': (a) => {
    const lijst = [...a.sporten.entries()]
      .filter(([t]) => !['gym', 'physio', 'other', 'onbekend'].includes(t))
      .sort((x, y) => y[1] - x[1] || sportNaam(x[0]).localeCompare(sportNaam(y[0])));
    if (lijst.length < 2) throw new Error('te weinig sporten voor een duel');
    const [[t1, n1], [t2, n2]] = lijst;
    const [x, y] = [t1, t2].map((t) => sportNaam(t).toLowerCase()).sort((p, q) => p.localeCompare(q));
    return {
      v: `Wat deden we dit jaar vaker: ${x} of ${y}?`,
      a: n1 === n2 ? `Gelijk — allebei ${keer(n1)}` : `${sportNaam(t1)} — ${n1} tegen ${n2}`,
      toelichting: 'Na de sportschool, die met afstand bovenaan staat.',
    };
  },

  /** De sport die we samen het vaakst deden, de sportschool niet meegerekend. */
  'sport.naGym': (a) => {
    const lijst = [...a.sporten.entries()]
      .filter(([t]) => !['gym', 'physio', 'other', 'onbekend'].includes(t))
      .sort((x, y) => y[1] - x[1] || sportNaam(x[0]).localeCompare(sportNaam(y[0])));
    const [[tag, n] = ['onbekend', 0], tweede] = lijst;
    return {
      v: 'Welke sport deden we samen het vaakst, als je de sportschool niet meetelt?',
      a: `${sportNaam(tag)} — ${keer(n)}`,
      toelichting: tweede ? `Daarna ${sportNaam(tweede[0]).toLowerCase()} met ${tweede[1]}.` : undefined,
    };
  },

  /** De drukste sportmaand, van ons samen of (met een naam erachter) van één persoon. */
  'sport.drukkeMaand': (a, arg) => {
    const p = arg ? a.personen.find((x) => x.naam.toLowerCase() === arg.trim().toLowerCase()) : undefined;
    if (arg && !p) throw new Error(`onbekende persoon: ${arg}`);
    const perMaand = new Map<string, number>();
    for (const x of p ? [p] : a.personen) {
      for (const [dag, n] of Object.entries(x.sport.dagen)) {
        const maand = dag.slice(0, 7);
        perMaand.set(maand, (perMaand.get(maand) ?? 0) + n);
      }
    }
    const lijst = [...perMaand.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
    const v = p ? `In welke maand sportte ${p.naam} dit jaar het meest?` : 'In welke maand sportten we met z’n allen het meest?';
    if (!lijst.length) return { v, a: 'Niets bijgehouden' };
    const [[maand, n], tweede] = lijst;
    const gedeeld = lijst.filter(([, m]) => m === n).map(([d]) => maandNaam(`${d}-01`));
    return {
      v,
      a: gedeeld.length > 1 ? `${opsomming(gedeeld)} — ${keer(n)} per maand` : `${maandNaam(`${maand}-01`)} — ${keer(n)}`,
      toelichting: tweede && gedeeld.length === 1 ? `Daarna ${maandNaam(`${tweede[0]}-01`)} met ${tweede[1]}.` : undefined,
    };
  },

  /** Drie sporten die iemand wel deed en één die niemand deed: welke hoort er niet bij? */
  'sport.nietGedaan': (a) => {
    // Zo vaak gedaan dat het geen kunst is, of al een vraag in de sportronde.
    const bijIedereen = [...a.sporten.keys()].filter((t) => a.personen.every((p) => (p.perSport.get(t) ?? 0) > 0));
    const overslaan = new Set(['gym', 'physio', 'other', 'onbekend', 'pilates', ...bijIedereen]);
    const wel = [...a.sporten.entries()]
      .filter(([t, n]) => n > 0 && !overslaan.has(t))
      .sort((x, y) => x[1] - y[1] || sportNaam(x[0]).localeCompare(sportNaam(y[0])))
      .slice(0, 3)
      .map(([t]) => t);
    // Sporten die je bij een groep als de onze zou verwachten.
    const niet = ['hockey', 'yoga', 'boxing', 'badminton', 'basketball', 'squash', 'table-tennis', 'dance', 'rowing', 'hiking']
      .find((t) => !(a.sporten.get(t) ?? 0));
    if (wel.length < 3 || !niet) throw new Error('te weinig sporten voor de vraag');
    const opties = [...wel, niet].map(sportNaam).sort((x, y) => x.localeCompare(y));
    const wie = (t: string) => opsomming(a.personen.filter((p) => (p.perSport.get(t) ?? 0) > 0).map((p) => p.naam));
    return {
      v: `Welke van deze sporten heeft niemand van ons dit jaar gedaan: ${opsomming(opties.map((n) => n.toLowerCase())).replace(/ en ([^ ]+)$/, ' of $1')}?`,
      a: sportNaam(niet),
      toelichting: `De rest deed wel iemand: ${opsomming(wel.map((t) => `${sportNaam(t).toLowerCase()} (${wie(t)})`))}.`,
    };
  },

  /* ---- Getallen, voor een dichtstbij-ronde over onszelf --------------- */

  'getal.sportSamen': (a, arg) => {
    const tag = arg ? zoekSportTag(arg) : '';
    const totaal = a.personen.reduce((n, p) => n + (tag ? p.perSport.get(tag) ?? 0 : p.sport.totaal), 0);
    const v =
      !tag ? 'Hoeveel keer hebben we dit jaar met z’n allen gesport?'
        : tag === 'gym' ? 'Hoeveel keer stonden we dit jaar samen in de sportschool?'
          : `Hoeveel keer hebben we dit jaar samen ${sportNaam(tag).toLowerCase()} genoteerd?`;
    return {
      v,
      a: keer(totaal),
      getal: totaal,
      eenheid: 'keer',
      // Bewust zonder wie hoeveel deed: dat is een vraag in de sportronde.
    };
  },

  'getal.sportVan': (a, arg) => {
    const [naam, sport = ''] = arg.split('/');
    const p = a.personen.find((x) => x.naam.toLowerCase() === naam.trim().toLowerCase());
    if (!p) throw new Error(`onbekende persoon: ${naam}`);
    const tag = sport ? zoekSportTag(sport) : '';
    const n = tag ? p.perSport.get(tag) ?? 0 : p.sport.totaal;
    return {
      v: tag ? `Hoeveel keer noteerde ${p.naam} dit jaar ${sportNaam(tag).toLowerCase()}?` : `Hoeveel keer sportte ${p.naam} dit jaar?`,
      a: keer(n),
      getal: n,
      eenheid: 'keer',
      toelichting: tag ? `Van de ${p.sport.totaal} keer sporten in totaal.` : undefined,
    };
  },

  'getal.doelVan': (a, arg) => {
    const p = a.personen.find((x) => x.naam.toLowerCase() === arg.trim().toLowerCase());
    if (!p || p.sport.doel === null) throw new Error(`geen doel voor: ${arg}`);
    const maand = maandNaam(a.peildatum);
    return {
      v: `${p.naam} nam zich in januari voor om ${p.sport.doel} keer te sporten. Hoeveel keer stond de teller in ${maand}?`,
      a: `${keer(p.sport.totaal)} van de ${p.sport.doel}`,
      getal: p.sport.totaal,
      eenheid: 'keer',
      toelichting: `Dat is ${Math.round((100 * p.sport.totaal) / (p.sport.doel || 1))} procent van het doel.`,
    };
  },

  'getal.sportSoorten': (a) => {
    const soorten = [...a.sporten.keys()].filter((t) => t !== 'onbekend' && t !== 'other');
    const zeldzaam = soorten.filter((t) => a.sporten.get(t) === 1).map(sportNaam);
    return {
      v: 'Hoeveel verschillende sporten hebben we dit jaar samen bijgehouden?',
      a: `${soorten.length} sporten`,
      getal: soorten.length,
      eenheid: 'sporten',
      toelichting: zeldzaam.length ? `Eenmalig: ${opsomming(zeldzaam.map((n) => n.toLowerCase()))}.` : undefined,
    };
  },

  /* ---- Taart --------------------------------------------------------- */

  /** Terugblik: wie at in 2024, het taartjaar, de meeste taart, en hoeveel is het nu? */
  'taart.koning2024': (a) => {
    const [naam, toen] = Object.entries(TAART_2024)
      .filter((x): x is [string, number] => x[1] !== null)
      .sort((x, y) => y[1] - x[1])[0];
    const nu = a.personen.find((p) => p.naam === naam)?.taart.totaal;
    return {
      v: 'Wie was in 2024 onze taartkoning?',
      a: `${naam} — ${String(toen).replace('.', ',')} taarten`,
      toelichting: nu !== undefined ? `En dit jaar? ${telwoord(nu, true)}.` : undefined,
    };
  },

  /** Het taarttotaal van dit jaar, met dat van 2024 als referentie. */
  'taart.totaalVs2024': (a) => {
    const getal = (n: number) => String(n).replace('.', ',');
    const toen = Object.values(TAART_2024).reduce<number>((n, x) => n + (x ?? 0), 0);
    const nu = a.personen.reduce((n, p) => n + p.taart.totaal, 0);
    const [koning, zijn] = Object.entries(TAART_2024).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0];
    const verschil = Math.round(100 * (1 - nu / toen));
    return {
      v: `In 2024 aten we samen ${getal(toen)} taarten. Hoeveel waren het er dit jaar? Wie het dichtst bij zit, wint.`,
      a: `${nu} taarten`,
      toelichting: nu < toen
        ? `${verschil} procent minder. ${koning} at er in 2024 in zijn eentje al ${getal(zijn ?? 0)}.`
        : `${-verschil} procent meer dan in 2024.`,
    };
  },

  /** Wie at er dit jaar meer taart dan in 2024. */
  'taart.meerDan2024': (a) => {
    // Wie in 2024 niet meedeed (Bastiaan), telt niet mee.
    const lijst = a.personen
      .filter((p) => typeof TAART_2024[p.naam] === 'number')
      .map((p) => ({ p, toen: TAART_2024[p.naam] as number }))
      .sort((x, y) => (y.p.taart.totaal - y.toen) - (x.p.taart.totaal - x.toen) || x.p.naam.localeCompare(y.p.naam));
    const meer = lijst.filter((x) => x.p.taart.totaal > x.toen);
    const getal = (n: number) => String(n).replace('.', ',');
    const stand = (x: (typeof lijst)[number]) => `${x.p.naam} van ${getal(x.toen)} naar ${x.p.taart.totaal}`;
    if (!meer.length) {
      return { v: 'Wie at er dit jaar méér taart dan in 2024?', a: 'Niemand', toelichting: `${opsomming(lijst.map(stand))}.` };
    }
    return {
      v: 'Wie at er dit jaar méér taart dan in 2024?',
      a: opsomming(meer.map((x) => x.p.naam)),
      toelichting: `${opsomming(meer.map(stand))}.`,
    };
  },

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
export const LIVE_SLEUTELS = [...Object.keys(OPLOSSERS), ...Object.keys(VOORSPELLING_OPLOSSERS), ...Object.keys(POULE_OPLOSSERS)];

/** Lost één sleutel op; null als de sleutel onbekend is. Argument na de dubbele punt: 'sport.enige:pilates'. */
export function beantwoord(sleutel: string, analyse: Analyse, voorspellingen?: VoorspellingenUitslag): LevendAntwoord | null {
  const [naam, arg = ''] = sleutel.split(':');
  try {
    if (VOORSPELLING_OPLOSSERS[naam]) return voorspellingen ? VOORSPELLING_OPLOSSERS[naam](voorspellingen) : null;
    if (POULE_OPLOSSERS[naam]) return POULE_OPLOSSERS[naam](pouleAnalyse());
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
  const getal = uit.getal === undefined ? {} : { getal: uit.getal, eenheid: uit.eenheid ?? vraag.eenheid };
  const eigen = uit.eigenGetal === undefined ? {} : { eigenGetal: uit.eigenGetal, perSpelerTekst: uit.perSpelerTekst, eenheid: uit.eenheid ?? vraag.eenheid };
  return { ...vraag, v: uit.v, a: uit.a, toelichting: uit.toelichting, ...getal, ...eigen, teVullen: false };
}
