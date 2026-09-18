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
| Uitslag | `/uitslag` | iedereen; alle avonden, met per avond de eindstand, prijzen en wat er per vraag gebeurde |

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

Staat iemand niet in de lijst? Onder de namen tikt een gast zijn naam in en
schuift aan, ook midden in een ronde: hij krijgt meteen een plek in de
teamindeling. De quizmaster kan hetzelfde doen met *+ Gast* op het
hostscherm. Een gast doet niet vanzelf mee aan het volgende spel.

Telefoon en televisie houden het scherm wakker zolang de quiz open staat, dus
een vraag verdwijnt niet achter een slotscherm en de laptop schiet niet in de
schermbeveiliging.

Op de telefoon kun je in de lobby een selfie kiezen. Die wordt op de telefoon
zelf bijgesneden en verkleind (256 bij 256) en staat daarna bij je naam op de
televisie, in de stand en op het podium. Tik later op je portret in de kop om
hem te vervangen.

### Zo verloopt een vraag

1. **De vraag** staat op de televisie en op elke telefoon. Waar/niet waar en
   meerkeuze zijn knoppen, open vragen en dichtstbij een invoerveld, en bij een
   stemvraag zijn de mensen aan tafel de knoppen. De televisie laat zien wie er
   al heeft ingeleverd, zonder de inhoud. Blijft iemand achter, dan **port** de
   quizmaster hem: een trilling en een gele balk op die telefoon.
2. **De onthulling.** De televisie toont het antwoord én wat iedereen had
   ingetikt, als kaartjes. Bij dichtstbij wordt dat een getallenlijn met het
   doel erop, bij een stemvraag een telling met balkjes en wie op wie stemde.
   Dichtstbij en stem rekent de server op dit moment meteen uit. Elke telefoon
   zegt of je het goed had en hoeveel punten dat opleverde — met een trilling —
   en laat zien wat de rest had.
3. **De quizmaster tikt aan** wie het goed had, of drukt op *Vink aan wat goed
   lijkt* (sneltoets `A`) om in één keer alles te nemen wat de machine met
   zekerheid goed vond. De vinkjes en de stand bewegen overal meteen mee.

Na elke ronde de tussenstand, met op je telefoon je eigen regel gemarkeerd en
"Je staat 2e van 5." Aan het eind een echt podium: drie treden in goud,
zilver en brons die één voor één uit de vloer rijzen, van drie naar één, met
de fanfare als de winnaar bovenaan staat. Daaronder de prijzen:
**scherpschutter** (meeste vragen goed), **snelste vinger** (het snelste goede
antwoord), **beste ronde**, **langste reeks** (drie of meer op rij goed),
**comeback van de avond** (wie na een ronde het diepst stond en het meest is
geklommen) en de **moeilijkste vraag** (de vraag die de minste mensen goed
hadden). Een prijs die meer dan twee mensen zouden delen valt weg. Bij een
gelijkspel bovenaan winnen ze allebei.

Onder het podium staat het adres van de uitslagpagina, en op elke telefoon een
knop *Bekijk en deel de uitslag*. Die pagina blijft bestaan: `/uitslag` toont
alle avonden, `/uitslag/7` één avond met de eindstand, de prijzen, de punten
per ronde en per vraag wie het goed had. *Deel de uitslag* zet een samenvatting
in de groepsapp of op het klembord.

### De stemronde

De slotronde *Wie van de Blackjacks?* is een stemvraag (`type: "stem"`):
iedereen kiest op zijn telefoon een medespeler. De meerderheid beslist; wie
met de meerderheid meestemde krijgt de punten. Bij een gelijke stand bovenaan
tellen beide kampen. De quizmaster kan het resultaat altijd nog met de hand
aanpassen.

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
| `Z` | de laatste handeling ongedaan maken |

Bij een open vraag staat er een knop **Por de achterblijvers**; tik op een naam
in de inleverrij om één telefoon te porren.

Het **logboek** houdt elke handeling bij: ronde gestart, antwoord getoond,
punten voor wie, correcties. Elke handeling die de stand of de plek in de quiz
verandert draagt een momentopname van ervoor, dus *Ongedaan* (of `Z`) zet hem
in zijn geheel terug — ook na een verkeerd vinkje of een per ongeluk overgeslagen
vraag. Meerdere keren achter elkaar mag.

