# Blackjack Quiz 26/27

De meespeelversie: iedereen op zijn eigen telefoon, een televisiescherm voor de
vragen en een hostscherm voor de quizmaster.

De losse HTML-quiz in de map erboven blijft bestaan en is de achtervang: die
werkt volledig zonder netwerk. Beide draaien dezelfde vragen — `npm run
content:sync` haalt ze uit `../index.html`.

## Snel starten

```bash
npm install --legacy-peer-deps   # zie 'Bekende hobbels' onderaan
npm run db:seed                  # spelers en een leeg spel klaarzetten
npm run dev                      # http://localhost:5173
```

Of in Docker, zoals blackjacks-cup draait:

```bash
HOST_PIN=1234 docker compose up --build
```

## De drie schermen

| Scherm | Adres | Voor wie |
|---|---|---|
| Televisie | `/tv` | het grote scherm; QR-code, vraag, klok, onthulling, tussenstand, podium |
| Hostscherm | `/host` | de quizmaster; bediening, antwoorden, punten, rondes kiezen |
| Telefoon | `/` → kies je naam | de spelers; antwoordblad, jouw uitslag, selfie |

De quizmaster meldt zich met de pincode uit `HOST_PIN`. Spelers hebben geen
pincode: op de avond zelf is een vergeten code een echt risico, en het
hostscherm laat zien wie er op welke naam zit.

### Meedoen via de televisie

In de lobby toont de televisie een QR-code met het adres waarop hij zelf de
quiz opende. Iedereen scant, kiest zijn naam en heeft zijn antwoordblad in
handen. Open het televisiescherm daarom via het netwerkadres van de laptop
(bijvoorbeeld `http://192.168.1.10:3000/tv`), niet via `localhost` — het
scherm waarschuwt als je dat toch doet. Onder de namen staat hoeveel telefoons
er al bij zijn.

Op de telefoon kun je in de lobby een selfie kiezen. Die wordt op de telefoon
zelf bijgesneden en verkleind (256 bij 256) en staat daarna bij je naam op de
televisie, in de stand en op het podium. Tik later op je portret in de kop om
hem te vervangen.

### Zo verloopt een vraag

1. **De vraag** staat op de televisie en op elke telefoon. Waar/niet waar en
   meerkeuze zijn knoppen, open vragen en dichtstbij een invoerveld. De
   televisie laat zien wie er al heeft ingeleverd, zonder de inhoud.
2. **De onthulling.** De televisie toont het antwoord én wat iedereen had
   ingetikt, als kaartjes. Bij dichtstbij wordt dat een getallenlijn met het
   doel erop. Elke telefoon zegt of je het goed had en hoeveel punten dat
   opleverde — met een trilling — en laat zien wat de rest had.
3. **De quizmaster tikt aan** wie het goed had, of drukt op *Vink aan wat goed
   lijkt* (sneltoets `A`) om in één keer alles te nemen wat de machine met
   zekerheid goed vond. De vinkjes en de stand bewegen overal meteen mee.

Na elke ronde de tussenstand, met op je telefoon je eigen regel gemarkeerd en
"Je staat 2e van 5." Aan het eind het podium, met daaronder drie prijzen:
**scherpschutter** (meeste vragen goed), **snelste vinger** (het snelste goede
antwoord) en **beste ronde**. Een prijs die meer dan twee mensen zouden delen
valt weg. Bij een gelijkspel bovenaan winnen ze allebei.

### De gekke momenten

De tafel blijft chic, maar af en toe mag het gek. Alles hieronder is kort en
komt alleen op een moment dat het mag:

- **Stempels.** *TIJD!* slaat op de kaart als de klok op nul staat, *Iedereen
  fout* (met treurige trombone) of *Iedereen goed* op het antwoordpaneel, en
  *Goed!* of *Mis* op je telefoon.
