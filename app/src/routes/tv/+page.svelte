<script lang="ts">
  import { api, proefSpeelAdres } from '$lib/client/proef';
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { page } from '$app/state';
  import { live } from '$lib/client/live.svelte';
  import { testmodus } from '$lib/client/testmodus.svelte';
  import Testpaneel from '$lib/client/Testpaneel.svelte';
  import Klok from '$lib/client/Klok.svelte';
  import Teller from '$lib/client/Teller.svelte';
  import Confetti from '$lib/client/Confetti.svelte';
  import Getallenlijn from '$lib/client/Getallenlijn.svelte';
  import Ladder from '$lib/client/Ladder.svelte';
  import Podium from '$lib/client/Podium.svelte';
  import Media from '$lib/client/Media.svelte';
  import Cijfers from '$lib/client/Cijfers.svelte';
  import Pauzescherm from '$lib/client/Pauzescherm.svelte';
  import { DRINGEND_VANAF_MS, nogTekst } from '$lib/shared/nieuwjaar';
  import Jaaroverzicht from '$lib/client/Jaaroverzicht.svelte';
  import Overgang, { type OvergangMoment } from '$lib/client/Overgang.svelte';
  import { REEKS_VANAF, DUBBELE_SLOTRONDES } from '$lib/shared/bonus';
  import Portret from '$lib/client/Portret.svelte';
  import Dierenparade, { type Loper } from '$lib/client/Dierenparade.svelte';
  import Plaatmaatje from '$lib/client/Plaatmaatje.svelte';
  import Spotlight, { type Binnenkomer } from '$lib/client/Spotlight.svelte';
  import Pixeldier from '$lib/client/Pixeldier.svelte';
  import { actieVoor, dierenroep, kiesActie, maatjeVan, maatjeVoluit, type Actie } from '$lib/shared/dieren';
  import type { MaatjeOpdracht } from '$lib/client/live.svelte';
  import { flip } from 'svelte/animate';
  import * as geluid from '$lib/client/geluid';
  import { houdWakker } from '$lib/client/wakker';
  import { passend } from '$lib/client/passend';
  import { prijsIcoon } from '$lib/shared/prijzen';
  import { isAfrekening } from '$lib/shared/state';
  import {
    kies, kanteling, metNaam, BEGROETINGEN, WACHTZINNEN, RONDEZINNEN, NIEMAND,
    IEDEREEN_FOUT, IEDEREEN_GOED, LANTAARN, POEDEL, VER_ERNAAST,
  } from '$lib/shared/kwinkslagen';

  /* ---- Testmodus: /tv?test ---------------------------------------------
     Hetzelfde scherm, maar de momentopnamen komen uit testmodus.svelte.ts in
     plaats van van de server. De televisie meldt zich dan niet aan en er
     verandert niets aan het spel dat klaarstaat. */
  let inTest = $derived(page.url.searchParams.has('test'));
  /* Het paneel ligt over de linkerkant van het scherm. Op een breed scherm
     schuift de dia ernaast, verkleind in plaats van anders opgemaakt: zo zie
     je precies wat de televisie laat zien, alleen kleiner. Op een smal
     scherm is er geen plek naast; daar klap je het paneel weg met T. */
  const TESTPANEEL = 360;
  let vensterBreedte = $state(0);
  let naastPaneel = $derived(
    inTest && testmodus.paneelOpen && vensterBreedte >= 900 ? (vensterBreedte - TESTPANEEL) / vensterBreedte : null
  );

  /* De vaste kaartkleuren van de keuzes: A is altijd schoppen, B harten, C ruiten, D klaveren. */
  const KLEUREN = ['♠', '♥', '♦', '♣'];
  /** De vraag als speelkaart: vraag 1 is een aas, vraag 11 een boer. */
  const rang = (i: number) => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][i] ?? String(i + 1);

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let ronde = $derived(staat?.ronde ?? null);
  let rood = $derived(ronde?.suit === '♥' || ronde?.suit === '♦');
  /* Bij een individuele ronde is elke speler zijn eigen "team". Die als
     teamkaarten tonen zet iedere naam twee keer op het scherm; dan is een
     rij naamplaten eerlijker én rustiger. */
  let inTeams = $derived((ronde?.teamModus ?? 'individueel') === 'teams');
  /* Buiten een ronde om: het aanmelden aan de kaarttafel, de uitslag op het
     oudejaarsgala — de avond eindigt tenslotte rond middernacht. */
  /* In de testmodus kun je elk decor op elke dia zetten: /tv?test=vraag-meerkeuze&sfeer=bioscoop. */
  let sfeerProef = $derived(inTest ? page.url.searchParams.get('sfeer') : null);
  let sfeer = $derived(
    sfeerProef ? sfeerProef
    : staat?.fase === 'jaaroverzicht' ? 'bioscoop'
      : staat?.fase === 'einde' ? 'vuurwerk'
      : staat && staat.fase !== 'lobby' ? (ronde?.sfeer ?? 'vilt')
        : 'vilt',
  );

  /** Eén sleutel per dia, zodat Svelte de overgang echt opnieuw speelt. */
  let diaSleutel = $derived(
    `${staat?.fase ?? 'leeg'}:${staat?.rondeIndex ?? 0}:${vraag?.index ?? 0}:${staat?.cijfers?.stap ?? ''}:${staat?.jaaroverzicht?.stap ?? ''}`,
  );

  let aantalVerbonden = $derived((staat?.spelers ?? []).filter((s) => s.verbonden).length);

  /* Hoe langer de vraag, hoe rustiger de letter. Acht regels in de grootste
     maat duwen de keuzes en de inleverrij van de tafel; kleiner zetten is dan
     vriendelijker dan alles laten krimpen. De vragen van de avond zelf blijven
     onder de honderd tekens — dit is er voor wie zijn eigen vragen invult. */
  let vraagmaat = $derived.by(() => {
    const lengte = (vraag?.tekst?.length ?? 0) + (vraag?.lyric?.length ?? 0);
    if (lengte > 220) return 0.56;
    if (lengte > 160) return 0.68;
    if (lengte > 100) return 0.82;
    return 1;
  });

  /* ---- Meedoen via QR --------------------------------------------------
     De televisie kent het adres waarop hij zelf de quiz opende, en dat is
     precies het adres dat telefoons in dezelfde kamer ook kunnen bereiken. */
  let joinAdres = $state('');
  let lokaalAdres = $derived(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(joinHost(joinAdres)));
  /* Staat de televisie op localhost, dan vraagt hij de server welk adres de
     telefoons wél kunnen bereiken. De QR-code wijst dan naar dát adres, zodat
     een televisiescherm op de laptop zelf gewoon werkt; de waarschuwing zegt
     erbij wat er gebeurd is. */
  let netwerkAdressen = $state<{ naam: string; url: string }[]>([]);
  let qrDoel = $derived(lokaalAdres && netwerkAdressen.length ? proefSpeelAdres(netwerkAdressen[0].url) : joinAdres);
  let qrBron = $derived(`/api/qr?doel=${encodeURIComponent(qrDoel)}`);
  $effect(() => {
    if (!lokaalAdres) return;
    fetch(api('/api/adressen'))
      .then((r) => (r.ok ? r.json() : { adressen: [] }))
      .then((d: { adressen: { naam: string; url: string }[] }) => (netwerkAdressen = d.adressen))
      .catch(() => {});
  });

  function joinHost(adres: string) {
    try {
      return new URL(adres).hostname;
    } catch {
      return '';
    }
  }

  /* ---- De gekke momenten ----------------------------------------------
     Alles hier is een kwinkslag op een moment dat het mag. De keuze van
     de zin hangt aan de vraag, zodat elke telefoon dezelfde ziet. */
  let vraagSleutelNu = $derived(`${staat?.rondeIndex ?? 0}:${vraag?.index ?? 0}`);
  /** Een gelegde kaart ligt nooit precies recht. */
  let kantelingNu = $derived(kanteling(diaSleutel));
  let niemandIngeleverd = $derived(staat?.fase === 'antwoord' && staat.inzendingen.length === 0);
  let beoordeeld = $derived(
    (staat?.inzendingen ?? []).length > 0 && (staat?.inzendingen ?? []).every((i) => i.isGoed !== null),
  );
  let alleFout = $derived(beoordeeld && (staat?.inzendingen ?? []).every((i) => i.isGoed === false));
  let alleGoed = $derived(
    beoordeeld && (staat?.inzendingen ?? []).every((i) => i.isGoed === true)
      && (staat?.inzendingen ?? []).length >= Math.max(2, staat?.teams.length ?? 0),
  );

  /* Een wachtzin in de lobby, om de zoveel tijd een andere. */
  let wachtTeller = $state(0);
  let wachtzin = $derived(kies(WACHTZINNEN, `wacht:${wachtTeller}`));

  /* Wie er net binnenkomt krijgt een welkom; vijf seconden later is het weg. */
  let begroeting = $state('');
  /* ---- De maatjes op de grote momenten -------------------------------
     Eén optocht tegelijk: bij binnenkomst, bij een goed antwoord, als
     iedereen fout zit, voor de stijger en voor de winnaar. Verder blijven
     de dieren stil op hun portret, zodat het nooit druk wordt. */
  let optocht = $state<{ id: number; lopers: Loper[]; stemming: 'blij' | 'sip'; feest: boolean } | null>(null);
  let optochtTeller = 0;
  function laatLopen(lopers: Loper[], stemming: 'blij' | 'sip' = 'blij', wacht = 0, feest = false) {
    if (!lopers.length) return;
    setTimeout(() => (optocht = { id: ++optochtTeller, lopers, stemming, feest }), wacht);
  }
  function lopersVan(ids: number[]): Loper[] {
    return ids
      .map((id) => staat?.spelers.find((s) => s.id === id))
      // Wie nog geen maatje koos, loopt niet mee.
      .filter((s) => !!s && !!s.dier)
      .map((s) => ({ id: s!.id, naam: s!.naam, dier: s!.dier, dierNaam: s!.dierNaam }));
  }
  // Boekhouding, geen toestand voor het scherm: bewust niet reactief, anders
  // zou het effect zichzelf bij elke schrijfactie opnieuw aanzwengelen.
  let begroetingTeller = 0;
  let eerderVerbonden = new Set<number>();
  $effect(() => {
    const st = live.staat;
    if (!st) return;
    const nu = new Set(st.spelers.filter((s) => s.verbonden).map((s) => s.id));
    const nieuw = st.spelers.find((s) => nu.has(s.id) && !eerderVerbonden.has(s.id) && eerderVerbonden.size > 0);
    if (nieuw && st.fase === 'lobby') {
      begroetingTeller += 1;
      // Het maatje stelt zichzelf voor in de spotlight; hier alleen een welkom voor de speler.
      begroeting = metNaam(kies(BEGROETINGEN, `${nieuw.naam}:${begroetingTeller}`), nieuw.naam);
      if (nieuw.dier) laatBinnen({ id: nieuw.id, naam: nieuw.naam, dier: nieuw.dier, dierNaam: nieuw.dierNaam });
      geluid.boing();
    }
    // De eerste momentopname telt niet als binnenkomen: die mensen zaten er al.
    eerderVerbonden = nu;
  });
  /* Wie in de lobby voor het eerst een maatje kiest, krijgt alsnog zijn
     entree: dan pas is er een dier om te laten zien. */
  let eerderGekozen: Map<number, string | null> | null = null;
  $effect(() => {
    const st = live.staat;
    if (!st) return;
    const nu = new Map(st.spelers.map((s) => [s.id, s.dier]));
    if (eerderGekozen && st.fase === 'lobby') {
      for (const s of st.spelers) {
        if (s.dier && eerderGekozen.has(s.id) && !eerderGekozen.get(s.id)) {
          laatBinnen({ id: s.id, naam: s.naam, dier: s.dier, dierNaam: s.dierNaam });
          geluid.boing();
        }
      }
    }
    eerderGekozen = nu;
  });

  /* ---- De maatjes in de lobby ----------------------------------------
     Ieders maatje staat op zijn naambordje. Heel af en toe doet er één een
     kunstje, nooit twee tegelijk, zodat de kamer het ziet en het rustig
     blijft. Wie binnenkomt krijgt eerst even het podium (Spotlight). */
  let plaatKunstje = $state<{ spelerId: number; actie: Actie; nr: number } | null>(null);
  let kunstjeNr = 0;
  let vorigeKunstenaar = -1;
  $effect(() => {
    if (staat?.fase !== 'lobby') return;
    let wacht: ReturnType<typeof setTimeout>;
    const volgende = () => {
      wacht = setTimeout(() => {
        const aan = (live.staat?.spelers ?? []).filter((s) => s.verbonden && s.dier && s.id !== vorigeKunstenaar);
        if (aan.length && !spot) {
          const s = aan[Math.floor(Math.random() * aan.length)];
          const dier = maatjeVan(s.dier)!;
          vorigeKunstenaar = s.id;
          plaatKunstje = { spelerId: s.id, actie: kiesActie(dier, 'blij'), nr: ++kunstjeNr };
          setTimeout(() => {
            if (plaatKunstje?.nr === kunstjeNr) plaatKunstje = null;
          }, 2300);
        }
        volgende();
      }, 5000 + Math.random() * 5000);
    };
    volgende();
    return () => clearTimeout(wacht);
  });

  /* ---- Maatjes die spelers vanaf hun telefoon iets laten doen --------
     In de lobby doet het maatje het op zijn eigen naambordje, en gaat het
     voor op wat de regisseur hierboven verzon. Daarna zweeft het even over
     het scherm, net als een reactie. */
  const actieVan = (m: MaatjeOpdracht) => {
    const dier = maatjeVan(m.dier);
    return dier ? actieVoor(dier, m.opdracht, () => ((m.id * 0.618) % 1)) : null;
  };
  let vorigeOpdracht = 0;
  $effect(() => {
    const m = live.maatjes.at(-1);
    if (!m || m.id === vorigeOpdracht) return;
    vorigeOpdracht = m.id;
    geluid.plop();
    const actie = actieVan(m);
    if (live.staat?.fase !== 'lobby' || !actie) return;
    const nr = ++kunstjeNr;
    plaatKunstje = { spelerId: m.spelerId, actie, nr };
    setTimeout(() => {
      if (plaatKunstje?.nr === nr) plaatKunstje = null;
    }, 2300);
  });

  let spot = $state<{ nr: number; wie: Binnenkomer } | null>(null);
  let spotRij: Binnenkomer[] = [];
  let spotNr = 0;
  function laatBinnen(wie: Binnenkomer) {
    if (spot) spotRij.push(wie);
    else spot = { nr: ++spotNr, wie };
  }
  function volgendeSpot() {
    const wie = spotRij.shift();
    spot = wie ? { nr: ++spotNr, wie } : null;
  }

  /* Wie is er het meest gestegen sinds de vorige stand. */
  let stijgerId = $derived.by(() => {
    if (!staat) return null;
    const oudePlek = new Map(standOud.map((r, i) => [r.spelerId, i]));
    let beste = { id: null as number | null, sprong: 0 };
    staat.stand.forEach((r, i) => {
      const sprong = (oudePlek.get(r.spelerId) ?? i) - i;
      if (sprong > beste.sprong) beste = { id: r.spelerId, sprong };
    });
    return beste.id;
  });
  let laatsteId = $derived((staat?.stand.length ?? 0) >= 3 ? staat!.stand[staat!.stand.length - 1].spelerId : null);
  let lantaarnZin = $derived(kies(LANTAARN, `lantaarn:${staat?.rondeIndex ?? 0}`));
  let poedel = $derived(
    (staat?.stand.length ?? 0) >= 3 ? staat!.stand[staat!.stand.length - 1] : null,
  );

  let top3 = $derived((staat?.stand ?? []).slice(0, 3));
  /* ---- De ceremonie bij de uitslag ---------------------------------------
     Van onderen naar boven: eerst de plekken vanaf vier (de laatste eerst),
     dan de derde trede, de tweede, en onder tromgeroffel de eerste met een
     dichte kaart erop die omdraait. Alles in ms vanaf het begin van de dia. */
  function ceremonie(aantal: number) {
    const rest = Math.max(0, aantal - 3);
    const derde = 500 + rest * 650 + 500;
    const tweede = derde + 1900;
    const eerste = tweede + 3300;
    return { rest: (k: number) => 500 + k * 650, derde, tweede, eerste, roffel: eerste - 1700 };
  }
  let ceremonieNu = $derived(ceremonie(staat?.stand.length ?? 0));
  /** De prijzen: de eerste na zoveel ms, daarna steeds een volgende. Gelijk aan de CSS. */
  const PRIJS_EERST_MS = 900;
  const PRIJS_MS = 1300;
  let vorigePrijzenInBeeld = false;
  let winnaarNa = $derived(ceremonieNu.eerste);
  /** De confetti wacht op de winnaar. */
  let confettiAan = $state(false);

  /** Bij een gelijkspel bovenaan winnen ze allebei; dat verdient een eigen zin. */
  let winnaars = $derived((staat?.stand ?? []).filter((r, _, alle) => alle.length && r.punten === alle[0].punten));
  let winZin = $derived(
    winnaars.length === 0 ? 'Niemand wint' : winnaars.length === 1 ? `${winnaars[0].naam} wint` : `${winnaars.map((w) => w.naam).join(' & ')} winnen`,
  );

  /** De spelers achter een inzender: één bij ieder voor zich, meer bij een team. */
  function ledenVan(inzender: string) {
    const team = staat?.teams.find((t) => t.id === inzender);
    return (team?.leden ?? []).map((id) => staat?.spelers.find((s) => s.id === id)).filter((s) => !!s);
  }

  /* Eén dier roept iets bij de onthulling: van de eerste die het goed had. */
  let roeper = $derived.by(() => {
    if (!staat || staat.fase !== 'antwoord' || alleGoed) return null;
    const eerste = staat.inzendingen.find((i) => i.isGoed === true);
    const sp = eerste ? ledenVan(eerste.inzender)[0] : null;
    const dier = maatjeVan(sp?.dier);
    if (!sp || !dier) return null;
    return { dier, zin: dierenroep(sp.dier, sp.naam, 'goed', vraagSleutelNu) };
  });
  let winDier = $derived.by(() => {
    if (winnaars.length !== 1) return null;
    const w = winnaars[0];
    const dierNaam = staat?.spelers.find((s) => s.id === w.spelerId)?.dierNaam;
    const dier = maatjeVan(w.dier);
    return dier ? { ...dier, voluit: maatjeVoluit(dier, dierNaam) } : null;
  });

  /* Zodra een vraag beoordeeld is: wie punten pakte rent blij over het
     scherm; zat iedereen fout, dan sjokt de hele tafel eronderdoor. Eén keer
     per vraag, en pas als de onthulling even heeft kunnen landen. */
  let optochtVoorVraag = '';
  $effect(() => {
    if (staat?.fase !== 'antwoord' || !beoordeeld || optochtVoorVraag === vraagSleutelNu) return;
    optochtVoorVraag = vraagSleutelNu;
    const winnaarIds = Object.entries(staat.uitdeling).filter(([, p]) => p > 0).map(([id]) => Number(id));
    if (winnaarIds.length) laatLopen(lopersVan(winnaarIds), 'blij', 1400);
    else if (alleFout) laatLopen(lopersVan(staat.inzendingen.flatMap((i) => ledenVan(i.inzender).map((s) => s.id))), 'sip', 1400);
  });

  /** De naam waaronder een inzender op het scherm staat: speler of team. */
  function naamVan(inzender: string): string {
    const team = staat?.teams.find((t) => t.id === inzender);
    if (!team) return '?';
    return team.leden.length === 1 && !inTeams ? team.naam : `${team.suit} ${team.naam}`;
  }

  /* ---- Geluid ---------------------------------------------------------
     Browsers laten pas geluid toe na een echte aanraking, dus de eerste klik
     of toetsaanslag wekt de audio. Tot dat moment staat er een discrete
     hint in beeld. */
  let geluidAan = $state(true);
  let gewekt = $state(false);

  function wekGeluid() {
    geluid.wek();
    gewekt = geluid.isGewekt();
  }

  function wisselGeluid() {
    wekGeluid();
    geluidAan = !geluidAan;
    geluid.zetAan(geluidAan);
  }

  /* ---- De stand: eerst de oude volgorde, dan schuiven ------------------
     Het scorebord verschijnt in de volgorde van vóór deze ronde en gaat pas
     daarna naar de nieuwe. Dat is het moment waar het bij een quiz om draait:
     je ziet iemand stijgen. */
  let toonNieuweVolgorde = $state(false);

  let standOud = $derived(
    [...(staat?.stand ?? [])].sort((a, b) => {
      const pa = live.vorigePunten[a.spelerId] ?? a.punten;
      const pb = live.vorigePunten[b.spelerId] ?? b.punten;
      return pb - pa || a.naam.localeCompare(b.naam, 'nl');
    }),
  );
  let standNu = $derived(toonNieuweVolgorde ? (staat?.stand ?? []) : standOud);

  /** Hoeveel plekken iemand deze ronde steeg (positief) of zakte (negatief). */
  let verschuiving = $derived.by(() => {
    const oud = new Map(standOud.map((r, i) => [r.spelerId, i]));
    const nu = new Map((staat?.stand ?? []).map((r, i) => [r.spelerId, i]));
    const uit: Record<number, number> = {};
    for (const [id, i] of nu) uit[id] = (oud.get(id) ?? i) - i;
    return uit;
  });
  /** De geheime stand: op alfabet, zodat de volgorde niets verraadt. */
  let geheimeVolgorde = $derived([...(staat?.stand ?? [])].sort((a, b) => a.naam.localeCompare(b.naam, 'nl')));
  let geheimZin = $derived.by(() => {
    if (!staat) return '';
    const over = staat.rondeAantal - staat.rondeIndex - 1;
    const n = TELWOORD[over] ?? String(over);
    if (over <= 0) return 'Wie er wint, hoor je zo bij de uitslag.';
    if (over === 1) return 'Pas bij de uitslag zie je wie er wint. Nog één ronde, en die telt dubbel: alles kan nog.';
    if (over <= DUBBELE_SLOTRONDES) return `Pas bij de uitslag zie je wie er wint. Nog ${n} rondes, en ze tellen allebei dubbel: alles kan nog.`;
    return `Pas bij de uitslag zie je wie er wint. Nog ${n} rondes, de laatste ${TELWOORD[DUBBELE_SLOTRONDES]} tellen dubbel: alles kan nog.`;
  });
  let leiderPunten = $derived(Math.max(1, staat?.stand[0]?.punten ?? 1));

  const TELWOORD = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien'];
  /** Eén zin over het gat bovenaan, en wat er nog kan. */
  let standVerhaal = $derived.by(() => {
    if (!staat || staat.stand.length < 2) return null;
    const [a, b] = staat.stand;
    const fmt = (n: number) => n.toLocaleString('nl-NL');
    const kop = a.punten === b.punten
      ? `${a.naam} en ${b.naam} staan gelijk bovenaan.`
      : `${a.naam} staat ${fmt(a.punten - b.punten)} punten voor op ${b.naam}.`;
    const over = staat.rondeAantal - staat.rondeIndex - 1;
    const n = TELWOORD[over] ?? String(over);
    if (over <= 0) return kop;
    if (over === 1) return `${kop} Nog één ronde, en die telt dubbel.`;
    if (over <= DUBBELE_SLOTRONDES) return `${kop} Nog ${n} rondes, en ze tellen allebei dubbel.`;
    return `${kop} Nog ${n} rondes; de laatste ${TELWOORD[DUBBELE_SLOTRONDES]} tellen dubbel.`;
  });

  /* ---- De show ---------------------------------------------------------
     Een kaart die over het scherm vliegt tussen twee blokken, drie-twee-één
     aan het begin, en een tromgeroffel voor elke onthulling. */
  let overgang = $state<OvergangMoment | null>(null);
  let overgangTeller = 0;
  /** Tijdens de tromgeroffel staat het antwoord nog niet in beeld. */
  let onthulKlaar = $state(true);
  let onthulTimer: ReturnType<typeof setTimeout> | null = null;
  const ROFFEL_MS = 1450;

  /** Iedereen met een telefoon aan tafel heeft ingeleverd; de klok is al ingekort. */
  let alleBinnen = $derived.by(() => {
    if (!staat || staat.fase !== 'vraag') return false;
    const moeten = staat.teams.filter((t) => t.leden.length > 0);
    return moeten.length > 0 && moeten.every((t) => staat.ingeleverd.includes(t.id));
  });

  /* Bij meerkeuze vallen de foute opties één voor één af; --n is de beurt. */
  let aantalFout = $derived((vraag?.opties ?? []).filter((_, i) => i !== staat?.onthulling?.goedeOptie).length);
  function beurt(i: number): number {
    const goed = staat?.onthulling?.goedeOptie;
    if (i === goed) return aantalFout;
    return (vraag?.opties ?? []).slice(0, i).filter((_, j) => j !== goed).length;
  }

  /** Welke optie een inzending koos: een letter (meerkeuze) of de tekst zelf (waar of niet waar). */
  function optieVan(tekst: string, opties: string[]): number {
    const t = tekst.trim();
    if (/^[A-Za-z]$/.test(t)) return t.toUpperCase().charCodeAt(0) - 65;
    return opties.findIndex((o) => o.toLowerCase() === t.toLowerCase());
  }
  /** Per optie wie erop inzette: hun fiches liggen op die kaart. */
  let kiezersPerOptie = $derived.by(() => {
    const opties = vraag?.opties ?? [];
    const per: string[][] = opties.map(() => []);
    for (const i of staat?.inzendingen ?? []) {
      const k = optieVan(i.tekst, opties);
      if (k >= 0 && k < per.length) per[k].push(i.inzender);
    }
    return per;
  });
  /** Het moment zelf: alleen als er iets te vieren valt. */
  let viering = $derived(
    staat?.fase === 'antwoord' && onthulKlaar && !niemandIngeleverd && !alleFout,
  );
  /** Een knal is een handvol deeltjes; het decor bepaalt wat het zijn. */
  const DEELTJES = Array.from({ length: 14 }, (_, k) => k);

  /** De punten die een inzender (speler of team) bij deze vraag kreeg, per persoon. */
  function puntenVoor(inzender: string): number {
    const team = staat?.teams.find((t) => t.id === inzender);
    if (!team) return 0;
    return Math.max(0, ...team.leden.map((id) => staat?.uitdeling[id] ?? 0));
  }

  function naamVanSpeler(id: number): string {
    return staat?.spelers.find((s) => s.id === id)?.naam ?? '?';
  }
  /** Ieder voor zich telt snelheid mee; in teams en bij stemmen is goed altijd evenveel waard. */
  let snelheidTelt = $derived(!inTeams && ronde?.type !== 'stem');

  /* ---- Geluidsmomenten -------------------------------------------------
     Elk geluid hangt aan een overgang, niet aan een toestand. Zonder deze
     vergelijking met de vorige waarde zou elke binnenkomende momentopname
     het geluid opnieuw afspelen. */
  let vorigeFase = $state('');
  /** Bij welke dia van de film het geluid het laatst klonk. */
  let vorigeFilmStap = -1;
  let vorigeVraag = $state('');
  let vorigAantalIngeleverd = $state(0);
  let vorigeSeconde = $state(99);
  let vorigePuntenSom = $state(-1);
  let vorigAlleFout = false;
  let vorigTijdOm = false;
  let vorigAantalReacties = 0;

  $effect(() => {
    const nu = alleFout && onthulKlaar;
    if (nu && !vorigAlleFout) geluid.wahwah();
    vorigAlleFout = nu;
  });
  let vorigAlleBinnen = false;
  $effect(() => {
    if (alleBinnen && !vorigAlleBinnen) geluid.iedereenBinnen();
    vorigAlleBinnen = alleBinnen;
  });
  /* Het geluidsbord van de quizmaster. */
  let vorigBordgeluid = 0;
  $effect(() => {
    const g = live.geluid;
    if (!g || g.id === vorigBordgeluid) return;
    vorigBordgeluid = g.id;
    geluid.speelBord(g.geluid);
  });
  $effect(() => {
    if (tijdOm && !vorigTijdOm) geluid.stempel();
    vorigTijdOm = tijdOm;
  });
  $effect(() => {
    const n = live.reacties.length;
    if (n > vorigAantalReacties) geluid.plop();
    vorigAantalReacties = n;
  });

  $effect(() => {
    const st = live.staat;
    if (!st) return;
    const vraagSleutel = `${st.rondeIndex}:${st.vraag?.index ?? -1}`;

    if (st.fase !== vorigeFase) {
      if (st.fase === 'jaaroverzicht') geluid.projector();
      const van = vorigeFase;
      // De overgang speelt alleen bij een echte stap, niet bij het openen van de pagina.
      let naOvergang = 0;
      if (van) {
        const kaart = (suit: string, tekst: string) => {
          overgang = { id: ++overgangTeller, soort: 'kaart', suit, tekst };
          naOvergang = 600;
        };
        // De eerste ronde, na de lobby of na de trailer van het jaaroverzicht.
        if (st.fase === 'ronde' && st.rondeIndex === 0 && (van === 'lobby' || van === 'jaaroverzicht')) {
          overgang = { id: ++overgangTeller, soort: 'aftellen', suit: '♠', tekst: 'Daar gaan we!' };
          naOvergang = 3300;
        } else if (st.fase === 'ronde') kaart(st.ronde?.suit ?? '♠', `Ronde ${st.rondeIndex + 1}`);
        else if (st.fase === 'stand') kaart(st.ronde?.suit ?? '♠', 'Tussenstand');
        else if (st.fase === 'einde') kaart('♠', 'De uitslag');
      }

      if (onthulTimer) clearTimeout(onthulTimer);
      onthulTimer = null;
      if (st.fase === 'antwoord' && van === 'vraag') {
        // Eerst de tromgeroffel, dan pas het antwoord.
        onthulKlaar = false;
        geluid.tromgeroffel(ROFFEL_MS / 1000);
        onthulTimer = setTimeout(() => {
          onthulKlaar = true;
          geluid.onthul();
        }, ROFFEL_MS);
      } else {
        onthulKlaar = true;
        if (st.fase === 'antwoord') geluid.onthul();
      }

      if (st.fase === 'ronde') setTimeout(() => geluid.rondeStart(), naOvergang);
      if (st.fase === 'stand' || st.fase === 'einde') {
        toonNieuweVolgorde = false;
        setTimeout(() => geluid.roffel(), naOvergang);
        // Even de oude volgorde laten staan, dan laten schuiven.
        setTimeout(() => (toonNieuweVolgorde = true), 900 + naOvergang);
        // De ceremonie: een fiche per plek vanaf onderen, een tik per trede,
        // de roffel voor de eerste en de fanfare als de kaart omdraait.
        if (st.fase === 'einde') {
          const c = ceremonie(st.stand.length);
          for (let k = 0; k < Math.max(0, st.stand.length - 3); k++) setTimeout(() => geluid.fiche(), c.rest(k));
          setTimeout(() => geluid.plop(), c.derde);
          setTimeout(() => geluid.plop(), c.tweede);
          setTimeout(() => geluid.tromgeroffel(1.6), c.roffel);
          setTimeout(() => geluid.fanfare(), c.eerste);
          confettiAan = false;
          setTimeout(() => (confettiAan = true), c.eerste);
        }
        // Het maatje van de stijger maakt een rondje; bij de uitslag dat van de winnaar.
        if (st.fase === 'stand' && stijgerId !== null && !st.standGeheim) laatLopen(lopersVan([stijgerId]), 'blij', 2200 + naOvergang);
        if (st.fase === 'einde') laatLopen(lopersVan(winnaars.map((w) => w.spelerId)), 'blij', ceremonie(st.stand.length).eerste + 900, true);
      }
      vorigeFase = st.fase;
    }

    // Het tweede bedrijf van de uitslag, op de knop van de quizmaster: een zwiep,
    // en dan een stempel bij elke prijs die binnenkomt (zie PRIJS_MS hieronder).
    const prijzenNu = st.fase === 'einde' && st.prijzenInBeeld;
    if (prijzenNu && !vorigePrijzenInBeeld) {
      geluid.zwiep();
      const aantal = st.prijzen.length + (st.stand.length >= 3 && st.stand[st.stand.length - 1].punten < st.stand[0].punten ? 1 : 0);
      for (let i = 0; i < aantal; i++) setTimeout(() => geluid.stempel(), PRIJS_EERST_MS + i * PRIJS_MS + 350);
    }
    vorigePrijzenInBeeld = prijzenNu;

    if (st.fase === 'jaaroverzicht' && st.jaaroverzicht && st.jaaroverzicht.stap !== vorigeFilmStap) {
      // De titelkaart heeft de projector al; de rest krijgt een tikje.
      if (vorigeFilmStap >= 0) (st.jaaroverzicht.onthuld ? geluid.balkOpen : geluid.filmtik)();
      vorigeFilmStap = st.jaaroverzicht.stap;
    }
    if (st.fase !== 'jaaroverzicht') vorigeFilmStap = -1;

    if (st.fase === 'vraag' && vraagSleutel !== vorigeVraag) {
      geluid.vraagOp();
      vorigeVraag = vraagSleutel;
      vorigAantalIngeleverd = 0;
      vorigeSeconde = 99;
    }

    if (st.fase === 'vraag' && st.ingeleverd.length > vorigAantalIngeleverd) {
      geluid.ingeleverd();
    }
    vorigAantalIngeleverd = st.ingeleverd.length;

    // Punten erbij tijdens de onthulling: een kort signaal.
    const som = st.stand.reduce((n, r) => n + r.punten, 0);
    if (vorigePuntenSom >= 0 && som > vorigePuntenSom && st.fase === 'antwoord' && onthulKlaar) {
      geluid.juist();
      geluid.fiche(0.25);
      geluid.fiche(0.4);
    }
    vorigePuntenSom = som;
  });

  /* ---- Aftikken in de laatste seconden -------------------------------- */
  let restSec = $state(99);
  /** Hoe lang het nog is tot middernacht; null zolang er geen staat is. */
  let middernachtMs = $state<number | null>(null);
  onMount(() => {
    const t = setInterval(() => {
      middernachtMs = live.totMiddernachtMs();
      const st = live.staat;
      if (!st?.klok?.loopt) {
        restSec = 99;
        return;
      }
      const sec = Math.ceil(live.resterendMs() / 1000);
      restSec = sec;
      if (sec < vorigeSeconde && sec <= 5 && sec > 0) geluid.tik(sec <= 3);
      if (sec <= 0 && vorigeSeconde > 0) geluid.tijdOm();
      vorigeSeconde = sec;
    }, 120);
    return () => clearInterval(t);
  });

  /* De laatste tien minuten voor middernacht ziet de kamer het ook, zolang de
     quizmaster nog niet voor het aftellen heeft gepauzeerd. */
  let middernachtNadert = $derived(
    !staat?.pauze && middernachtMs !== null && middernachtMs > 0 && middernachtMs <= DRINGEND_VANAF_MS,
  );

  let spanning = $derived(restSec <= 5 && restSec > 0 && live.staat?.klok?.loopt === true);
  /** De klok staat op nul en de quizmaster heeft nog niet onthuld. */
  let tijdOm = $derived(live.staat?.fase === 'vraag' && live.staat?.klok?.loopt === true && restSec <= 0);

  onMount(() => {
    // Bij een proefrit brengt de code een telefoon naar die proefrit, niet naar de echte avond.
    joinAdres = proefSpeelAdres(`${location.origin}/`);
    const wacht = setInterval(() => (wachtTeller += 1), 7000);
    if (inTest) {
      testmodus.start(page.url.searchParams.get('test'));
    } else {
      live.start();
      void live.meld('tv').catch(() => {});
    }
    // De laptop aan de televisie mag niet halverwege in de schermbeveiliging schieten.
    const laatSlapen = houdWakker();
    const opGebaar = () => wekGeluid();
    window.addEventListener('pointerdown', opGebaar, { once: true });
    window.addEventListener('keydown', opGebaar, { once: true });
    return () => {
      clearInterval(wacht);
      laatSlapen();
      if (inTest) testmodus.stop();
      else live.stop();
      window.removeEventListener('pointerdown', opGebaar);
      window.removeEventListener('keydown', opGebaar);
    };
  });
