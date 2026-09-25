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
npm run dev                      # http://localhost:5173, alleen op deze computer
```

Wil je er met de televisie en de telefoons bij, dan start je hem zo:

```bash
npm run lokaal                   # bouwt en start op http://<adres van deze pc>:3000
```

Zie [Op je eigen pc](#op-je-eigen-pc-voor-de-televisie-en-de-telefoons) voor
wat dat doet en wat er mis kan gaan.

Of in Docker, zoals blackjacks-cup draait:

```bash
HOST_PIN=1234 docker compose up --build
```

## Op je eigen pc, voor de televisie en de telefoons

`npm run dev` luistert alleen op de computer zelf (`localhost`): handig om aan
de code te werken, maar een telefoon op dezelfde wifi komt er niet bij. Voor
een proefavond thuis, met de echte televisie en de echte telefoons, is er een
tweede manier:

```bash
npm run lokaal
```

Op Windows kun je ook dubbelklikken op `lokaal.cmd` in deze map; die
installeert de eerste keer de afhankelijkheden en doet daarna hetzelfde.

Wat er dan gebeurt:

1. De app wordt gebouwd (een paar seconden) en gestart op **alle
   netwerkkaarten** van de pc, standaard op poort 3000.
2. De database staat in `data/lokaal.db` en overleeft een herstart; de
   bestanden bij de vragen komen uit `media/`. Beide horen niet in git.
3. Zodra `/api/health` groen is, staat er in het venster welk adres je op de
   televisie tikt (`http://192.168.1.10:3000/tv`), waar het hostscherm en het
   beheerscherm staan, en een **QR-code** die een telefoon zo kan scannen —
   handig als de televisie nog niet aanstaat.
4. `Ctrl`+`C` stopt de server weer.

De pincode is de voorbeeldcode `2627`, tenzij je `HOST_PIN` in `.env` zet of
`--pin` meegeeft. Dit is met opzet geen productie: de voorbeeldcode mag, het
cookie blijft zonder `Secure` (de telefoons praten over gewoon http) en de
server vertelt zijn netwerkadressen. Een `ORIGIN` uit `.env` wordt hier
genegeerd, want die hoort bij de echte server.

| Optie | Doet |
|---|---|
| `--dev` | de ontwikkelserver van Vite op het netwerk, zonder bouwen en met herladen bij elke wijziging |
| `--poort 8080` | een andere poort, als 3000 bezet is |
| `--pin 4711` | een eigen pincode voor het hostscherm |
| `--zonder-bouw` | de vorige build hergebruiken |

Op het televisiescherm zie je hetzelfde: open je hem per ongeluk via
`localhost`, dan zegt de waarschuwing onder de QR-code welk adres je in
plaats daarvan moet tikken. Het beheerscherm toont onder *Server* alle
adressen van de pc, met de naam van de netwerkkaart erbij.

### Als een telefoon er niet bij komt

- **De firewall van Windows.** De eerste keer dat Node op een poort luistert
  vraagt Windows of het mag; kies *Toegang toestaan* voor **particuliere
  netwerken**. Klikte je het weg, zoek dan in de instellingen naar *Een app
  toestaan via Windows Firewall* en vink Node.js aan voor privénetwerken.
  Staat de wifi bij Windows als *openbaar netwerk*, zet hem dan op *privé*
  (Instellingen › Netwerk en internet › de wifi › Netwerkprofiel), anders
  blokkeert de firewall alles van buiten.
- **Hetzelfde netwerk.** Pc, televisie en telefoons moeten op dezelfde wifi
  zitten. Een gastnetwerk of een router met *AP-isolatie* of *client
  isolation* laat apparaten elkaar niet zien, ook al hebben ze allebei
  internet. Mobiele data op de telefoon uit, of in elk geval de wifi aan.
- **Meer dan één adres.** Een pc met Docker, WSL, VirtualBox of een VPN
  heeft meerdere adressen. Het script zet het waarschijnlijkste bovenaan
  (192.168.x.x eerst) en noemt de rest; werkt het bovenste niet, probeer dan
  de volgende. Een VPN die al het verkeer omleidt kun je tijdens de avond
  beter uitzetten.
- **De televisie zelf.** Een smart-tv opent `http://192.168.1.10:3000/tv` in
  zijn eigen browser, maar die browsers zijn traag en oud. Een laptop aan de
  HDMI-kabel, of de laptop naar de televisie casten, werkt altijd; dan open
  je het televisiescherm gewoon op de laptop via hetzelfde netwerkadres —
  niet via `localhost`, want dat adres komt in de QR-code.