- **Kwinkslagen.** Een welkom als iemand binnenkomt ("Rik heeft de wifi
  gevonden."), wachtzinnen in de lobby, een regel bij elke ronde, en op je
  telefoon een aanmoediging of troost. Ze worden gekozen op de vraag, niet op
  toeval, dus televisie en telefoons zeggen hetzelfde. Aanpassen kan in
  `src/lib/shared/kwinkslagen.ts`.
- **Reacties.** Bij de onthulling en de stand staan er zes emoji's op je
  telefoon; ze zweven met je naam over de televisie omhoog. Vluchtig, niets
  wordt bewaard, hooguit één per 400 ms per telefoon.
- **Kroontje, lantaarn, stijger.** De koploper draagt een kroontje, de laatste
  een rode lantaarn, en wie het meest klom krijgt *Stijger* achter zijn naam.
  Bij dichtstbij krijgt een gok die er hopeloos naast zat een label.
- **Poedelprijs** voor de laatste op het podium.
- De vraagkaart ligt nooit precies recht en trilt in de laatste vijf seconden.

### Het hostscherm

Bovenaan staat de vraag die open staat, met een **spiekbriefje** dat je zelf
openklapt voor het antwoord. Daaronder de knoppen van dat moment, met
sneltoetsen zoals in de losse quiz:

| Toets | Doet |
|---|---|
| `spatie`, `Enter`, `→` | verder: ronde starten, antwoord tonen, volgende vraag |
| `←` | een stap terug |
| `P` | klok pauzeren of hervatten |
| `T` | 30 seconden erbij |
| `M` | fragment afspelen of stoppen |
| `A` | vink aan wat goed lijkt |

Onderaan het overzicht **Rondes**: alle rondes van het pakket met de vragen
en antwoorden erin, en rode labels bij wat nog ingevuld moet worden. Vóór de
eerste vraag vink je hier aan welke rondes en vragen vanavond meedoen; daarna
ligt de samenstelling vast (anders zouden de rondenummers en daarmee de stand
verschuiven) en spring je er naar een andere ronde. *Nieuw spel* begint
opnieuw met een pakket; de oude stand blijft in de database bewaard.

### Foto's, video's en muziek bij vragen

Zet de bestanden in de map `media/` naast de app; een vraag verwijst ernaar
met `media.bron`. Zie `media/README.md` voor de ondersteunde bestandstypen.
De bestanden worden op het moment zelf gelezen, dus herstarten is niet nodig,
en in Docker koppelt `docker-compose.yml` de map aan de container.

Foto's verschijnen op de televisie én op de telefoons. Filmpjes en muziek
spelen alleen op de televisie; de quizmaster start en stopt ze vanaf het
hostscherm, zodat niemand naar de laptop hoeft te lopen. Elke stap naar een
andere dia zet het fragment stil. Ontbreekt een bestand, dan toont de
televisie een nette melding en loopt de quiz gewoon door.

## Hoe het samenwerkt met teams

Bij een individuele ronde levert iedereen los in. Bij een teamronde hoort elke
speler bij een team en telt de laatste inzending van dat team — in de praktijk
leg je één telefoon op tafel en tikt één iemand het in. Punten gaan altijd naar
de persoon, dus het klassement blijft eerlijk als de teams wisselen.

## Testen zonder vijf mensen

Dit is het belangrijkste stuk gereedschap: je kunt de hele avond vooraf
naspelen.

### Nepspelers tegen een draaiende server

```bash
npm run build && DATABASE_PATH=./local.db node build/index.js &
npx tsx scripts/simulate.ts --auto-host --snelheid 20 --goed 0.7 --stil 4
```

Vijf nepspelers melden zich aan, wachten op vragen en leveren antwoorden in.
Open er `/tv` naast en je ziet de avond zich afspelen.

| Optie | Doet |
|---|---|
| `--auto-host` | speelt ook de quizmaster en loopt de quiz vanzelf door |
| `--snelheid 20` | twintigmaal zo snel als een echte avond |
| `--goed 0.7` | kans dat een speler het juiste antwoord geeft |
| `--stil 4` | speler 4 levert niets in, om uitval te oefenen |
| `--rondes 3` | stop na drie rondes |
| `--url` | ander serveradres |

Laat je `--auto-host` weg, dan spelen de nepspelers mee terwijl jíj het
hostscherm bedient. Zo oefen je de bediening met een volle tafel.

### Echte browsers

```bash
npm run build
CHROMIUM_PAD=/pad/naar/chrome npx playwright test
```

Opent een televisie, een hostscherm en drie telefoons als losse browsers met
eigen koekjespotten, en controleert dat de QR-code er staat, dat een vraag op
alle schermen tegelijk verschijnt, dat inleveren werkt, dat de onthulling op
televisie en telefoon klopt en dat de stand meebeweegt. `CHROMIUM_PAD` mag
weg als Playwright zijn eigen browsers heeft; staat er al een Chromium op de
machine (bijvoorbeeld `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`),
dan wijs je daarheen in plaats van te downloaden.

### Eenheidstests

```bash
npm test
```

Dekt de beoordeling van antwoorden, de puntentelling en de teamindeling — de
drie plekken waar een fout de avond zou verpesten.

## Waarom het blijft werken als de wifi hapert

- **De server is de enige bron van waarheid.** Telefoons rekenen niets uit; ze
  tonen wat de server stuurt en sturen wat er is ingetikt.
- **Twee wegen naar de stand.** De live stroom (server-sent events) is de
  snelle weg. Valt hij weg, dan schakelt de telefoon over op elke twee seconden
  navragen en loopt de quiz door. Het hostscherm laat zien welke weg actief is.
- **De klok loopt op servertijd.** Elk pakketje draagt de servertijd mee, dus
  een telefoon met een scheve klok telt toch goed af.
- **Oudere pakketjes worden genegeerd.** Een laat binnengekomen bericht kan de
  stand niet terugdraaien.
- **Inleveren mag tot de onthulling**, ook als de klok al op nul staat. Te laat
  ingeleverde antwoorden zijn zichtbaar op het hostscherm in plaats van
  geruisloos te verdwijnen — dat scheelt discussie aan tafel.
- **Eén plek waar punten veranderen.** Elke vraag heeft precies één verdeling
  die bij een correctie in zijn geheel wordt vervangen, dus de stand kan niet
  scheef lopen.
- **De quizmaster kan altijd door.** Alle bediening werkt onafhankelijk van of
  de telefoons meedoen. Doet er één niet mee, dan noteer je dat antwoord met de
  plus- en minknoppen bij de stand.

En als alles tegenzit: `../index.html` openen en de avond op papier draaien.

## Wat er nog niet in zit

- De rondes *De Voorspellingen*, *De WK-poule* en *Oktober tot december* wachten
  nog op hun antwoorden; het hostscherm telt hoeveel gekozen vragen er nog een
  antwoord missen. Vul ze in `../index.html` en draai `npm run content:sync`.
- Vragen aanpassen kan alleen in `../index.html`; er is geen editor in de app.

## Bekende hobbels

`npm install` zonder meer faalt op deze npm-versie met
`Cannot read properties of null (reading 'edgesOut')` — een bug in de
afhankelijkhedenoplosser rond vitest. Met `--legacy-peer-deps` gaat het goed, en
daarna werkt `npm ci` gewoon. De Dockerfile doet dit al.