*← Terug* werkt overal: vanaf de titelkaart van een ronde ga je naar de
tussenstand van de vorige ronde, vanaf de uitslag naar de laatste tussenstand.

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

Opent een televisie, een hostscherm en telefoons als losse browsers met eigen
koekjespotten, en speelt de avond na: de QR-code, een vraag op alle schermen
tegelijk, inleveren, de onthulling en de stand (`live.spec.ts`); dichtstbij
met de automatische berekening, een teamronde, een beeldvraag, de stemronde
met een gast, een por, ongedaan maken, het podium met de prijzen, de
uitslagpagina en een telefoon zonder live stroom (`avond.spec.ts`).
`CHROMIUM_PAD` mag
weg als Playwright zijn eigen browsers heeft; staat er al een Chromium op de
machine (bijvoorbeeld `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`),
dan wijs je daarheen in plaats van te downloaden.

### Eenheidstests

```bash
npm test
```

Dekt de beoordeling van antwoorden, de puntentelling (ook de stemronde), de
prijzen en de teamindeling — de plekken waar een fout de avond zou verpesten.

### In CI

`.github/workflows/ci.yml` draait bij elke push en pull request de typecontrole,
de eenheidstests, de controle dat `index.html` gelijk loopt met de vragen, de
build en daarna de browsertests.

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

## De vragen aanpassen

De vragen staan op één plek: `src/lib/content/packs.ts`. Dat bestand is
getypt, dus een vergeten antwoord of een verkeerd vraagtype valt bij `npm run
check` al om. Daarna:

```bash
npm run content:sync    # schrijft hetzelfde blok naar ../index.html
npm run content:check   # alleen controleren; dit draait ook in CI
```

De losse quiz kan geen module importeren (hij moet vanaf een usb-stick werken),
vandaar deze ene stap. Zie de hoofd-README voor de vorm van een ronde en een
vraag.
## Naar productie

Op de avond zelf is een laptop met `npm run dev` genoeg. Wil je de quiz op een
echte server hebben — zodat de telefoons erbij kunnen zonder dat iedereen op
hetzelfde wifi zit, en zodat je van tevoren rustig kunt proefdraaien — dan
draait hij als container. De uitrol is ingericht voor Dokploy, net als
blackjacks-cup.

### Wat de server nodig heeft

| Instelling | Verplicht | Wat het doet |
|---|---|---|
| `HOST_PIN` | ja | De code waarmee de quizmaster het hostscherm opent. |
| `ORIGIN` | aangeraden | Het volledige adres waarop de quiz staat, bijvoorbeeld `https://quiz.deblackjacks.nl`. |
| `DATABASE_PATH` | staat al goed | `/data/quiz.db`, op een volume dat een herstart overleeft. |
| `MEDIA_DIR` | staat al goed | `/app/media`, de map met foto's, filmpjes en muziek. |
| `PORT` | staat al goed | `3000`. |
| `ADDRESS_HEADER`, `XFF_DEPTH` | staat al goed | `x-forwarded-for` en `1`: achter Traefik ziet de rem op de pincode zo het adres van de telefoon. |
| `BODY_SIZE_LIMIT` | staat al goed | `512K`, het grootste verzoek dat de server aanneemt; een portret is hooguit 200 kB. |

`HOST_PIN` heeft met opzet geen standaardwaarde. Draait de app in productie
zonder eigen code — of nog met de voorbeeldcode `2627` uit `.env.example` — dan geeft
`/api/health` een 503 en wordt de container nooit gezond. Dokploy laat de
uitrol dan rood staan in plaats van een hostscherm online te zetten dat voor
iedereen openstaat die het adres kent. Dezelfde reden als bij de migraties: een
container die weigert te komen zie je meteen, een half werkende app niet.

### Eerst een server

Dokploy draait op je eigen server; er is geen gehoste versie. Je hebt nodig:

- een VPS met **Ubuntu 22.04+ of Debian 12+**, minimaal **2 GB geheugen** en
  **30 GB schijf**;
- **poort 80 en 443 open** in de firewall — die heeft Traefik nodig om een
  Let's Encrypt-certificaat op te halen;
