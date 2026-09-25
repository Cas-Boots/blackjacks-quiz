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
  import Podium, { WINNAAR_NA_MS } from '$lib/client/Podium.svelte';
  import Media from '$lib/client/Media.svelte';
  import Cijfers from '$lib/client/Cijfers.svelte';
  import Jaaroverzicht from '$lib/client/Jaaroverzicht.svelte';
  import Overgang, { type OvergangMoment } from '$lib/client/Overgang.svelte';
  import { REEKS_VANAF } from '$lib/shared/bonus';
  import Portret from '$lib/client/Portret.svelte';
  import Dierenparade, { type Loper } from '$lib/client/Dierenparade.svelte';
  import { dierVan, dierenroep } from '$lib/shared/dieren';
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

  let staat = $derived(live.staat);
  let vraag = $derived(staat?.vraag ?? null);
  let ronde = $derived(staat?.ronde ?? null);
  let rood = $derived(ronde?.suit === '♥' || ronde?.suit === '♦');
  /* Bij een individuele ronde is elke speler zijn eigen "team". Die als
     teamkaarten tonen zet iedere naam twee keer op het scherm; dan is een
     rij naamplaten eerlijker én rustiger. */
  let inTeams = $derived((ronde?.teamModus ?? 'individueel') === 'teams');
  /* Buiten een ronde om — aanmelden en uitslag — staat de tafel in zijn
     eigen kleuren, zodat begin en eind herkenbaar bij elkaar horen. */
  let sfeer = $derived(
    staat?.fase === 'jaaroverzicht' ? 'bioscoop'
      : staat && staat.fase !== 'lobby' && staat.fase !== 'einde' ? (ronde?.sfeer ?? 'vilt')
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
  let optocht = $state<{ id: number; lopers: Loper[]; stemming: 'blij' | 'sip' } | null>(null);
  let optochtTeller = 0;
  function laatLopen(lopers: Loper[], stemming: 'blij' | 'sip' = 'blij', wacht = 0) {
    if (!lopers.length) return;
    setTimeout(() => (optocht = { id: ++optochtTeller, lopers, stemming }), wacht);
  }
  function lopersVan(ids: number[]): Loper[] {
    return ids
      .map((id) => staat?.spelers.find((s) => s.id === id))
      .filter((s) => !!s)
      .map((s) => ({ id: s.id, naam: s.naam, dier: s.dier }));
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
      const d = dierVan(nieuw.dier, nieuw.naam);
      begroeting = begroetingTeller % 2
        ? `${d.emoji} ${nieuw.naam}, ${d.titel}, ${d.entree}.`
        : metNaam(kies(BEGROETINGEN, `${nieuw.naam}:${begroetingTeller}`), nieuw.naam);
      laatLopen([{ id: nieuw.id, naam: nieuw.naam, dier: nieuw.dier }]);
      geluid.boing();
    }
    // De eerste momentopname telt niet als binnenkomen: die mensen zaten er al.
    eerderVerbonden = nu;
  });

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
    if (!sp) return null;
    return { dier: dierVan(sp.dier, sp.naam), zin: dierenroep(sp.dier, sp.naam, 'goed', vraagSleutelNu) };
  });
  let winDier = $derived(winnaars.length === 1 ? dierVan(winnaars[0].dier, winnaars[0].naam) : null);

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

  /** De punten die een inzender (speler of team) bij deze vraag kreeg, per persoon. */
  function puntenVoor(inzender: string): number {
    const team = staat?.teams.find((t) => t.id === inzender);
    if (!team) return 0;
    return Math.max(0, ...team.leden.map((id) => staat?.uitdeling[id] ?? 0));
  }

  function naamVanSpeler(id: number): string {
    return staat?.spelers.find((s) => s.id === id)?.naam ?? '?';
  }
  /** Wie de snelheidsbonus pakte: in een teamronde het team, anders de speler. */
  let snelsten = $derived.by(() => {
    const ids = (staat?.bonussen ?? []).filter((b) => b.soort === 'snel').map((b) => b.spelerId);
    if (!ids.length) return '';
    if (!inTeams) return ids.map(naamVanSpeler).join(' & ');
    const teams = (staat?.teams ?? []).filter((t) => t.leden.some((id) => ids.includes(id)));
    return teams.map((t) => naamVan(t.id)).join(' & ');
  });
  let reeksBonussen = $derived((staat?.bonussen ?? []).filter((b) => b.soort === 'reeks'));

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
  let vorigAantalBonussen = 0;
  $effect(() => {
    const n = onthulKlaar ? (live.staat?.bonussen.length ?? 0) : 0;
    if (n > vorigAantalBonussen) setTimeout(() => geluid.bonus(), 1200);
    vorigAantalBonussen = n;
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
        // De fanfare pas als de eerste trede van het podium staat.
        if (st.fase === 'einde') setTimeout(() => geluid.fanfare(), WINNAAR_NA_MS);
        // Het maatje van de stijger maakt een rondje; bij de uitslag dat van de winnaar.
        if (st.fase === 'stand' && stijgerId !== null) laatLopen(lopersVan([stijgerId]), 'blij', 2200 + naOvergang);
        if (st.fase === 'einde') laatLopen(lopersVan(winnaars.map((w) => w.spelerId)), 'blij', WINNAAR_NA_MS + 900);
      }
      vorigeFase = st.fase;
    }

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
  onMount(() => {
    const t = setInterval(() => {
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
  </div>

  {#if optocht}
    {#key optocht.id}
      <Dierenparade lopers={optocht.lopers} stemming={optocht.stemming} klaar={() => (optocht = null)} />
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
      {#if staat?.fase === 'einde'}
        <Confetti />
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

              <div class="knoprij" style="margin-top:.5rem">
                {#each staat.spelers as s, i (s.id)}
                  <span class="naamplaat" class:aan={s.verbonden} in:fly={{ y: 18, duration: 420, delay: 120 + i * 90, easing: cubicOut }}>
                    <span class="stip" class:aan={s.verbonden}></span>
                    <Portret naam={s.naam} foto={s.foto} dier={s.dier} />
                    <strong>{s.naam}</strong>
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
                {#if ronde?.teamModus !== 'samen' && ronde?.type !== 'stem' && ronde?.type !== 'dichtstbij'}⚡ Snelste goede antwoord: +1 ·{/if}
                🔥 Vanaf {REEKS_VANAF} vragen op rij goed: +1 per vraag
              </p>
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
            <div class="tafelkaart" data-suit={ronde?.suit} style="--vraagmaat:{vraagmaat};--kanteling:{kantelingNu}deg">
              {#if tijdOm}
                <span class="stempel rechtsboven" style="--hoek:-11deg">Tijd!</span>
              {/if}
              <p class="etiket">Vraag {vraag.index + 1} · {vraag.punten} {vraag.punten === 1 ? 'punt' : 'punten'}</p>
              {#if vraag.emoji}<div class="emoji">{vraag.emoji}</div>{/if}
              {#if vraag.lyric}<p class="lyric">“{vraag.lyric}”</p>{/if}
              <p class="vraagtekst">{vraag.tekst}</p>
              {#if vraag.media}
                <Media media={vraag.media} speelt={staat.mediaSpeelt} />
              {/if}
              {#if vraag.opties}
                <div class="keuzes">
                  {#each vraag.opties as optie, i}
                    <div class="keuze" in:fly={{ y: 14, duration: 380, delay: 220 + i * 80, easing: cubicOut }}>
                      <span class="letter">{String.fromCharCode(65 + i)}</span><span>{optie}</span>
                    </div>
                  {/each}
                </div>
              {/if}
              {#if vraag.eenheid}
                <p class="fijn" style="color:rgba(19,31,26,.55)">Antwoord in {vraag.eenheid}.</p>
              {/if}
            </div>

            <!-- Wie is er al binnen. Geen antwoorden, alleen namen. -->
            <div class="inleverrij" in:fade={{ duration: 400, delay: 400 }}>
              {#each staat.teams as t (t.id)}
                <span class="vak" class:binnen={staat.ingeleverd.includes(t.id)}>
                  {t.naam}
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
            <div class="tafelkaart" data-suit={ronde?.suit} style="padding-block:clamp(16px,2vw,32px);--vraagmaat:{vraagmaat};--kanteling:{kantelingNu}deg">
              {#if vraag.emoji}<div class="emoji klein">{vraag.emoji}</div>{/if}
              {#if vraag.lyric}<p class="lyric klein">“{vraag.lyric}”</p>{/if}
              <p class="vraagtekst klein">{vraag.tekst}</p>
              {#if vraag.media}
                <Media media={vraag.media} speelt={staat.mediaSpeelt} klein />
              {/if}
              {#if vraag.opties}
                <div class="keuzes">
                  {#each vraag.opties as optie, i}
                    <div
                      class="keuze"
                      class:goed={onthulKlaar && i === staat.onthulling?.goedeOptie}
                      class:fout={onthulKlaar && staat.onthulling?.goedeOptie !== undefined && i !== staat.onthulling?.goedeOptie}
                      class:omklappen={i === staat.onthulling?.goedeOptie}
                      class:afvallen={i !== staat.onthulling?.goedeOptie}
                      style="--n:{beurt(i)}"
                    >
                      <span class="letter">{String.fromCharCode(65 + i)}</span><span>{optie}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

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
                <span aria-hidden="true">{roeper.dier.emoji}</span>{roeper.zin}
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
                      {#if i.isGoed === true && puntenVoor(i.inzender) > 0}
                        <span class="fiche" style="--wacht:{0.7 + n * 0.09}s"><span>+{puntenVoor(i.inzender)}</span></span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
            {#if snelsten || reeksBonussen.length}
              <div class="bonusrij">
                {#if snelsten}
                  <span class="bonus" style="--wacht:1.1s">⚡ Snelste vinger <strong>{snelsten}</strong> <span class="fiche"><span>+1</span></span></span>
                {/if}
                {#each reeksBonussen as b, n (b.spelerId)}
                  <span class="bonus" style="--wacht:{1.3 + n * 0.18}s">
                    🔥 <strong>{naamVanSpeler(b.spelerId)}</strong> {b.opRij} op rij
                    <span class="fiche"><span>+{b.punten}</span></span>
                  </span>
                {/each}
              </div>
            {/if}
            {/if}
          </div>

          <!-- ══ De cijfers van het jaar ════════════════════════════════ -->
        {:else if staat.fase === 'cijfers' && staat.cijfers}
          <Cijfers cijfers={staat.cijfers} spelers={staat.spelers} />

          <!-- ══ Tussenstand ════════════════════════════════════════════ -->
        {:else if staat.fase === 'stand'}
          <div style="display:flex;flex-direction:column;gap:clamp(.8rem,2vh,1.6rem)">
            <p class="etiket" in:fly={{ x: -18, duration: 420, easing: cubicOut }}>{ronde?.naam} zit erop</p>
            <h1 class="groot" in:fly={{ y: 22, duration: 520, delay: 60, easing: cubicOut }}>Tussenstand</h1>
            <hr class="rule" style="animation-delay:.25s" />
            {#if toonNieuweVolgorde && laatsteId !== null && standNu[standNu.length - 1].punten < standNu[0].punten}
              <p class="kwinkslag" style="animation-delay:1.1s">{staat.stand[staat.stand.length - 1].naam}: {lantaarnZin.charAt(0).toLowerCase() + lantaarnZin.slice(1)}</p>
            {/if}
            <div class="stand">
              {#each standNu as r, i (r.spelerId)}
                <div class="standrij" class:leider={toonNieuweVolgorde && i === 0} class:laatste={toonNieuweVolgorde && r.spelerId === laatsteId && r.punten < standNu[0].punten} style="--i:{i}" animate:flip={{ duration: 720, easing: cubicOut }}>
                  <span class="plek">{i + 1}</span>
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
                </div>
              {/each}
            </div>
          </div>

          <!-- ══ De uitslag ═════════════════════════════════════════════ -->
        {:else if staat.fase === 'einde'}
          <div style="display:flex;flex-direction:column;gap:clamp(1rem,2.5vh,2rem);align-items:center;text-align:center">
            <p class="etiket" in:fly={{ y: -14, duration: 460, easing: cubicOut }}>{staat.quizNaam}</p>
            <!-- De naam van de winnaar valt pas als de eerste trede staat. -->
            <h1 class="mega" in:scale={{ start: 0.86, duration: 760, delay: WINNAAR_NA_MS, easing: cubicOut }}>
              {winZin}
            </h1>
            <p class="lood" style="text-align:center" in:fade={{ duration: 500, delay: WINNAAR_NA_MS + 500 }}>
              Met {staat.stand[0]?.punten ?? 0} {staat.stand[0]?.punten === 1 ? 'punt' : 'punten'}.
              {#if winDier}<br /><span class="dierenroep"><span aria-hidden="true">{winDier.emoji}</span> Hulde aan {winDier.titel}!</span>{/if}
            </p>

            <Podium {top3} vorigePunten={live.vorigePunten} />

            {#if staat.prijzen.length || poedel}
              <div class="prijzen">
                {#if poedel && poedel.punten < staat.stand[0].punten}
                  <div class="prijs" style="border-style:dashed" in:fly={{ y: 20, duration: 520, delay: WINNAAR_NA_MS + 1200 + staat.prijzen.length * 260, easing: cubicOut }}>
                    <span class="prijsicoon" aria-hidden="true">🏮</span>
                    <span class="prijstitel">Poedelprijs</span>
                    <span class="prijsnaam">{poedel.naam}</span>
                    <span class="prijsdetail">{kies(POEDEL, `poedel:${poedel.spelerId}`)}</span>
                  </div>
                {/if}
                {#each staat.prijzen as p, i (p.sleutel)}
                  <div class="prijs" in:fly={{ y: 20, duration: 520, delay: WINNAAR_NA_MS + 1200 + i * 260, easing: cubicOut }}>
                    <span class="prijsicoon" aria-hidden="true">{prijsIcoon(p.sleutel)}</span>
                    <span class="prijstitel">{p.titel}</span>
                    {#if p.namen.length}<span class="prijsnaam">{p.namen.join(' & ')}</span>{/if}
                    <span class="prijsdetail" class:lang={!p.namen.length}>{p.detail}</span>
                  </div>
                {/each}
              </div>
            {/if}

            {#if staat.stand.length > 3}
              <div class="stand" style="max-width:560px;margin-top:1rem">
                {#each staat.stand.slice(3) as r, i (r.spelerId)}
                  <div class="standrij" style="--i:{i + 4}">
                    <span class="plek">{i + 4}</span>
                    <span></span>
                    <span class="naam" style="font-size:calc(var(--fs-naam)*.7)">{r.naam}</span>
                    <span class="standpunten" style="font-size:calc(var(--fs-naam)*.6)">{r.punten}</span>
                  </div>
                {/each}
              </div>
            {/if}
            <p class="fijn" in:fade={{ duration: 500, delay: WINNAAR_NA_MS + 2600 }}>
              De hele avond staat op {joinAdres.replace(/^https?:\/\//, '').replace(/\/$/, '')}/uitslag/{staat.spelId}
            </p>
          </div>
        {/if}
      </div>
    </div>
  {/key}
</div>