- **WSL (Ubuntu binnen Windows).** WSL2 heeft standaard een eigen virtueel
  netwerk: het adres dat het script ziet (172.x.x.x) bestaat alleen binnen
  WSL, en een telefoon komt er niet bij — het script waarschuwt daarvoor.
  Zet WSL eenmalig op het netwerk van Windows: maak in Windows het bestand
  `C:\Users\<naam>\.wslconfig` met

  ```
  [wsl2]
  networkingMode=mirrored
  ```

  open in een PowerShell als beheerder alleen poort 3000, alleen op
  privénetwerken, en laat diezelfde poort door naar WSL:

  ```
  netsh advfirewall firewall add rule name="Blackjacks quiz" dir=in action=allow protocol=TCP localport=3000 profile=private
  New-NetFirewallHyperVRule -Name "BlackjacksQuiz" -DisplayName "Blackjacks quiz" -Direction Inbound -VMCreatorId '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -Protocol TCP -LocalPorts 3000
  ```

  en herstart WSL met `wsl --shutdown`. Daarna noemt het script het gewone
  wifi-adres (192.168.x.x). Meer staat er niet open: alleen die poort, alleen
  op het thuisnetwerk, en alleen zolang de quiz draait. Weghalen kan met
  `netsh advfirewall firewall delete rule name="Blackjacks quiz"` en
  `Remove-NetFirewallHyperVRule -Name "BlackjacksQuiz"`. Blijft het 172.x.x.x (Windows 10 kent geen
  gespiegeld netwerk), stuur de poort dan door vanuit Windows, opnieuw na
  elke herstart omdat het WSL-adres verandert:

  ```
  netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<172-adres uit het script>
  ```

  De telefoons gebruiken dan het wifi-adres van Windows (`ipconfig`, bij de
  Wi-Fi-adapter). Of sla WSL over: installeer Node op Windows zelf en
  dubbelklik `lokaal.cmd`.
- **Docker in plaats van Node.** Ook `docker compose up` in deze map zet de
  quiz op poort 3000 van de pc. De container kent het adres van de pc dan
  niet, dus het script en het beheerscherm kunnen het niet noemen; kijk het
  op met `ipconfig` (Windows) of `ip addr` (Linux, Mac: `ifconfig`). Zet
  `HOST_PIN` in een `.env` naast `docker-compose.yml`, want de container
  draait als productie en weigert de voorbeeldcode.

### Komen de vragen goed door?

Als de telefoon erop komt, is de volgende vraag of hij ook het goede te zien
krijgt. Daar is een controle voor die de hele quiz naloopt en precies zegt
waar het misgaat:

```bash
npm run verify -- --url http://192.168.1.10:3000   # het adres uit npm run lokaal
npm run verify                                     # via localhost
npm run verify -- --zonder-server                  # alleen op papier
```

Eerst op papier: loopt `index.html` gelijk met `packs.ts`, heeft elke vraag
wat zijn type nodig heeft (antwoord, opties, doelgetal), staan de foto's en
fragmenten waar vragen naar verwijzen in `media/`, en hoeveel vragen staan
nog op `teVullen`. Daarna het jaaroverzicht: hoeveel regels de trailer heeft
(en een waarschuwing als dat er nog weinig zijn), welke maanden in de film
meedraaien, welke er leeg blijven, hoeveel regels er nog op invulling wachten,
en of alles tussen haken hoort bij iets wat vanavond ook echt gevraagd wordt.

Dan tegen de server. Hij meldt zich als quizmaster, als één telefoon en als
de televisie, en speelt elke gekozen ronde en elke vraag door in een eigen
**wegwerpspel** met dezelfde samenstelling, zodat het spel dat klaarstaat
heel blijft. Per vraag vergelijkt hij wat de telefoon en de televisie te zien
krijgen met `packs.ts`: vraagtekst, opties, emoji of songtekst, beeld, punten
en klok. Hij let erop dat het antwoord tot de onthulling verborgen blijft en
dat de onthulling daarna klopt met het spiekbriefje van de quizmaster
(antwoord, toelichting, goede optie, doelgetal). Bij een levende vraag neemt
hij de tekst die de server uit de cijfers van resolution-recap maakt; na een
recap-ronde controleert hij dat de cijfers van het jaar er staan. Hij luistert
mee op de live-stroom zoals een telefoon dat doet, zodat je ook ziet of de
server de vragen echt *duwt* en niet alleen op verzoek geeft, en hij haalt elk
mediabestand één keer op via `/media/`. Aan het eind zet hij het oude spel
weer actief en gooit het wegwerpspel weg.