- een schone machine. Draait er al iets op 80 of 443, dan botst dat.

Installeren gaat met één regel als root, over te nemen van
[de installatiepagina van Dokploy](https://docs.dokploy.com/docs/core/installation).
Haal hem daar op en niet uit dit bestand: het is een script dat je als root
draait, en dan wil je de bron zien. Docker wordt onderweg meegeïnstalleerd.

Daarna bereik je het paneel op `http://<ip-van-de-server>:3000` en maak je het
beheerdersaccount aan. Doe dat meteen — tot die tijd kan iedereen die het
adres kent het aanmaken.

### In Dokploy

De `docker-compose.yml` in de hoofdmap van de repository is hiervoor gemaakt.
Hij bouwt de map `app/`, publiceert geen poort naar buiten en hangt aan het
netwerk van Dokploy's Traefik.

1. **Wijs het subdomein naar de server.** Zet bij je registrar een `A`-record
   voor `quiz` onder `deblackjacks.nl`, wijzend naar het IP-adres van de
   server. Het hoofddomein blijft zo vrij voor de andere projecten.
   Controleer dat het staat voordat je verder gaat: het commando
   `getent hosts quiz.deblackjacks.nl` moet het IP van de server teruggeven.
   Zolang dat niet klopt kan Let's Encrypt geen certificaat afgeven en blijft
   het domein in Dokploy op een foutmelding staan.
2. Maak een project aan en daarin een service van het type **Compose**, met
   Compose Type **Docker Compose**. Vul in:

   | Veld | Waarde |
   |---|---|
   | Provider | GitHub (koppel eenmalig je account) |
   | Repository | `Cas-Boots/blackjacks-quiz` |
   | Branch | `main` |
   | Compose Path | `./docker-compose.yml` |

3. Zet onder **Environment** je eigen `HOST_PIN` en de `ORIGIN` die bij het
   domein hoort. Schrijf ze niet in het bestand: dat staat in git.
4. Voeg onder **Domains** een domein toe. Service Name is `quiz` — dat is de
   naam uit de compose — en Container Port is `3000`. Zet HTTPS met Let's
   Encrypt aan. Dokploy zet de Traefik-labels er zelf bij; je hoeft niets aan
   het bestand te veranderen.
5. Uitrollen. De container komt pas groen als `/api/health` `status: ok`
   teruggeeft — dus als de database tabellen heeft én de pincode klopt.

Wil je dat een `git push` naar `main` vanzelf uitrolt, zet dan **Autodeploy**
aan. Handig tijdens het vullen van de vragen, maar zet hem uit op de dag zelf:
een uitrol herstart de container en dat wil je niet halverwege een ronde.

Een vers geregistreerd domein is niet meteen overal zichtbaar. Naast de tijd
die het register nodig heeft, onthouden resolvers ook dat een naam *niet*
bestond: dat heet negatieve caching en duurt bij `.nl` doorgaans tot een uur.
Heb je het domein vlak na registratie al eens opgevraagd, dan kan het dus
even duren voordat jouw resolver van gedachten verandert. Geduld, niet
opnieuw registreren.

Draai je op een gewone server met Docker en zonder Dokploy, gebruik dan
`app/docker-compose.yml`. Die publiceert poort 3000 rechtstreeks; zet er zelf
een proxy met een certificaat voor.

### De bestanden bij de vragen

De map `media/` zit in productie op een eigen volume, want foto's en filmpjes
horen niet in git. Zet ze erin met:

```bash
docker cp ./media/. <container>:/app/media/
```

De app leest de map op het moment zelf, dus herstarten hoeft niet.

### Voordat de avond begint

```bash
curl https://quiz.deblackjacks.nl/api/health
```

Je wilt `status: ok` zien, met het aantal tabellen en spelers, en een lege
`waarschuwingen`. Staat `ORIGIN` er niet in, dan meldt hij dat hier — de quiz
werkt dan gewoon, maar de koekjes missen hun `Secure`-markering.

Speel daarna de avond een keer na tegen de echte server:

```bash
npx tsx scripts/simulate.ts --url https://quiz.deblackjacks.nl --pin <code> --auto-host --snelheid 20
```

### Wat er dicht staat

Met een openbaar adres staat de server een avond lang open voor iedereen.
Daarom, bovenop de verplichte pincode:

- **Raden wordt afgeremd.** Vijf verkeerde pincodes binnen een minuut zetten
  dat adres vijf minuten op slot, en de vergelijking gebeurt in vaste tijd.
  Achter Traefik telt daarvoor het adres van de telefoon (`ADDRESS_HEADER`
  staat in de compose). Een langere pincode blijft het beste middel; hij
  hoeft maar één keer ingetikt.
- **Opdrachten van een andere site worden geweigerd.** Elke schrijfopdracht
  op `/api/` moet `application/json` zijn en mag niet van een andere site
  komen (`Sec-Fetch-Site: cross-site`). Het sessiecookie is `HttpOnly` en
  `SameSite=Lax`, en `Secure` zodra de app zeker weet dat de verbinding https
  is (`ORIGIN` of `PROTOCOL_HEADER` gezet). Op het thuisnetwerk over gewoon
  http blijft `Secure` uit — een browser weigert zo'n cookie over http en dan
  zou geen telefoon zijn naam kunnen vasthouden.
- **Strakke koppen op elke pagina.** Een Content-Security-Policy met nonces
  (alleen eigen scripts; afbeeldingen, fragmenten en lettertypen van de
  plekken die de app zelf gebruikt), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, een
  `Permissions-Policy` zonder camera, microfoon of locatie, en HSTS over
  https. Bestanden uit `media/` gaan met een eigen policy die geen scripts
  toelaat, ook niet in een svg. De stand (`/api/…`) krijgt
  `Cache-Control: no-store`. De browsertest `e2e/koppen.spec.ts` opent de
  vier schermen en controleert dat de policy niets tegenhoudt — precies de
  fout die je anders pas op de avond ziet.
- **De container draait als `node`, niet als root**, met een alleen-lezen
  bestandssysteem, zonder capabilities en zonder de mogelijkheid er meer bij
  te krijgen (`no-new-privileges`). Alleen de volumes en `/tmp` zijn
  beschrijfbaar; in `app/docker-compose.yml` is `media/` alleen-lezen
  gekoppeld. `python3` en de compiler gaan na het installeren weer weg.
- **Alleen wat er echt in de database hoort.** Een correctie hoort bij een
  speler die meedoet en blijft binnen ±1000 punten; een portret is altijd
  een kleine JPEG, PNG of WebP, ook als de quizmaster hem zet.

**Een bestaand volume.** Draaide de quiz eerder als root, dan is `/data` in
het volume nog van root en kan de nieuwe container er niet in schrijven. De
app zegt dat dan zo bij het opkomen (*Geen schrijfrechten in /data*). Eén
keer, met de compose die je gebruikt:

```bash
docker compose run --rm --user root --entrypoint chown quiz -R node:node /data /app/media
```

### Eén ding om te weten

Spelers hebben geen pincode — dat is een bewuste keuze voor een avond onder
vrienden, en op een huisnetwerk verandert er niets. Staat de quiz op een
openbaar adres, dan kan iedereen die de link heeft een naam kiezen. Het
hostscherm laat zien wie er op welke naam zit, dus je ziet het meteen. Wil je
dat helemaal dicht, zet er dan in Dokploy een basisbeveiliging voor, of haal
het domein pas vlak voor de avond online.

## Wat er nog niet in zit

- De rondes *De Voorspellingen*, *De WK-poule* en *Oktober tot december* wachten
  nog op hun antwoorden; het hostscherm telt hoeveel gekozen vragen er nog een
  antwoord missen.
- Een por komt alleen aan op een telefoon met een open live stroom; een
  telefoon die op navragen is teruggevallen mist hem.
- Er is geen editor in de app; vragen pas je aan in `src/lib/content/packs.ts`.

## Bekende hobbels

`npm install` zonder meer faalt op deze npm-versie met
`Cannot read properties of null (reading 'edgesOut')` — een bug in de
afhankelijkhedenoplosser rond vitest. Met `--legacy-peer-deps` gaat het goed, en
daarna werkt `npm ci` gewoon. De Dockerfile doet dit al.