</script>

<svelte:head><title>{inTest ? 'Testmodus · ' : ''}Blackjack Quiz 26/27</title></svelte:head>

<svelte:window bind:innerWidth={vensterBreedte} />

{#if inTest}
  <Testpaneel />
{/if}

<div
  class="scherm televisie"
  class:spanning
  class:roffelt={!onthulKlaar}
  data-sfeer={sfeer}
  style:transform={naastPaneel ? `scale(${naastPaneel})` : null}
  style:transform-origin={naastPaneel ? '100% 50%' : null}
>
  <Overgang moment={overgang} />
  <!-- Motief dat bij het onderwerp hoort; fluisterend, nooit storend. -->
  <div class="motief" aria-hidden="true"></div>
  <!-- De uitslag: schijnwerpers zoeken de winnaar, daarna blijft het vuurwerk gaan. -->
  {#if staat?.fase === 'einde'}
    <div class="galashow" aria-hidden="true" style="--eerste:{ceremonieNu.eerste}ms">
      <i class="schijnwerper links"></i><i class="schijnwerper rechts"></i>
      <i class="pijl" style="--x:14%;--y:22%;--w:0s"></i>
      <i class="pijl" style="--x:84%;--y:16%;--w:.9s"></i>
      <i class="pijl" style="--x:30%;--y:9%;--w:1.7s"></i>
      <i class="pijl" style="--x:70%;--y:30%;--w:2.4s"></i>
      <i class="pijl" style="--x:8%;--y:55%;--w:3.1s"></i>
      <i class="pijl" style="--x:92%;--y:50%;--w:3.8s"></i>
    </div>
  {/if}
  <!-- Het onthulmoment van het decor: de lamp, de schijnwerpers, de bliksem… -->
  {#if viering}
    {#key vraagSleutelNu}
      <div class="onthulflits" aria-hidden="true" style="--wacht:{vraag?.opties ? aantalFout * 0.32 + 0.55 : 0.25}s"><i></i><i></i></div>
    {/key}
  {/if}
  <!-- Randgloed in de laatste seconden. Puur sfeer, vangt geen klikken. -->
  <div class="spanningsrand" aria-hidden="true"></div>
  <!-- Reacties van de telefoons zweven omhoog en zijn dan weg. -->
  <div class="reacties" aria-hidden="true">
    {#each live.reacties as r (r.id)}
      <div class="reactie" style="--x:{r.x}%">
        <span class="emoji">{r.emoji}</span>
        <span class="van">{r.naam}</span>
      </div>
    {/each}
    {#if staat?.fase !== 'lobby'}
      {#each live.maatjes.filter((m) => m.dier) as m (m.id)}
        <div class="reactie maatjereactie" style="--x:{m.x}%">
          <Plaatmaatje sleutel={m.dier!} kunstje={actieVan(m)} beurt={m.id} />
          <span class="van">{m.dierNaam ?? m.naam}</span>
        </div>
      {/each}
    {/if}
  </div>

  {#if optocht}
    {#key optocht.id}
      <Dierenparade lopers={optocht.lopers} stemming={optocht.stemming} feest={optocht.feest} klaar={() => (optocht = null)} />
    {/key}
  {/if}
  <!-- Wie binnenkomt krijgt even het podium, één tegelijk. -->
  {#if spot}
    {#key spot.nr}
      <!-- Het dier van nu: wie net binnen is, kiest vaak meteen een ander. -->
      <Spotlight wie={staat?.spelers.find((s) => s.id === spot?.wie.id) ?? spot.wie} klaar={volgendeSpot} />
    {/key}
  {/if}

  <button
    class="geluidsknop"
    onclick={wisselGeluid}
    title={gewekt ? (geluidAan ? 'Geluid uit' : 'Geluid aan') : 'Klik om geluid aan te zetten'}
    aria-label={geluidAan ? 'Geluid uit' : 'Geluid aan'}
  >
    {#if !gewekt}🔇 klik voor geluid{:else if geluidAan}🔊{:else}🔈{/if}
  </button>

  {#if staat?.pauze}
    <Pauzescherm soort={staat.pauze} />
  {/if}

  {#if middernachtNadert && middernachtMs !== null}
    <p class="middernacht-melding" transition:fade={{ duration: 400 }}>🎆 {nogTekst(middernachtMs)} tot middernacht</p>
  {/if}

  <!-- De rondekop hoort bij het spel, niet bij het aanmelden of de uitslag. -->
  {#if staat && ronde && staat.fase !== 'lobby' && staat.fase !== 'einde' && staat.fase !== 'jaaroverzicht'}
    <header class="rail">
      <span class="suit" class:rood>{ronde?.suit}</span>
      <span class="titel">
        <p class="etiket stil">Ronde {staat.rondeIndex + 1} van {staat.rondeAantal}</p>
        <h2>{ronde?.naam}</h2>
      </span>
      {#if vraag}
        <span class="vorderingen" aria-hidden="true">
          {#each Array(vraag.aantal) as _, i}
            <i class:gehad={i < vraag.index} class:nu={i === vraag.index}></i>
          {/each}
        </span>
        <span class="teller">{vraag.index + 1} / {vraag.aantal}</span>
      {/if}
      <Klok vorm="ring" />
    </header>
  {/if}

  {#key diaSleutel}
    <div class="romp midden" in:fade={{ duration: 260, easing: cubicOut }}>
      <!-- Confetti hangt over het hele scherm en hoort dus buiten het vlak:
           binnen een geschaald vlak zou hij met de dia meekrimpen. -->
      {#if staat?.fase === 'einde' && confettiAan}
        <!-- Op het gala: goud, champagne en een vleug roze. -->
        <Confetti kleuren={['#e6c46a', '#fff0bd', '#f6ecd2', '#d9b45a', '#ffd1dc', '#ffffff']} />
      {/if}
      <!-- Het vlak met de dia zelf. Past hij niet op de televisie, dan gaat
           alles een maat kleiner in plaats van dat de onderkant wegvalt. -->
      <div class="vlak" use:passend>
        {#if !staat}
          <h1 class="groot" style="text-align:center;color:var(--salie)">Verbinden…</h1>

          <!-- ══ Aanmeldscherm ══════════════════════════════════════════ -->
        {:else if staat.fase === 'lobby'}
          <div class="lobby">
            <div class="lobby-tekst">
              <p class="etiket" in:fly={{ y: -14, duration: 500, easing: cubicOut }}>Oud &amp; Nieuw · Blackjacks</p>
              <h1 class="mega" in:fly={{ y: 26, duration: 620, easing: cubicOut }}>Blackjack Quiz 26/27</h1>
              <hr class="rule" style="width:min(620px,70vw)" />
              <p class="lood">Scan de code met je telefoon, kies je naam, en je hebt je antwoordblad in handen.</p>

              <div class="knoprij maatjesrij" style="margin-top:.5rem">
                {#each staat.spelers as s, i (s.id)}
                  <span class="naamplaat metmaatje" class:aan={s.verbonden} in:fly={{ y: 18, duration: 420, delay: 120 + i * 90, easing: cubicOut }}>
                    <span class="stip" class:aan={s.verbonden}></span>
                    <Portret naam={s.naam} foto={s.foto} dier={s.dier} dierNaam={s.dierNaam} zonderDier />
                    <strong>{s.naam}</strong>
                    {#if s.dier}
                      <Plaatmaatje
                        sleutel={s.dier}
                        kunstje={plaatKunstje?.spelerId === s.id ? plaatKunstje.actie : null}
                        beurt={plaatKunstje?.spelerId === s.id ? plaatKunstje.nr : 0}
                        slaapt={!s.verbonden}
                      />
                    {/if}
                  </span>
                {/each}
              </div>
              <p class="fijn" style="font-size:var(--fs-etiket)">
                {#if aantalVerbonden === staat.spelers.length && staat.spelers.length > 0}
                  Iedereen is erbij. We kunnen beginnen.
                {:else}
                  {aantalVerbonden} van {staat.spelers.length} telefoons erbij
                {/if}
              </p>
              {#key begroeting || wachtzin}
                {#if begroeting}
                  <p class="kwinkslag begroeting" onanimationend={(e) => e.animationName === 'wegzakken' && (begroeting = '')}>{begroeting}</p>
                {:else}
                  <p class="kwinkslag">{wachtzin}</p>
                {/if}
              {/key}
            </div>

            {#if joinAdres}
              <div class="qr-kaart" in:fly={{ y: 24, duration: 560, delay: 200, easing: cubicOut }}>
                <img class="qr" src={qrBron} alt="QR-code om mee te doen" />
                <p class="qr-adres">{qrDoel.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
                {#if lokaalAdres}
                  <p class="qr-let-op">
                    {#if netwerkAdressen.length}
                      Dit scherm is geopend via localhost; de code wijst daarom naar het
                      netwerkadres van deze computer ({netwerkAdressen[0].naam}).
                      {#if netwerkAdressen.length > 1}Komt een telefoon er niet bij, dan staan de
                      andere adressen van deze computer op het beheerscherm.{/if}
                    {:else}
                      Dit is het adres van deze computer zelf; de telefoons kunnen de code zo niet
                      gebruiken. Open het televisiescherm via het netwerkadres van de laptop
                      (bijvoorbeeld 192.168.1.10:3000).
                    {/if}
                  </p>
                {/if}
              </div>
            {/if}
          </div>

          <!-- ══ Het jaaroverzicht ══════════════════════════════════════ -->
        {:else if staat.fase === 'jaaroverzicht' && staat.jaaroverzicht}
          <Jaaroverzicht dia={staat.jaaroverzicht} spelers={staat.spelers} loopt={staat.klok?.loopt === true} />

          <!-- ══ Titelkaart van de ronde ════════════════════════════════ -->
        {:else if staat.fase === 'ronde'}
          <div style="display:flex;flex-direction:column;gap:clamp(.9rem,2.4vh,2rem)">
            <p class="etiket" in:fly={{ x: -20, duration: 460, easing: cubicOut }}>
              Ronde {staat.rondeIndex + 1} · {ronde?.thema}
            </p>
            <h1 class="mega" in:fly={{ y: 28, duration: 620, delay: 80, easing: cubicOut }}>
              <span style="color:{rood ? 'var(--rood-licht)' : 'var(--goud)'}">{ronde?.suit}</span>
              {ronde?.naam}
            </h1>
            <hr class="rule" style="animation-delay:.3s" />
            <p class="lood" in:fly={{ y: 16, duration: 520, delay: 300, easing: cubicOut }}>{ronde?.uitleg}</p>
            {#if isAfrekening(ronde)}
              <p class="lood" style="opacity:.8" in:fly={{ y: 16, duration: 520, delay: 450, easing: cubicOut }}>
                Telefoons mogen weg: wie in januari voorspelde, krijgt de punten van wat er uitkwam.
              </p>
            {:else}
              <p class="fijn" in:fade={{ duration: 500, delay: 700 }} style="font-size:var(--fs-etiket);color:var(--goud-licht)">
                {#if inTeams}🤝 Neem de tijd: in teams is goed altijd evenveel waard ·
                {:else if ronde?.type !== 'stem'}⚡ Hoe sneller goed, hoe meer punten ·{/if}
                🃏 Eén vraag is de gouden kaart: dubbele punten
              </p>
              {#if ronde?.dubbel}
                <p class="dubbel-banier" in:scale={{ start: 0.7, duration: 620, delay: 900, easing: cubicOut }}>×2 · Slotronde: alles telt dubbel</p>
              {/if}
              <p class="kwinkslag" style="animation-delay:.9s">{kies(RONDEZINNEN, `ronde:${staat.rondeIndex}`)}</p>
            {/if}

            {#if inTeams}
              <div class="raster" style="margin-top:clamp(.5rem,2vh,1.5rem)">
                {#each staat.teams as t, i (t.id)}
                  <div class="teamkaart" in:fly={{ y: 24, duration: 480, delay: 420 + i * 110, easing: cubicOut }}>
                    <span class="kop">
                      <span class="suit" class:rood={t.suit === '♥' || t.suit === '♦'}>{t.suit}</span>
                      {t.naam}
                    </span>
                    <div class="knoprij">
                      {#each t.leden as id (id)}
                        {@const sp = staat.spelers.find((x) => x.id === id)}
                        <span class="naamplaat" style="padding:.35rem .8rem .35rem .35rem">
                          <Portret naam={sp?.naam ?? '?'} foto={sp?.foto} dier={sp?.dier} stijl="width:1.9rem;height:1.9rem;font-size:1.1rem" />
                          {sp?.naam ?? '?'}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div style="display:flex;flex-direction:column;gap:.9rem;margin-top:clamp(.5rem,2vh,1.5rem)">
                <p class="etiket stil">Ieder voor zich</p>
                <div class="knoprij">
                  {#each staat.spelers as sp, i (sp.id)}
                    <span class="naamplaat" in:fly={{ y: 20, duration: 440, delay: 420 + i * 90, easing: cubicOut }}>
                      <Portret naam={sp.naam} foto={sp.foto} dier={sp.dier} />
                      <strong>{sp.naam}</strong>
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- ══ De vraag ═══════════════════════════════════════════════ -->
        {:else if staat.fase === 'vraag' && vraag}
          <div style="display:flex;flex-direction:column;gap:clamp(.8rem,2vh,1.6rem)">
            <div class="tafelkaart" data-suit={ronde?.suit} data-rang={rang(vraag.index)} style="--vraagmaat:{vraagmaat};--kanteling:{kantelingNu}deg">
              {#if tijdOm}
                <span class="stempel rechtsboven" style="--hoek:-11deg">Tijd!</span>
              {/if}
              <p class="etiket">Vraag {vraag.index + 1} · {snelheidTelt ? 'tot ' : ''}{vraag.maximaal.toLocaleString('nl-NL')} punten</p>
              {#if vraag.goud}
                <p class="gouden-kaart" in:scale={{ start: 0.6, duration: 560, easing: cubicOut }}>🃏 Gouden kaart · ×{vraag.vermenigvuldiger}</p>
              {:else if vraag.vermenigvuldiger > 1}
                <p class="gouden-kaart dubbel">×{vraag.vermenigvuldiger} · Dubbele punten</p>
              {/if}
              {#if vraag.emoji}<div class="emoji">{vraag.emoji}</div>{/if}
              {#if vraag.lyric}<p class="lyric">“{vraag.lyric}”</p>{/if}
              <p class="vraagtekst">{vraag.tekst}</p>
              {#if vraag.media}
                <Media media={vraag.media} speelt={staat.mediaSpeelt} />
              {/if}
              {#if vraag.eenheid}
                <p class="fijn eenheid">Antwoord in {vraag.eenheid}.</p>
              {/if}
            </div>

            <!-- De keuzes: vier kaarten op tafel, altijd A♠ B♥ C♦ D♣ — op de televisie én op de telefoon. -->
            {#if vraag.opties}
              <div class="keuzes" data-aantal={vraag.opties.length}>
                {#each vraag.opties as optie, i}
                  <div class="keuze" data-suit={KLEUREN[i % 4]} style="--i:{i}" in:fly={{ y: 40, duration: 520, delay: 260 + i * 110, easing: cubicOut }}>
                    <span class="letter" aria-hidden="true">{String.fromCharCode(65 + i)}<i>{KLEUREN[i % 4]}</i></span><span class="optie">{optie}</span>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Wie is er al binnen. Geen antwoorden, alleen namen. -->
            <div class="inleverrij" in:fade={{ duration: 400, delay: 400 }}>
              {#each staat.teams as t (t.id)}
                <span class="vak" class:binnen={staat.ingeleverd.includes(t.id)}>
                  <i class="fichetje" aria-hidden="true">{t.naam.slice(0, 1)}</i>{t.naam}
                </span>
              {/each}
            </div>
            {#if alleBinnen && !tijdOm}
              <p class="iedereen-binnen">Iedereen is binnen! Nog even…</p>
            {/if}
          </div>

          <!-- ══ De onthulling ══════════════════════════════════════════ -->
        {:else if staat.fase === 'antwoord' && vraag}
          <div style="display:flex;flex-direction:column;gap:clamp(.8rem,2vh,1.4rem)">
            <div class="tafelkaart" data-suit={ronde?.suit} data-rang={rang(vraag.index)} style="padding-block:clamp(16px,2vw,32px);--vraagmaat:{vraagmaat};--kanteling:{kantelingNu}deg">
              {#if vraag.emoji}<div class="emoji klein">{vraag.emoji}</div>{/if}
              {#if vraag.lyric}<p class="lyric klein">“{vraag.lyric}”</p>{/if}
              <p class="vraagtekst klein">{vraag.tekst}</p>
              {#if vraag.media}
                <Media media={vraag.media} speelt={staat.mediaSpeelt} klein />
              {/if}
            </div>
            {#if vraag.opties}
              <div class="keuzes klein" data-aantal={vraag.opties.length}>
                {#each vraag.opties as optie, i}
                  <div
                    class="keuze"
                    data-suit={KLEUREN[i % 4]}
                    class:goed={onthulKlaar && i === staat.onthulling?.goedeOptie}
                    class:fout={onthulKlaar && staat.onthulling?.goedeOptie !== undefined && i !== staat.onthulling?.goedeOptie}
                    class:omklappen={i === staat.onthulling?.goedeOptie}
                    class:afvallen={i !== staat.onthulling?.goedeOptie}
                    style="--n:{beurt(i)};--i:{i}"
                  >
                    <span class="letter" aria-hidden="true">{String.fromCharCode(65 + i)}<i>{KLEUREN[i % 4]}</i></span><span class="optie">{optie}</span>
                    {#if kiezersPerOptie[i]?.length}
                      <span class="kiezers">
                        {#each kiezersPerOptie[i] as wie, n (wie)}
                          <i class="inzet" style="--j:{n}" title={naamVan(wie)}>{naamVan(wie).slice(0, 1)}</i>
                        {/each}
                      </span>
                    {/if}
                    {#if viering && i === staat.onthulling?.goedeOptie}
                      <span class="knal" aria-hidden="true">{#each DEELTJES as k (k)}<i style="--k:{k}"></i>{/each}</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}

            {#if !onthulKlaar}
              <div class="trommel">
                <span class="stokken" aria-hidden="true">🥁</span>
                <p class="etiket">En het antwoord is…</p>
              </div>
            {:else}
            <div
              class="onthulling"
              class:na-keuzes={vraag.opties && staat.onthulling?.goedeOptie !== undefined}
              style="--n:{aantalFout}"
            >
              {#if alleFout}
                <span class="stempel" style="--hoek:-8deg">Iedereen fout</span>
              {:else if alleGoed}
                <span class="stempel groen" style="--hoek:6deg">Iedereen goed</span>
              {/if}
              {#if viering && !vraag.opties}
                <span class="knal" aria-hidden="true">{#each DEELTJES as k (k)}<i style="--k:{k}"></i>{/each}</span>
              {/if}
              <p class="etiket stil">Het antwoord</p>
              <p class="antwoordtekst">{staat.onthulling?.antwoord}</p>
              {#if staat.onthulling?.toelichting}
                <p class="toelichting" in:fade={{ duration: 400, delay: 450 }}>{staat.onthulling.toelichting}</p>
              {/if}
            </div>

            <!-- Wat iedereen had ingetikt. Dit is het moment waar de tafel op wacht. -->
            {#if niemandIngeleverd}
              <p class="kwinkslag" style="text-align:center;animation-delay:.5s">{kies(NIEMAND, vraagSleutelNu)}</p>
            {:else if alleFout}
              <p class="kwinkslag" style="text-align:center">{kies(IEDEREEN_FOUT, vraagSleutelNu)}</p>
            {:else if alleGoed}
              <p class="kwinkslag" style="text-align:center">{kies(IEDEREEN_GOED, vraagSleutelNu)}</p>
            {:else if roeper}
              <p class="kwinkslag dierenroep" style="animation-delay:.8s">
                <Pixeldier sleutel={roeper.dier.sleutel} pose="blij" />{roeper.zin}
              </p>
            {/if}
            {#if staat.inzendingen.length}
              {#if vraag.type === 'stem' && staat.onthulling?.stemmen}
                <div class="stemtelling" in:fade={{ duration: 400, delay: 500 }}>
                  {#each staat.onthulling.stemmen as t, n (t.naam)}
                    {@const sp = staat.spelers.find((x) => x.naam === t.naam)}
                    {@const meeste = staat.onthulling.stemmen[0].aantal}
                    <div class="stemrij" class:wint={t.aantal === meeste} style="--i:{n}" in:fly={{ x: -18, duration: 380, delay: 500 + n * 120, easing: cubicOut }}>
                      <span class="kroonhouder" class:kroon={t.aantal === meeste}>
                        <Portret naam={t.naam} foto={sp?.foto} dier={sp?.dier} maat="m" />
                      </span>
                      <span class="naam">{t.naam}</span>
                      <span class="stembalk"><i style="--deel:{t.aantal / Math.max(1, staat.inzendingen.length)}"></i></span>
                      <span class="stemaantal">{t.aantal}</span>
                      <span class="stemmers">{t.van.map(naamVan).join(', ')}</span>
                    </div>
                  {/each}
                </div>
              {:else if staat.onthulling?.eigen?.length}
                <div in:fade={{ duration: 400, delay: 500 }}>
                  <Ladder rijen={staat.onthulling.eigen} eenheid={staat.onthulling.eenheid ?? ''} />
                </div>
              {:else if vraag.type === 'dichtstbij' && staat.onthulling?.getal !== undefined}
                <div in:fade={{ duration: 400, delay: 600 }}>
                  <Getallenlijn
                    doel={staat.onthulling.getal}
                    eenheid={staat.onthulling.eenheid ?? ''}
                    verLabel={kies(VER_ERNAAST, vraagSleutelNu)}
                    gokken={staat.inzendingen
                      .filter((i) => i.getal !== null)
                      .map((i) => ({ naam: naamVan(i.inzender), getal: i.getal as number, wint: i.isGoed === true }))}
                  />
                </div>
              {:else}
                <div class="antwoordenrij">
                  {#each staat.inzendingen as i, n (i.inzender)}
                    <div
                      class="antwoordkaart"
                      class:goed={i.isGoed === true}
                      class:fout={i.isGoed === false}
                      in:fly={{ y: 16, duration: 380, delay: 500 + n * 90, easing: cubicOut }}
                    >
                      <span class="wie">{naamVan(i.inzender)}</span>
                      <span class="wat">{i.tekst || '—'}</span>
                      <span class="oordeel" aria-hidden="true">{i.isGoed === true ? '✓' : i.isGoed === false ? '✗' : ''}</span>
                      <!-- In het geheime laatste stuk alleen goed of fout: de punten verraden de stand. -->
                      {#if i.isGoed === true && puntenVoor(i.inzender) > 0 && !staat.standGeheim}
                        <span class="fiche" style="--wacht:{0.7 + n * 0.09}s"><span>+{puntenVoor(i.inzender)}</span></span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
            {/if}
          </div>

          <!-- ══ De cijfers van het jaar ════════════════════════════════ -->
        {:else if staat.fase === 'cijfers' && staat.cijfers}
          <Cijfers cijfers={staat.cijfers} spelers={staat.spelers} />

          <!-- ══ Tussenstand ════════════════════════════════════════════ -->
        {:else if staat.fase === 'stand' && staat.standGeheim}
          <!-- De slotrondes: de stand blijft geheim tot de uitslag. Alleen de
               namen, op alfabet, met een dichte fiche waar de punten stonden. -->
          <div class="geheimstand">
            <p class="etiket" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>{ronde?.naam} zit erop</p>
            <h1 class="groot" in:fly={{ y: 22, duration: 520, delay: 60, easing: cubicOut }}>De stand is geheim</h1>
            <hr class="rule" style="animation-delay:.25s" />
            <p class="standverhaal" in:fly={{ y: 10, duration: 480, delay: 400, easing: cubicOut }}>{geheimZin}</p>
            <div class="geheimspelers">
              {#each geheimeVolgorde as r, i (r.spelerId)}
                <div class="geheimspeler" style="--i:{i}">
                  <Portret naam={r.naam} foto={r.foto} dier={r.dier} maat="m" />
                  <span class="naam">{r.naam}</span>
                  <span class="dichtefiche" aria-label="punten geheim">?</span>
                </div>
              {/each}
            </div>
          </div>

        {:else if staat.fase === 'stand'}
          <div style="display:flex;flex-direction:column;gap:clamp(.8rem,2vh,1.6rem)">
            <p class="etiket" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>{ronde?.naam} zit erop</p>
            <h1 class="groot" in:fly={{ y: 22, duration: 520, delay: 60, easing: cubicOut }}>Tussenstand</h1>
            <hr class="rule" style="animation-delay:.25s" />
            {#if toonNieuweVolgorde && standVerhaal}
              <p class="standverhaal" in:fly={{ y: 10, duration: 480, delay: 500, easing: cubicOut }}>{standVerhaal}</p>
            {/if}
            {#if staat.laatsteOpenStand}
              <p class="laatstekeer" in:scale={{ start: 0.8, duration: 560, delay: 1400, easing: cubicOut }}>
                👀 Kijk goed: dit is de laatste keer dat jullie de stand zien. De rest van de avond blijft hij geheim.
              </p>
            {/if}
            {#if toonNieuweVolgorde && laatsteId !== null && standNu[standNu.length - 1].punten < standNu[0].punten}
              <p class="kwinkslag" style="animation-delay:1.1s">{staat.stand[staat.stand.length - 1].naam}: {lantaarnZin.charAt(0).toLowerCase() + lantaarnZin.slice(1)}</p>
            {/if}
            <div class="stand">
              {#each standNu as r, i (r.spelerId)}
                <div class="standrij" class:leider={toonNieuweVolgorde && i === 0} class:laatste={toonNieuweVolgorde && r.spelerId === laatsteId && r.punten < standNu[0].punten} style="--i:{i}" animate:flip={{ duration: 720, easing: cubicOut }}>
                  <span class="plek">
                    {i + 1}
                    {#if toonNieuweVolgorde && verschuiving[r.spelerId]}
                      <span class="verschuiving" class:op={verschuiving[r.spelerId] > 0} class:neer={verschuiving[r.spelerId] < 0}>
                        {verschuiving[r.spelerId] > 0 ? '▲' : '▼'}{Math.abs(verschuiving[r.spelerId])}
                      </span>
                    {/if}
                  </span>
                  <span class="kroonhouder" class:kroon={toonNieuweVolgorde && i === 0}>
                    <Portret naam={r.naam} foto={r.foto} dier={r.dier} maat="m" goud={toonNieuweVolgorde && i === 0} />
                  </span>
                  <span class="naam">
                    {r.naam}
                    {#if toonNieuweVolgorde && r.spelerId === stijgerId}<span class="badge stijger">📈 Stijger</span>{/if}
                    {#if (staat.reeksen[r.spelerId] ?? 0) >= REEKS_VANAF}<span class="badge vuur">🔥 {staat.reeksen[r.spelerId]} op rij</span>{/if}
                  </span>
                  <span class="standpunten">
                    <Teller naar={r.punten} van={live.vorigePunten[r.spelerId] ?? r.punten} vertraging={250} />
                    {#if toonNieuweVolgorde && (r.dezeRonde ?? 0) > 0}
                      <span class="fiche" style="--wacht:{0.2 + i * 0.12}s"><span>+{r.dezeRonde}</span></span>
                    {/if}
                  </span>
                  <!-- Hoe ver iemand achter de koploper zit, in één oogopslag. -->
                  <span class="standbalk" aria-hidden="true"><i style="--deel:{Math.max(0.02, r.punten / leiderPunten)}"></i></span>
                </div>
              {/each}
            </div>
          </div>

          <!-- ══ De uitslag ═════════════════════════════════════════════ -->
        {:else if staat.fase === 'einde'}
          <div class="uitslagdia" class:prijzen={staat.prijzenInBeeld} style="--roffel:{ceremonieNu.roffel}ms;--eerste:{ceremonieNu.eerste}ms;--prijs-eerst:{PRIJS_EERST_MS}ms;--prijs-stap:{PRIJS_MS}ms">
            <!-- Eerste bedrijf: het podium, met het hele scherm voor zich. -->
            <div class="akte podiumakte">
              <p class="etiket" in:fly={{ y: -14, duration: 460, easing: cubicOut }}>{staat.quizNaam}</p>
              <!-- Eén plek voor drie zinnen: de uitslag, de roffel, de winnaar. -->
              <div class="winnaarkop">
                <p class="mega opbouw" aria-hidden="true">De uitslag</p>
                <p class="mega opbouw roffelzin" aria-hidden="true">En de winnaar is…</p>
                <h1 class="mega winnaar">{winZin}</h1>
              </div>
              <p class="lood na-winnaar" style="text-align:center">
                Met {(staat.stand[0]?.punten ?? 0).toLocaleString('nl-NL')} {staat.stand[0]?.punten === 1 ? 'punt' : 'punten'}.
                {#if winDier}<br /><span class="dierenroep"><Pixeldier sleutel={winDier.sleutel} pose="blij" /> Hulde aan {winDier.voluit}!</span>{/if}
              </p>

              <Podium {top3} vorigePunten={live.vorigePunten} tijden={[ceremonieNu.eerste, ceremonieNu.tweede, ceremonieNu.derde]} />

              <!-- Vanaf de vierde plek: kaarten op tafel, de laatste wordt het eerst gedeeld. -->
              {#if staat.stand.length > 3}
                <div class="restplekken">
                  {#each staat.stand.slice(3) as r, j (r.spelerId)}
                    <div class="restkaart" style="--wacht:{ceremonieNu.rest(staat.stand.length - 4 - j)}ms">
                      <span class="restplek">{j + 4}</span>
                      <Portret naam={r.naam} foto={r.foto} dier={r.dier} />
                      <span class="restnaam">{r.naam}</span>
                      <span class="restpunten">{r.punten.toLocaleString('nl-NL')}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Tweede bedrijf: de prijzen, elk met een eigen moment. -->
            <div class="akte prijzenakte">
              <p class="etiket">De prijzen van de avond</p>
              <div class="toptrio" aria-label="De top drie">
                {#each top3 as r, i (r.spelerId)}
                  <span class="trio" data-plek={i + 1}><b>{['A', 'K', 'Q'][i]}<i>{['♠', '♥', '♦'][i]}</i></b>{r.naam}</span>
                {/each}
              </div>
              {#if staat.prijzen.length || poedel}
                <div class="prijzen">
                  {#if poedel && poedel.punten < staat.stand[0].punten}
                    <div class="prijs" style="border-style:dashed;--p:0">
                      <span class="prijsicoon" aria-hidden="true">🏮</span>
                      <span class="prijstitel">Poedelprijs</span>
                      <span class="prijsnaam">{poedel.naam}</span>
                      <span class="prijsdetail">{kies(POEDEL, `poedel:${poedel.spelerId}`)}</span>
                    </div>
                  {/if}
                  {#each staat.prijzen as p, i (p.sleutel)}
                    <div class="prijs" style="--p:{i + (poedel && poedel.punten < staat.stand[0].punten ? 1 : 0)}">
                      <span class="prijsicoon" aria-hidden="true">{prijsIcoon(p.sleutel)}</span>
                      <span class="prijstitel">{p.titel}</span>
                      {#if p.namen.length}<span class="prijsnaam">{p.namen.join(' & ')}</span>{/if}
                      <span class="prijsdetail" class:lang={!p.namen.length}>{p.detail}</span>
                    </div>
                  {/each}
                </div>
              {/if}

              <p class="fijn">
                De hele avond staat op {joinAdres.replace(/^https?:\/\//, '').replace(/\/$/, '')}/uitslag/{staat.spelId}
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/key}
</div>