Geef `--url` het netwerkadres, dan test je de weg die de telefoons nemen; via
`localhost` zegt hij dat er zo niets over het netwerk bewezen is. Schermen
die open staan zien de controle voorbijkomen; loopt er al een spel, dan stopt
hij daarom, en met `--forceer` loopt hij toch door. Met `--alles` zie je elke
vraag langskomen in plaats van alleen de problemen. De opdracht eindigt met
een foutcode zodra er iets mis is, dus hij past ook in een script. De pincode
komt uit `.env` of `--pin`, net als bij `npm run lokaal`.

Een vraag die je in `packs.ts` aanpast zonder opnieuw te bouwen komt hier
meteen boven: het spiekbriefje, de telefoon en de televisie tonen dan nog de
oude tekst, en de controle zegt dat de server een oudere bouw draait.

## De drie schermen

| Scherm | Adres | Voor wie |
|---|---|---|
| Televisie | `/tv` | het grote scherm; QR-code, het jaaroverzicht, vraag, klok, onthulling, tussenstand, podium |
| Hostscherm | `/host` | de quizmaster; bediening, antwoorden, punten, rondes kiezen |
| Telefoon | `/` → kies je naam | de spelers; antwoordblad, jouw uitslag, selfie |
| Uitslag | `/uitslag` | iedereen; alle avonden, met per avond de eindstand, prijzen en wat er per vraag gebeurde |
| Beheer | `/beheer` | de quizmaster, buiten de avond om; spelers, oude spellen, telefoons, bestanden bij de vragen, back-up |
| Proefrit | `/proef` (of `/playtest`) | de quizmaster; de hele avond uitproberen met bots, zonder de echte te raken |

De quizmaster meldt zich met de pincode uit `HOST_PIN`. Spelers hebben geen
pincode: op de avond zelf is een vergeten code een echt risico, en het
hostscherm laat zien wie er op welke naam zit.

### Meedoen via de televisie

In de lobby toont de televisie een QR-code met het adres waarop hij zelf de
quiz opende. Iedereen scant, kiest zijn naam en heeft zijn antwoordblad in
handen. Open het televisiescherm daarom via het netwerkadres van de laptop
(bijvoorbeeld `http://192.168.1.10:3000/tv`), niet via `localhost` — het
scherm waarschuwt als je dat toch doet en noemt het adres dat wél werkt.
`npm run lokaal` zet dat adres ook in het terminalvenster. Onder de namen
staat hoeveel telefoons er al bij zijn.

Staat iemand niet in de lijst? Onder de namen tikt een gast zijn naam in en
schuift aan, ook midden in een ronde: hij krijgt meteen een plek in de
teamindeling. De quizmaster kan hetzelfde doen met *+ Gast* op het
hostscherm. Een gast doet niet vanzelf mee aan het volgende spel.

De vaste groep is vijf man: Liz, Bastiaan, Joris, Rik en Eva. Cas is de
quizmaster en speelt de vragen niet mee. Een plus-één voeg je toe als gast;
die speelt elke ronde mee, behalve *De Voorspellingen* (zie hieronder).

Telefoon en televisie houden het scherm wakker zolang de quiz open staat, dus
een vraag verdwijnt niet achter een slotscherm en de laptop schiet niet in de
schermbeveiliging.

Op de telefoon kun je in de lobby een selfie kiezen. Die wordt op de telefoon
zelf bijgesneden en verkleind (256 bij 256) en staat daarna bij je naam op de
televisie, in de stand en op het podium. Tik later op je portret in de kop om
hem te vervangen.

### Het jaaroverzicht: een trailer vooraf, de film na afloop

De quiz gaat over het jaar, dus een overzicht van het jaar vóór de eerste
vraag verklapt al snel de antwoorden. Daarom zijn het er twee.

**De trailer** opent de avond. Daarin staat alleen wat de quiz *niet* vraagt:
de regels uit de tijdlijn zonder dubbele haken (vaak iets van onszelf), en
per maand hoe vaak er gesport is. Geen wereldnieuws, geen maandkoppen — die
noemen de onderwerpen van vanavond — en geen taarten, landen of wie het
vaakst ging, want dat vragen de recap-rondes. Wat de trailer niet laat zien,
gaat ook niet mee in het pakketje naar de televisie en de telefoons, net
zoals een vraag daar pas bij de onthulling in staat.

**De film** draait na de uitslag: het hele jaar maand voor maand.

