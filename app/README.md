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
| Televisie | `/tv` | het grote scherm; vraag, klok en tussenstand |
| Hostscherm | `/host` | de quizmaster; bediening, antwoorden, punten |
| Telefoon | `/` → kies je naam | de spelers; antwoordblad |

De quizmaster meldt zich met de pincode uit `HOST_PIN`. Spelers hebben geen
pincode: op de avond zelf is een vergeten code een echt risico, en het
hostscherm laat zien wie er op welke naam zit.

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
eigen koekjespotten, en controleert dat een vraag op alle schermen tegelijk
verschijnt, dat inleveren werkt en dat de stand meebeweegt. `CHROMIUM_PAD` mag
weg als Playwright zijn eigen browsers heeft.

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

- Media bij vragen (foto's, video, muziek) werkt in de losse quiz, nog niet hier.
- Portretten zijn in het model voorzien (`spelers.foto`), maar er is nog geen
  scherm om ze te uploaden.
- De vragenkiezer zit nog niet in het hostscherm; de samenstelling komt nu uit
  `standaardSamenstelling()`.

## Bekende hobbels

`npm install` zonder meer faalt op deze npm-versie met
`Cannot read properties of null (reading 'edgesOut')` — een bug in de
afhankelijkhedenoplosser rond vitest. Met `--legacy-peer-deps` gaat het goed, en
daarna werkt `npm ci` gewoon. De Dockerfile doet dit al.