- **De wereld**: de momenten van die maand, uit dezelfde nagezochte feiten
  als de vragen. Wat er die avond gevraagd werd, staat onderstreept, en er
  schuift een zwarte balk vanaf als de dia binnenkomt.
- **Wij**: hoe vaak er gesport is, hoeveel taart erdoorheen ging, welke
  landen erbij kwamen en wie er het vaakst ging, met de stand van het jaar
  die meeloopt tot de slotkaart met het jaar in getallen. Rechtstreeks uit
  resolution-recap, op de avond zelf uitgerekend.
- Op je **telefoon** staat dezelfde dia, met **jouw** maand eronder: hoe
  vaak jij sportte, hoeveel taart jij at, waar jij was.

Beide lopen vanzelf door: elke dia staat acht tot achttien seconden in beeld,
en het hostscherm tikt hem door zodra de klok afloopt. Met **Pauze** (of `P`)
zet je hem stil, met **Volgende dia** ga je sneller, met `←` een stap terug,
en met **De trailer overslaan** ga je meteen naar ronde 1. Na de laatste dia
van de trailer begint ronde 1 vanzelf; na de film staat het podium er weer.
Welke van de twee draait, beslist de server zelf: vóór de uitslag de trailer,
daarna de film. Terug naar de lobby, en het is weer de trailer.

De trailer neemt alleen maanden mee met een regel die erin mag; de film elke
maand waar iets van te vertellen valt. Zo staat er in oktober geen lege kaart
zolang die maand nog niet bijgeschreven is.

Schrijf je de maanden bij? Zie [Het jaaroverzicht bijschrijven](#het-jaaroverzicht-bijschrijven);
`npm run verify` zegt hoe lang de trailer is en hoeveel regels er nog op
invulling wachten.

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

In de lobby staat **Start de trailer** als hoofdknop; bij de uitslag staat
er *De film: het hele jaar*. Tijdens de trailer of de film zegt het
hostscherm bij welke dia je bent, en bedien je hem met *Volgende dia*,
*Pauze* (`P`), `←` en, in de trailer, *De trailer overslaan*.

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

### Het beheerscherm

Het hostscherm bedient de avond; `/beheer` regelt de rest, vóór of ná de
avond. Dezelfde pincode. Wat er staat:

- **Server.** Of de instellingen kloppen (dezelfde controle als
  `/api/health`), het adres, de database met haar grootte, hoeveel schermen
  er live meekijken, en waar de cijfers van resolution-recap vandaan komen.
  Met **Download een back-up** krijg je de hele database als JSON — voor op
  de usb-stick, vóór de avond. De tokens van de telefoons zitten er niet in.
- **Inhoud.** Per pakket het aantal rondes en vragen, hoeveel er live worden
  uitgerekend en hoeveel er nog een antwoord missen. Daaronder de
  **bestanden bij de vragen**: elk bestand waar een vraag naar verwijst, met
  een groene of rode stip voor of het echt in `media/` staat, en welke
  bestanden in de map door geen vraag gebruikt worden. Zo zie je een vergeten
  filmpje vóór de avond in plaats van erop.
- **Spelers.** De vaste groep en de gasten van eerdere avonden. Hernoemen,
  een portret kiezen of weghalen, een gast vast maken (dan doet hij vanzelf
  mee aan het volgende spel) of andersom, en een nieuwe vaste speler
  toevoegen — die schuift meteen aan als het spel nog in de lobby staat.
  Weghalen kan alleen als er nooit een avond aan hing; anders zou een oude
  uitslag zijn naam kwijtraken. Maak hem dan gast.
- **Spellen.** Elke avond, met fase, aantal spelers, antwoorden en wie er
  voorop staat. Een proefrit gooi je hier weg, met alles wat erbij hoort; was
  het het actieve spel, dan wordt het jongste overgebleven spel actief, en
  als er geen is komt er een leeg spel, zodat de schermen nooit zonder
  zitten. Een eerder spel kun je ook weer **actief maken**: de televisie en
  de telefoons springen er meteen naar.
- **Apparaten.** Elke telefoon, televisie en elk hostscherm dat zich meldde,
  met wanneer het zich voor het laatst liet zien. Zit iemand op de verkeerde
  naam, dan **koppel je die telefoon los**: hij wordt weer kijker en kiest
  opnieuw. Je eigen scherm kun je niet loskoppelen. Apparaten die zich een
  dag niet meldden ruim je met één knop op.

Alles hier wijzigt de database meteen en laat de schermen die open staan
meebewegen. Vragen zelf pas je niet hier aan maar in
`src/lib/content/packs.ts`, zodat de losse HTML-quiz gelijk blijft lopen.

### De cijfers van het jaar, live

Twee rondes gaan over onszelf: *Onze Sportcompetitie* en *Taart & Verre
Landen*. Hun vragen en antwoorden komen niet uit `packs.ts`, maar worden op
de avond zelf uitgerekend uit de export van
[`resolution-recap`](https://github.com/Cas-Boots/resolution-recap). Sport
iemand op oudejaarsdag nog, dan telt dat mee. Ook de tekst van een vraag past
zich aan: staan er twee mensen zonder sportschool in de cijfers, dan vraagt de
vraag naar allebei.

Waar de cijfers vandaan komen, in deze volgorde:

| Instelling | Doet |
|---|---|
| `RECAP_URL` + `RECAP_TOKEN` | live: haalt `/api/export` van resolution-recap op met het `BACKUP_TOKEN` van dat project |
| `RECAP_BESTAND` | een export-JSON op schijf, bijvoorbeeld de nieuwste uit `resolution-recap/backups/` |
| niets | de ingebouwde momentopname in `src/lib/content/recap-snapshot.json` |

De cijfers worden ververst bij het opstarten, zodra je naar een van die rondes
springt (met een wachttijd van hooguit zes seconden, zodat een trage
verbinding de avond niet ophoudt), en met de knop **Ververs de cijfers** op het
hostscherm. Mislukt het, dan blijven de vorige cijfers staan en zegt het
hostscherm dat erbij. Zolang een ronde loopt, veranderen vraag en antwoord
niet vanzelf.

In de vragenlijst op het hostscherm staat *live* achter elke vraag die zo
wordt uitgerekend. De sleutels (`live: "sport.meeste"` in
`src/lib/content/packs.ts`) staan in `src/lib/server/recap/vragen.ts`; daar voeg je ook een nieuwe aan toe. De
momentopname ververs je met een kopie van de nieuwste back-up:

```bash
python3 -c "import json;d=json.load(open('../../resolution-recap/backups/backup-2026-12-31.json'));json.dump({k:d[k] for k in ['exportSchemaVersion','seasons','people','metrics','goals','countries_visited','exportedAt','entries']},open('src/lib/content/recap-snapshot.json','w'),ensure_ascii=False,separators=(',',':'))"
```

**Na de laatste vraag** van zo'n ronde laat de televisie de cijfers zelf zien,
vóór de tussenstand: eerst iedereen naast elkaar, dan per persoon een
jaarkaart (één hokje per dag, de weken als kolommen), het aantal per maand en
de sporten met hoe vaak — of bij de taartronde de taartdagen en de bezochte
landen met vlaggen, in volgorde van bezoek. Elke telefoon toont intussen het
eigen jaar. De quizmaster loopt erdoorheen met *Volgende* (of de spatiebalk)
en kan ze overslaan met *Naar de tussenstand*; met *Toon de cijfers van het
jaar* haal je ze op elk moment in de ronde terug.

### De voorspellingen van januari

De ronde *De Voorspellingen* werkt net zo, met als bron
`src/lib/content/voorspellingen.ts`: de veertien voorspellingen uit
`Voorspellingen_2026.xlsx`, wat iedereen antwoordde en de inzet uit de
puntenmatrix. Vul daar vóór de avond de uitkomsten in (`uitkomst`, en bij open
voorspellingen `goed: ['Eva']`). Een paar rekent de app zelf uit: het aantal
landen van de grootste reiziger en of iedereen zijn eigen sportgetal haalde
(uit resolution-recap), met hoeveel mensen de quiz gespeeld wordt (uit de quiz
zelf) en wie de meeste voorspellingen goed had (uit de rest van de lijst).
Voorspellingen zonder uitkomst staan als *nog open* op de televisie en tellen
niet mee; de vragen van de ronde zeggen erbij hoeveel er nog open staan.

Deze ronde heeft geen vragen op de telefoon. *Start de afrekening* gaat
meteen naar de televisie: de stand (goed, mis, open, punten) en dan één
voorspelling per dia, met wat iedereen zei, de uitkomst en wie er scoorde. Op
je telefoon licht je eigen regel op. De vragen van de ronde staan alleen op
het hostscherm, als spiekbriefje om bij de dia's te vertellen.

Bij de tussenstand na deze ronde krijgt elke speler de punten van zijn eigen
voorspellingen in de stand van de avond. Wie er in januari bij was, doet mee:
de vaste vijf én Cas. De punten van Cas blijven in deze ronde: hij staat op
de dia's met het etiket *quizmaster*, maar niet in de stand van de avond en
niet op het podium. Een gast voorspelde in januari niet en zit deze ronde uit;
de televisie en zijn telefoon zeggen dat erbij. De punten worden niet
opgeslagen maar afgeleid van waar het spel staat, dus *← Terug* of
*ongedaan* haalt ze weer weg, en een uitkomst die je later nog invult telt
vanzelf mee.

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
naspelen. Draai eerst `npm run verify` (zie [Komen de vragen goed
door?](#komen-de-vragen-goed-door)), dan weet je dat de vragen kloppen
voordat je de bediening oefent.

### De hele avond: `/proef`

Open **`/proef`** (of `/playtest`), meld je aan met de pincode van het
hostscherm, kies hoe vaak de bots het goed hebben en of er een plus-één aan
tafel zit, en druk op **Begin de proefrit**.

- **Niets echts wordt geraakt.** Een proefrit is een eigen spel met een eigen
  database in het geheugen van de server. De echte televisie en telefoons
  zien er niets van, hij komt niet in de uitslagen of het beheer, en een
  echte avond kan tegelijk gewoon doorlopen. Elk scherm van een proefrit
  draagt een geel etiket *Proefrit*. Een proefrit verdwijnt na vier uur
  zonder gebruik, bij *Stop de proefrit*, en bij een herstart van de server.
- **Wat je gaat spelen.** De proefrit neemt de spelers (met portret) en de
  gekozen rondes en vragen van de echte avond over.
- **Alle schermen naast elkaar.** De televisie, een tot vier telefoons en
  het hostscherm staan naast elkaar, elk op ware grootte en verkleind. Klik
  door op het hostscherm en speel mee op de telefoons: elke telefoon is een
  eigen apparaat en kiest zijn naam zoals een echte. **Opnieuw** zet een
  telefoon terug bij het kiezen van een naam. *Los openen* opent een scherm
  in een eigen tabblad.
- **Bots aan tafel.** Elke naam waar geen telefoon op zit, speelt een bot: hij
  levert op een geloofwaardig moment in, goed zo vaak als je instelt (70 %
  standaard), bij een teamronde één keer per team. Zet je een telefoon op
  een naam, dan stopt die bot; laat je de telefoon een minuut liggen, dan
  neemt de bot het weer over. Bots uitzetten en een plus-één laten
  aanschuiven kan ook tijdens de proefrit.
- **Spring naar.** Elk onderdeel van de avond is één klik verderop: de lobby,
  de trailer, per ronde de titelkaart, elke vraag **open** (klok loopt) of
  **antwoord** (onthuld), de cijfers of de voorspellingen, de tussenstand,
  het podium en de film na afloop. Alles ervoor spelen de bots meteen, zodat
  de stand eruitziet als bij een echte avond; alles erna wordt gewist, dus
  een vraag opnieuw openen begint hem leeg.
- **Op je eigen telefoon.** Scan de QR-code op de proefpagina (of op de
  televisie van de proefrit) om met een echte telefoon mee te doen. Die zit
  dan in de proefrit, niet in de echte avond, en houdt zijn naam voor de
  echte avond gewoon.

Het verschil met de testmodus hieronder: `/tv?test` laat met verzonnen
vragen zien hoe elke dia van de televisie eruitziet, zonder server. De
proefrit speelt je echte vragen met de echte spelmotor, op alle schermen.

### De televisie alleen: `/tv?test`

Wil je alleen zien hoe het televisiescherm eruitziet en klinkt — zonder
telefoons, zonder hostscherm, zonder spel — open dan de **testmodus**. Het
jaaroverzicht heeft daar een eigen hoofdstuk: de trailer (titelkaart, een
maand, slotkaart) en de film (een maand, slotkaart).

```
http://localhost:5173/tv?test        # bij npm run dev
http://192.168.1.10:3000/tv?test     # het adres uit npm run lokaal, op de echte televisie
```

Het is hetzelfde scherm als op de avond, alleen komen de momentopnamen niet
van de server maar uit een verzonnen spel met zes spelers. Links staat een
paneel met alle dia's van de avond, in volgorde: de lobby, de titelkaart van
een ronde, een vraag van elk type (waar/niet waar, meerkeuze in teams, open
met songtekst, dichtstbij, stem, met foto, met muziekfragment, de
bliksemronde), de onthulling in al zijn smaken (gemengd, nog te beoordelen,
iedereen goed, iedereen fout, niemand ingeleverd, de getallenlijn, de
stemtelling), de cijfers van het jaar, de tussenstand, het podium met de
prijzen, en een paar randgevallen: een veel te lange vraag, een filmpje dat
ontbreekt en het scherm vóór de eerste verbinding.

Op een breed scherm schuift de dia naast het paneel, verkleind maar verder
precies zoals de televisie hem toont. Klap het paneel weg met `T` om hem op
ware grootte te zien; op een smal scherm ligt het paneel eroverheen.

| Toets | Doet |
|---|---|
| `→`, `spatie` | volgende dia |
| `←` | vorige dia |
| `R` | dezelfde dia opnieuw, met alle overgangen en geluiden |
| `T` | paneel tonen of verbergen, om het scherm kaal te zien |
| `B` | in de lobby: een telefoon komt binnen (begroeting en boing) |
| `I` | bij een vraag: iemand levert in; bij de onthulling: beoordeel de volgende inzending |
| `K` | de klok op de laatste acht seconden zetten (het tikken, de trilling, de stempel TIJD!) |
| `P` | de klok pauzeren of hervatten |
| `M` | het fragment afspelen of stoppen |
| `N` | bij de cijfers van het jaar: een stap verder |
| `E` | een reactie van een telefoon laat zweven |

Bij elke dia staat waar je op let. Klik één keer in het scherm voor het
geluid, net als op de avond. De URL onthoudt de dia (`/tv?test=stand`), dus
na een herlading of een aanpassing in de code sta je weer op dezelfde plek —
handig als je aan de opmaak van één dia werkt met `npm run dev`.

De testmodus stuurt niets naar de server: de televisie meldt zich niet aan,
de database blijft zoals hij is, en de vragen zijn verzonnen — de echte
antwoorden horen niet in de browser van de televisie. Het rode etiket
rechtsboven blijft altijd staan, zodat niemand dit scherm voor de echte
avond aanziet. Wil je de echte avond met echte vragen naspelen, dan zijn de
nepspelers hieronder het gereedschap.

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
uitslagpagina en een telefoon zonder live stroom (`avond.spec.ts`); het
beheerscherm met en zonder pincode, spelers toevoegen en hernoemen, een
proefrit weggooien, de back-up en een telefoon loskoppelen (`beheer.spec.ts`).
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

### Het jaaroverzicht bijschrijven

De tijdlijn staat in `src/lib/content/jaaroverzicht.ts`, naast de vragen, en
gaat met dezelfde `npm run content:sync` mee naar de losse quiz. Eén maand
ziet er zo uit:

```ts
{
  nr: 7,
  kop: "De maand waarin alles tegelijk gebeurt",
  momenten: [
    {emoji:"😞", tekst:"Oranje gaat eruit tegen [[Marokko]], [[na strafschoppen, bij 1-1]]."},
    {emoji:"🎂", tekst:"Een regel over onszelf, zonder haken: die komt ook in de trailer."},
    {emoji:"📚", tekst:"Daarmee evenaart hij het record van Merckx en Hinault.", pasNaAfloop:true},
    {emoji:"📰", tekst:"Wat gebeurde er nog meer?", teVullen:true}
  ]
}
```

De afspraken:

1. **Wat de quiz vraagt, gaat tussen dubbele haken.** Zo'n regel komt nooit in
   de trailer, alleen in de film, met het antwoord onderstreept. Elke
   bewering met haken hoort ook in `packs.ts` te staan: de vragen zijn
   nagezocht, de film zet ze op volgorde. `npm run verify` meldt het als er
   iets tussen haken staat wat geen enkele vraag vraagt.
2. **Een regel zonder haken is ook voor de trailer.** Iets wat de quiz niet
   vraagt, vaak iets van onszelf: een verjaardag, een weekend weg, iemand die
   ging verhuizen. Die feiten sta je zelf voor. Er mag geen antwoord van de
   quiz in staan, ook niet via het emoji (❄️ zegt sneeuw);
   `tests/jaaroverzicht.test.ts` vangt een antwoord dat er letterlijk in staat.
3. **Raakt een regel zonder haken toch de quiz, zet er `pasNaAfloop: true`
   bij.** "Daarmee evenaart hij het record" heeft geen haken, maar
   beantwoordt een waar-of-niet-waar. Zo blijft hij uit de trailer.
4. **De kop van een maand staat alleen in de film.** Daar mag hij alles zeggen.

Een regel met `teVullen: true` slaat alles over; oktober, november en
december staan zo klaar om in december bijgeschreven te worden, net als de
ronde *Oktober tot december*. Onze eigen cijfers per maand hoef je nergens in
te vullen: die komen uit resolution-recap, en wat de recap-rondes daarvan
vragen komt vanzelf pas in de film.

Zien hoe het eruitziet zonder een avond te draaien: `/tv?test=film-titel`,
`/tv?test=film-maand` en `/tv?test=film-slot` voor de trailer,
`/tv?test=film-onthuld` en `/tv?test=film-slot-onthuld` voor de film.

Over de lengte hoef je niet te piekeren: een vraag van meer dan honderd tekens
zet de televisie een maat kleiner, en past een dia dan nog niet op het scherm —
een lange vraag met vier lange keuzes, of een podium met zes prijzen én een
poedelprijs — dan krimpt hij in zijn geheel mee tot alles in beeld staat. Aan
de televisie zit immers geen scrollbalk. Wil je zien hoe jouw langste vraag
uitpakt: `/tv?test=vraag-lang` staat er voor klaar.

## Naar productie

Op de avond zelf is een laptop met `npm run lokaal` genoeg. Wil je de quiz op een
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

   **Kijk ook naar het `AAAA`-record.** Veel registrars zetten er standaard
   een IPv6-adres bij dat naar hun eigen parkeerpagina wijst. Let's Encrypt en
   de meeste browsers geven voorrang aan IPv6, dus dan komt het verzoek daar
   uit in plaats van bij jouw server — terwijl het `A`-record er perfect
   uitziet. Haal het weg, of zet het op het IPv6-adres van de server. Bij
   Strato staat het record op het subdomein zelf, niet op het hoofddomein;
   je stelt het in via het tandwieltje naast het subdomein. Controleren kan
   met `getent ahostsv4` en `getent ahostsv6` naast elkaar.
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
  vijf schermen en controleert dat de policy niets tegenhoudt — precies de
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

Onder Dokploy heb je die compose niet bij de hand; daar werk je op de naam van
het volume. In de terminal van de server:

```bash
docker volume ls | grep quiz          # zoek de naam op
docker run --rm -v <volumenaam>:/data alpine chown -R 1000:1000 /data
```

`1000` is de gebruiker `node` uit het image. Is er nog geen avond gespeeld,
dan is weggooien korter dan repareren — een nieuw volume krijgt de eigenaar
wel goed mee, want de Dockerfile zet hem:

```bash
docker volume rm <volumenaam>
```

Daarna opnieuw uitrollen. Let op dat dit de stand van een gespeelde avond
wist; met een volle database gebruik je de `chown` hierboven.

### Eén ding om te weten

Spelers hebben geen pincode — dat is een bewuste keuze voor een avond onder
vrienden, en op een huisnetwerk verandert er niets. Staat de quiz op een
openbaar adres, dan kan iedereen die de link heeft een naam kiezen. Het
hostscherm laat zien wie er op welke naam zit, dus je ziet het meteen. Wil je
dat helemaal dicht, zet er dan in Dokploy een basisbeveiliging voor, of haal
het domein pas vlak voor de avond online.

## Wat er nog niet in zit

- De ronde *De WK-poule* wacht op de cijfers uit
  [`blackjacks-cup`](https://github.com/Cas-Boots/blackjacks-cup). Dat project
  heeft nog geen export en bewaart geen back-ups in de repository; de poule
  staat alleen in zijn productiedatabase. Nodig zijn de tabellen `users`,
  `predictions`, `matches`, `outright_questions` en `outright_predictions`
  als JSON. Zodra die er zijn, kan de ronde net als de voorspellingen worden
  uitgerekend.
- *Oktober tot december* wacht op de gebeurtenissen van het najaar. Vul ze in
  `src/lib/content/packs.ts` en draai `npm run content:sync`; `npm run
  verify` telt per ronde hoeveel gekozen vragen nog een antwoord missen.
- De uitkomsten van de voorspellingen die niemand kan uitrekenen (een nieuwe
  baan, de temperatuur in De Bilt, Spotify Wrapped) vul je met de hand in
  `src/lib/content/voorspellingen.ts`.
- Een por komt alleen aan op een telefoon met een open live stroom; een
  telefoon die op navragen is teruggevallen mist hem.

## Bekende hobbels

`npm install` zonder meer faalt op deze npm-versie met
`Cannot read properties of null (reading 'edgesOut')` — een bug in de
afhankelijkhedenoplosser rond vitest. Met `--legacy-peer-deps` gaat het goed, en
daarna werkt `npm ci` gewoon. De Dockerfile doet dit al.
