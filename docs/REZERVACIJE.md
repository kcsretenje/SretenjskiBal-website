# Rezervacije karata — uputstvo

Gost popuni formu na **/rezervacija**, dobije broj rezervacije (npr. `27001`), a rezervacija se sama upiše
u Google tabelu „Bal rezervacije". Organizator dobija mejl, a gost potvrdu. Iznos i instrukcije za uplatu
šalje osoba zadužena za karte, iz menija u tabeli. Podsetnike i isticanje neplaćenih rezervacija tabela
radi sama, jednom dnevno.

```
Statički sajt (Cloudflare) ──► Google Apps Script u tabeli ──► tabela + Gmail
  forma, provere u browseru,           Turnstile provera, provera podataka, ograničenje slanja,
  Cloudflare Turnstile                 zaključavanje, broj, upis reda, mejlovi, meni, dnevna provera
```

Sajt nema svoj server: browser šalje rezervaciju direktno skripti (JSON kao običan tekst, pa Google
dozvoljava poziv sa drugog domena). Skripta je zato javna i sama proverava sve: Cloudflare Turnstile
(„da li je čovek"), podatke, skriveno polje za botove i najviše 20 slanja u minuti za ceo sajt.
U sajtu nema nijednog tajnog ključa; tajni Turnstile ključ je samo u Svojstvima skripte.
Ista skripta prima i poruke iz kontakt forme (tab „Poruke" + mejl na `ADMIN_EMAIL`).

---

## TODO — šta još treba promeniti ili saznati

Sve ove stavke su u kodu označene sa `TODO`. Spisak u kodu daje komanda
`grep -rn TODO --exclude-dir=node_modules --exclude-dir=dist .`

| # | Šta | Gde |
|---|---|---|
| 1 | **Ograničiti deljenje tabele** (sada je javna) | Google tabela → Deli (odeljak 1.1) |
| 2 | **Pravi podaci za uplatu**: primalac sa adresom, IBAN, BIC, banka. Sada stoje izmišljene vrednosti sa „TODO", obojene žuto. | Tabela → tab „Podešavanja" (početne vrednosti su u `google-apps-script/Code.gs`, `SETTINGS`) |
| 3 | Opisi (šta je uključeno) za Svečanu i Galeriju | `frontend/src/app/core/content/site-content.ts`, `TICKETS` |
| 4 | Otvaranje prodaje na sajtu: `salesStatus: 'OPEN'` | `site-content.ts`, `EVENT` |
| 5 | Objava sajta (Cloudflare) i Turnstile ključevi | uputstvo: [DEPLOY.md](DEPLOY.md); `frontend/src/app/core/config/app.constants.ts` |
| 6 | Politika privatnosti: tekst je napisan, treba upisati podatke organizatora | [GDPR.md](GDPR.md); `frontend/src/app/core/content/legal-content.ts` |

Dok u podacima za uplatu piše „TODO", meni „Pošalji instrukcije za uplatu" odbija slanje i kaže šta
nedostaje. Podsetnik tada izostavlja primaoca i IBAN. **Gost nikad ne dobija izmišljen broj računa.**
Opciona polja (`BIC`, `BANK`) koja vam ne trebaju jednostavno obrišite.

---

## Prelazak sa probnog naloga na nalog kulturnog centra

Probno je sve radilo pod nalogom fbozic7@gmail.com. Za pravu prodaju tabela i skripta treba da rade
pod nalogom **admin@kcsretenje.si** (Google Workspace), a mejlovi da stižu sa **info@kcsretenje.si**,
koji je alias tog naloga. Mejlove šalje nalog pod kojim radi skripta — zato prelazak.

1. **fbozic7** podeli tabelu sa admin@kcsretenje.si (Deli → urednik).
2. Prijavljeni kao **admin@kcsretenje.si** otvorite tabelu → **Datoteka → Napravi kopiju**.
   Kopija dobija i skriptu i pripada admin@ nalogu.
3. **Gmail naloga admin@** → ⚙️ **Sva podešavanja → Nalozi → Pošalji poštu kao → Dodaj drugu
   adresu e-pošte** → `info@kcsretenje.si`, ime „Sretenjski bal", uključeno **„Tretiraj kao alias"** →
   potvrda (kod stiže na info@, dakle u isto sanduče admin@). Bez ovoga mejlovi idu sa admin@.
4. U kopiji: obrišite probne redove (Rezervacije, Poruke); u tabu **Podešavanja** proverite
   `ADMIN_EMAIL`, `REPLY_TO` i `SENDER_EMAIL` = info@kcsretenje.si.
5. Pratite odeljke **1.3–1.7** ispod, sve kao admin@: „Podesi tabelu", nova web aplikacija,
   Turnstile ključ (`TURNSTILE_SECRET` — Svojstva skripte se ne kopiraju), dnevna provera rokova.
   **„Pošalji probni mejl organizatoru"** prikaže i adresu pošiljaoca — treba da piše info@kcsretenje.si.
6. Novu adresu web aplikacije upišite u `frontend/src/app/core/config/app.constants.ts`
   (`APPS_SCRIPT_URL`) i objavite sajt.
7. U staroj tabeli (fbozic7) arhivirajte web aplikaciju (Upravljaj primenama → Arhiviraj).

Napomene:
- Mejlove iz menija (instrukcije, potvrda uplate) šalje nalog **koji klikne** na meni. Zato meni
  koristite prijavljeni kao admin@. Dnevne podsetnike šalje nalog koji je uključio dnevnu proveru.
- Pri odobravanju skripta traži i pristup Gmailu naloga — to je potrebno za slanje sa adrese info@.
- Ako Google javi da je **administrator blokirao** skriptu: Admin konzola (admin.google.com) →
  Bezbednost → Kontrola pristupa API-jima → dozvolite ovu aplikaciju.

---

## 1. Prvo postavljanje (jednom, ~20 minuta)

Sve radite **prijavljeni kao `info@kcsretenje.si`**. Sa tog naloga će se slati svi mejlovi gostima,
i tom nalogu gosti odgovaraju.

### 1.1 Ograničite deljenje tabele — VAŽNO

Tabela je trenutno dostupna svakome ko ima link („Anyone with the link can view"). Kad u nju počnu
da stižu imena, mejlovi i telefoni gostiju, to ne sme tako da ostane.

Tabela → **Deli (Share)** → Opšti pristup → **Ograničeno (Restricted)** → dodajte samo ljude iz ekipe.

### 1.2 Ubacite skriptu u tabelu

1. Otvorite tabelu → **Proširenja → Apps Script** (Extensions → Apps Script).
2. U fajlu `Code.gs` obrišite sve i nalepite ceo sadržaj fajla `google-apps-script/Code.gs` iz ovog repozitorijuma.
   Zatim pored **Files** kliknite **+** → **Script**, nazovite fajl `QrCode` i u njega nalepite ceo sadržaj
   `google-apps-script/QrCode.gs` (biblioteka za QR kodove na ulaznicama; ovaj fajl se dodaje samo jednom).
   Na isti način dodajte i fajl `Ulaznica` sa sadržajem `google-apps-script/Ulaznica.gs` (PDF ulaznice).
   Isto i fajl `Potvrda` sa sadržajem `google-apps-script/Potvrda.gs` (PDF potvrda o uplati).
   Isto i fajl `Racun` sa sadržajem `google-apps-script/Racun.gs` (PDF račun za firme i čuvanje na Drajvu).
3. ⚙️ **Podešavanja projekta** (Project Settings) → uključite **„Prikaži datoteku manifesta appsscript.json"**.
   Vratite se u Editor, otvorite `appsscript.json` i zamenite sadržaj fajlom `google-apps-script/appsscript.json`.
   Manifest uključuje i **Google Slides API** i **Drive API** (u levom meniju „Services" pojaviće se „Slides" i „Drive"), koji služe
   za pravljenje PDF ulaznica.
4. Sačuvajte (💾).

### 1.3 Podesite tabelu

1. Vratite se u tabelu i osvežite stranicu. Pojaviće se meni **Sretenjski bal**.
2. **Sretenjski bal → Podesi tabelu (prvo pokretanje)**.
3. Google traži dozvolu: *Nastavi → izaberite info@kcsretenje.si → Napredno (Advanced) →
   Idi na projekat (nebezbedno) → Dozvoli*. Upozorenje „nebezbedno" se pojavljuje za svaku skriptu koju
   Google nije pregledao. Skripta je vaša i radi samo nad ovom tabelom.
4. Skripta dodaje tabove **Rezervacije**, **Podešavanja**, **Statistika** i **Poruke** (kontakt forma).
   Postojeći `Sheet1` ostaje netaknut.
   Ponovno pokretanje „Podesi tabelu" je bezbedno: ništa ne briše i ne menja već upisane vrednosti.
   Jedino tab `Statistika` pravi iznova.

### 1.4 Popunite tab „Podešavanja"

| Podešavanje | Šta je |
|---|---|
| `BOOKING_OPEN` | ☑ = sajt prima rezervacije. **Početno je isključeno.** |
| `BALL_YEAR` | Dve cifre godine bala, početak broja rezervacije: `27` → 27001, 27002… |
| `PRICE_SVECANA`, `PRICE_GALERIJA` | Cene u evrima (140, 70). Po njima se iznos za uplatu upisuje automatski kao predlog. Ako cenu menjate, promenite je i na sajtu (`site-content.ts`, `TICKETS`). |
| `PAYMENT_DAYS` | Rok za uplatu u danima od slanja instrukcija (7). |
| `GRACE_DAYS` | Dani posle podsetnika u kojima gost još može da plati (2). Sutradan rezervacija postaje ISTEKLO. |
| `ADMIN_EMAIL` | Kome stižu nove rezervacije i dnevni izveštaj (info@kcsretenje.si). |
| `REPLY_TO` | Kome gosti odgovaraju (info@kcsretenje.si). |
| `SENDER_EMAIL` | Adresa sa koje idu mejlovi (info@kcsretenje.si). Radi kad je dodata u Gmailu naloga kao „Pošalji poštu kao"; dok nije, mejlovi idu sa glavne adrese naloga. |
| `GUEST_EMAILS` | ☑ = gost odmah dobija mejl da je rezervacija evidentirana. |
| `PAYEE`, `IBAN` | **Obavezno** pre slanja instrukcija za uplatu: primalac i broj računa. Početno stoji privremena vrednost sa „TODO" (žuto) — zamenite je pravom. |
| `BIC`, `BANK` | Opciono. Početno „TODO" — upišite pravu vrednost ili obrišite polje. |
| `PAYMENT_NOTE` | Opciono. |

Ne menjajte nazive u koloni A, jer ih skripta prepoznaje po njima. Kolone u tabu „Rezervacije" možete
premeštati, širiti i sortirati, ali **nemojte ih preimenovati**.

### 1.5 Objavite web aplikaciju

1. U Apps Scriptu: **Primeni → Nova primena** (Deploy → New deployment) → tip ⚙️ **Web aplikacija**.
2. *Izvrši kao:* **Ja (info@kcsretenje.si)**. *Ko ima pristup:* **Bilo ko (Anyone)**.
   Posetioci sajta šalju skripti direktno iz browsera, bez Google prijave.
3. **Primeni** → kopirajte **URL web aplikacije** (završava se na `/exec`).

Kod kasnijih izmena `Code.gs` **ne pravite novu primenu** (dobili biste novu adresu), nego
**Primeni → Upravljaj primenama → ✏️ → Verzija: Nova verzija → Primeni**.

### 1.6 Povežite sajt i uključite zaštitu od botova

1. Adresu iz 1.5 upišite u `frontend/src/app/core/config/app.constants.ts` → `APPS_SCRIPT_URL`.
2. **Cloudflare Turnstile** (besplatno, uputstvo u [DEPLOY.md](DEPLOY.md)) daje dva ključa:
   - **Site key** (javni) → `app.constants.ts` → `TURNSTILE_SITE_KEY`;
   - **Secret key** (tajni) → Apps Script → ⚙️ Podešavanja projekta → **Svojstva skripte** →
     dodajte svojstvo `TURNSTILE_SECRET` sa tom vrednošću. Tajni ključ nikad ne ide u kod sajta, git ili mejl.
3. Objavite sajt (DEPLOY.md).

Dok `TURNSTILE_SECRET` nije upisan, skripta koristi Cloudflareov probni ključ koji uvek propušta —
sajt radi, ali **zaštita od botova nije uključena** („Podesi tabelu" na to upozorava).

### 1.7 Uključite automatiku i proverite mejl

1. **Sretenjski bal → Uključi dnevnu proveru rokova**. Provera se pokreće svakog dana između 9 i 10 časova.
   Da li okidač postoji vidite u Apps Scriptu → ⏰ **Okidači (Triggers)**, a da li je radio u
   → **Izvršenja (Executions)**.
2. **Sretenjski bal → Pošalji probni mejl organizatoru**. Mejl treba da stigne na `ADMIN_EMAIL`.

### 1.8 Probna rezervacija pre otvaranja

1. Uključite `BOOKING_OPEN`.
2. Na sajtu napravite rezervaciju sa **svojim** mejlom. Proverite red u tabeli i oba mejla.
3. Probajte meni „Pošalji instrukcije za uplatu" i „Pošalji potvrdu uplate" na tom redu.
4. Obrišite probni red. Pošto brojevi nikad ne idu unazad, sledeća rezervacija bi dobila 27002.
   Da prava prodaja krene od 27001: Apps Script → ⚙️ Podešavanja projekta → **Svojstva skripte**
   → obrišite `COUNTER_27`. Radite to **samo dok u tabeli nema pravih rezervacija.**
5. Isključite `BOOKING_OPEN` dok prodaja zvanično ne počne.

### 1.9 Prikaz na sajtu

Forma je na `/rezervacija`. Dugmad „Rezerviši kartu" u sekciji Karte na početnoj (već vode na formu)
pojavljuju se kad u `frontend/src/app/core/content/site-content.ts` postavite `EVENT.salesStatus: 'OPEN'`.
Do tada sekcija prikazuje karte sa cenama i „Prodaja uskoro počinje".

Tipovi karata su **Svečana** (140 €) i **Galerija** (70 €), isti na početnoj i u formi.
Ako se menjaju, menjaju se na dva mesta (iste šifre): `reservation-form.component.ts` (`TICKET_TYPE_OPTIONS`)
i `google-apps-script/Code.gs` (`TICKET_TYPES`), a naziv i cena još u `site-content.ts` (`TICKETS`).
Posle izmene `Code.gs` ponovo pokrenite „Podesi tabelu", da tab Statistika dobije red za novi tip.

---

## 2. Svakodnevni rad (bez tehničkog znanja)

### Šta je u redu rezervacije

Jedan red je jedna rezervacija. Karte glase na **osobu koja rezerviše**; ako kupuje za nekog drugog,
to piše u koloni **Napomena**. Posebna ishrana i alergije su u zasebnoj koloni **Ishrana i alergije**:
filterom na toj koloni dobijate spisak za kuhinju, a mejl o novoj rezervaciji u naslovu ima
„· posebna ishrana". Broj karata po rezervaciji nije ograničen (postoji samo tehnička granica od 100,
kao zaštita forme od zloupotrebe).

### Raspored taba „Rezervacije"

Kolone su grupisane po boji zaglavlja:

| Boja | Grupa | Kolone |
|---|---|---|
| bordo | Rezervacija | broj, status, ime, tip i broj karata, iznos, ishrana, napomena, datum prijave, e-mail, telefon |
| zelena | Uplata | datumi instrukcija, rok, podsetnik, uplata, **način plaćanja** (Na račun / Gotovina), potvrda, isticanje, **komentar** |
| mesing | Faktura i izvor | faktura, podaci firme, izvor prijave, jezik |
| siva | Tehnički podaci | stranica, UTM, sistemska napomena, ID zahteva — skupljeno, otvara se klikom na „+" iznad kolona |

Broj, status i ime su zamrznuti (vidljivi i pri pomeranju udesno). Pređite mišem preko zaglavlja za
objašnjenje kolone. Boje upozorenja: **žuto** = posebna ishrana, **crven rok** = rok za uplatu je prošao,
**crveni iznos** = iznos nedostaje, **sivi red** = isteklo ili otkazano.

„Podesi tabelu" može da se pokrene bilo kad: sređuje raspored i boje, podaci se premeštaju zajedno sa
kolonama i ništa se ne briše. Isključuje samo trenutno uključene filtere.

### Tab „Gosti" — svi gosti, jedan red po osobi

- Za svaku rezervaciju upisuje se red **Nosilac** (osoba koja je rezervisala, podebljano) i redovi **Gost 2, Gost 3…**,
  svi pod istim brojem rezervacije. Prvih šest kolona svake rezervacije je u istoj boji (dve nijanse se smenjuju).
- Za svakog gosta: ime, prezime, e-mail i telefon. Zajedničko za rezervaciju: tip ulaznice, kako su saznali za bal,
  alergije i napomena.
- **Status rezervacije** (siva kolona) se ovde samo prikazuje — menjajte ga u tabu **Rezervacije**.
- Imena i kontakte gostiju možete ispraviti direktno ovde; ulaznice se prave iz ovog taba.
- Rezervacije napravljene pre uvođenja ovog taba dodaje meni **Sretenjski bal → Podesi tabelu**.
- **Funkcija / firma** i **Komentar** popunjava ekipa ručno; skripta ih ne menja i gost ih ne vidi.
- **Dodatno mesto (galerija)** (poslednja kolona): opciona oznaka. Ne utiče na Statistiku — dodatnih 30 mesta na
  galeriji su za izvođače i nisu u prodaji.
- Tabelu možete filtrirati (npr. po broju rezervacije), ali ne premeštajte kolone.

### Statusi

| Status | Značenje | Ko ga postavlja |
|---|---|---|
| NOVA | rezervacija je primljena | sajt |
| ČEKA NA UPLATU | poslate su instrukcije za uplatu | meni ili ručno |
| PODSETNIK POSLAT | rok je prošao, poslat je podsetnik | dnevna provera |
| PLAĆENO | uplata je proverena na izvodu | **vi, ručno** |
| ISTEKLO | uplata nije stigla, mesta su slobodna | dnevna provera |
| OTKAZANO | rezervacija je otkazana | vi, ručno |

Kolona statusa je padajuća lista i obojena je: plavo NOVA, žuto ČEKA, narandžasto PODSETNIK, zeleno
PLAĆENO, sivo ISTEKLO/OTKAZANO. Filtrom u zaglavlju lako izdvojite npr. sve koje čekaju uplatu.

### Nova rezervacija → instrukcije za uplatu

1. Stiže mejl „Nova rezervacija za Sretenjski bal — 27001". *Odgovori* u mejlu ide direktno gostu.
2. Kolona **Iznos za uplatu** je već popunjena po cenama (npr. 2 × Svečana = 280). Proverite je i,
   ako treba (popust, dogovor), upišite drugi iznos.
3. Kliknite bilo gde u redu → **Sretenjski bal → Pošalji instrukcije za uplatu (izabrani red)**.
   Prikazaće se kome se šalje, koji je iznos i koji je rok. Potvrdite sa **Da**.
4. Skripta šalje mejl na jeziku gosta i sama upisuje datum slanja, rok (danas + 3 dana) i status
   ČEKA NA UPLATU. Ako u kolonu „Rok za uplatu" ranije upišete datum, koristi se taj datum.

Ako instrukcije šaljete sami iz Gmaila (šablon je u odeljku 4), u red ručno upišite **Datum slanja
instrukcija za uplatu**, **Rok za uplatu** i status **ČEKA NA UPLATU**. Bez ta dva datuma sistem neće slati
podsetnik niti oslobađati mesto.

### UPN QR kod za uplatu

- Mejl sa instrukcijama za uplatu (i podsetnik) ima **UPN QR kod**: gost ga skenira u aplikaciji slovenačke banke i
  primalac, iznos, rok, referenca (`SI00` + broj rezervacije) i svrha se popune sami.
- Kod se pravi samo kad su podaci za uplatu pravi: `IBAN` je slovenački (počinje sa `SI56`) i `PAYEE` je upisan u obliku
  **„Naziv, ulica i broj, poštanski broj i mesto"**, npr. `Kulturni centar Sretenje, Zagrebška cesta 20, 2000 Maribor`.
  Inače mejl ide bez QR koda (podaci za ručnu uplatu su uvek tu).
- Gosti sa računom van Slovenije plaćaju ručno, po podacima iz mejla.

### Uplata je na izvodu → PLAĆENO

1. Promenite status u **PLAĆENO**. Po želji upišite **Datum evidentirane uplate**; ako ga ne upišete,
   upisuje se danas.
2. **Sretenjski bal → Pošalji potvrdu uplate (izabrani red)** → **Da**.
3. Upisuje se **Datum slanja potvrde uplate**. Ponovni pokušaj neće poslati drugu potvrdu.
   Ako baš treba ponovo poslati, obrišite taj datum.
4. U potvrdi gost dobija **QR kodove**: po jedan za svakog gosta iz rezervacije, sa imenom i tipom ulaznice.
   Svi kodovi idu osobi koja je rezervisala. Kod svakog gosta se upisuje u tab **Gosti**, u kolonu **Kod ulaznice**.
   Ulaznice se prave po redosledu redova u tabu **Gosti**; ako je gostiju manje nego ulaznica, dodaju se redovi „Gost 3"… koje možete dopuniti.
   Ponovno slanje (posle brisanja datuma) šalje iste kodove i ne pravi duple redove.

## Ulaz na balu — skeniranje ulaznica

**Pre bala (jednom):**
1. U tabu **Podešavanja** u red `SCANNER_PIN` upišite PIN od najmanje 6 cifara. Dok je prazno, skeniranje ne radi.
2. PIN recite samo ljudima na ulazu.
3. Proba: pošaljite sebi potvrdu uplate za probnu rezervaciju i skenirajte svoju ulaznicu (pa u tabu
   **Gosti** obrišite vreme u koloni **Ulazak** da bi ulaznica opet važila).

**Na ulazu:**
1. Na telefonu otvorite **sretenjskibal.si/ulaz** (Chrome ili Safari).
2. Upišite PIN i ime/mesto (npr. „Ulaz 1 — Marko"), pa **Počni skeniranje**. Dozvolite pristup kameri.
   Telefon pamti PIN, pa sledeći put odmah otvara kameru.
3. Usmerite kameru na QR kod gosta (sa telefona ili papira). Ekran postaje:
   - **zelen — Ulaz odobren**: ime i tip ulaznice; vreme ulaska se upisuje u tab **Gosti**;
   - **narandžast — Već iskorišćena**: ulaznica je već skenirana (piše kad i ko je skenirao);
   - **crven — Nevažeća / Nije plaćena / Nije izdata**: kod nije naš, rezervacija nije PLAĆENO (npr. otkazana)
     ili ulaznica nije poslata.
4. Ako kamera ne radi, kod sa ulaznice (npr. `27006-2-K7QH3M9P`) upišite ručno u polje ispod kamere.
5. Gore piše koliko je gostiju ušlo od ukupnog broja ulaznica.

**Rezervna varijanta:** pre bala odštampajte tab **Gosti** (ili ga otvorite na laptopu), za slučaj da
na ulazu nema interneta. Svako skeniranje ide preko interneta i traje 1–2 sekunde.

**Važno:** u Svojstvima skripte postoji `TICKET_SECRET` (pravi se sam pri prvoj ulaznici) — njim su potpisani
QR kodovi. Ne brisati ga i ne menjati, inače već poslate ulaznice prestaju da važe.

### Šta dnevna provera radi sama

- **Podsetnik:** status ČEKA NA UPLATU, poslate instrukcije, uneti rok koji je **prošao**, a podsetnik
  još nije slat → gost dobija ljubazan podsetnik (sa napomenom da odgovori ako je već platio). Upisuje se
  datum, a status postaje PODSETNIK POSLAT.
- **Isticanje:** status PODSETNIK POSLAT, a od podsetnika je prošlo više od `GRACE_DAYS` dana →
  ISTEKLO i upisuje se datum isteka. Gost pri isticanju ne dobija mejl.
- Plaćene, otkazane i istekle rezervacije se nikad ne diraju. Isto važi i za rezervacije sa upisanim
  datumom uplate, čak i kad status nije promenjen.
- Ako podsetnik ne može da se pošalje, status se **ne menja**, pa mesto ne može greškom da se oslobodi.
- Ako je bilo promena ili nešto treba proveriti (npr. status ČEKA bez roka), na `ADMIN_EMAIL` stiže
  kratak izveštaj.
- Ručno pokretanje: **Sretenjski bal → Proveri rokove sada**.

Primer sa podrazumevanim vrednostima: instrukcije 1.11, rok 8.11 → podsetnik 9.11 („platite do 11.11")
→ ISTEKLO 12.11. Ako je gost ipak platio, samo vratite status na PLAĆENO.

### Zatvaranje i ponovno otvaranje prijava

Tab **Podešavanja** → isključite ☐ **`BOOKING_OPEN`**. To je sve: bez izmene koda i bez objavljivanja sajta.

- Forma za najviše ~20 sekundi prikazuje „Rezervacije trenutno nisu dostupne".
- Backend odbija i prijave poslate sa stranice koja je bila otvorena ranije. Skripta to proverava pri
  svakom upisu.
- Već upisane rezervacije ostaju.

Ponovno otvaranje: označite ☑ `BOOKING_OPEN`.

### Statistika

Tab **Statistika** se računa sam i pravi ga „Podesi tabelu" (posle izmene koda pokrenite ga ponovo). Rezervacije,
karte i mesta broje **samo aktivne rezervacije** (NOVA, ČEKA NA UPLATU, PODSETNIK POSLAT, PLAĆENO) — istekle i
otkazane se ne računaju. Delovi:

- **Pregled** (velike brojke): aktivne rezervacije, aktivne karte, plaćene karte, karte koje čekaju uplatu,
  slobodna mesta, uplaćeno, očekivane uplate, ušlo na balu.
- **Karte i mesta po tipu** — samo karte u prodaji (svečane 144 + galerija 70; dodatna mesta za izvođače se ne
  računaju), svaki tip u svojoj boji (svečane — bordo, galerija — plava, ukupno — zlatna): kapacitet, plaćeno,
  zvanice, čeka uplatu, zauzeto, slobodno, popunjenost i traka (tamno = plaćeno i zvanice, svetlo = čeka uplatu).
  Na dnu: stolovi (jedna svečana rezervacija = jedan sto).
- **Rezervacije po statusu** u istim bojama kao u tabu Rezervacije: broj rezervacija, karata i iznos;
  „Aktivne ukupno"; istekle i otkazane posebno, uz napomenu da se ne računaju.
- **Uplate**: na račun, gotovina, plaćeno bez upisanog načina plaćanja (treba popuniti), ukupno, očekuje se,
  prosečno dana od prijave do uplate.
- **Na ulazu**: skenirane ulaznice i procenat od plaćenih karata.
- **O gostima** (samo aktivne rezervacije): kako su saznali za bal, jezik forme, zahtevi za račun na firmu,
  posebna ishrana. Za dublju analizu svaki red u tabu Rezervacije ima i stranicu prijave
  i UTM parametre kampanje (ako ih je link imao).

---

## 3. Šta treba znati

- **Ograničenje mejlova:** Google Workspace nalog (info@kcsretenje.si) može da pošalje oko **1.500 mejlova
  dnevno**, običan Gmail oko 100. Svaka rezervacija odmah troši 2 (organizator + gost), poruka iz
  kontakt forme 1. Preostali broj prikazuje „Pošalji probni mejl".
- **Zaštita od zloupotrebe:** Turnstile provera, skriveno polje, najmanje 4 sekunde od otvaranja forme
  i najviše 20 slanja u minuti za ceo sajt (ako ih je više, posetilac dobija „velika gužva, pokušajte za minut").
- **Ako mejl ne prođe**, rezervacija ostaje sačuvana, a gost vidi uspešan ekran sa brojem.
  U koloni **Sistemska napomena** piše šta nije poslato.
- **Brojevi rezervacija** se dodeljuju pod zaključavanjem, jedan po jedan, pa ni istovremene prijave
  ne mogu dobiti isti broj. Ponovljen zahtev (npr. posle prekida mreže) vraća isti broj i ne pravi
  novi red.
- **Ispravke koda skripte:** posle izmene `Code.gs` → **Primeni → Upravljaj primenama → ✏️ → Verzija:
  Nova verzija → Primeni**. URL ostaje isti. Bez ovog koraka sajt i dalje koristi staru verziju
  (znak: forma kaže „Proverite unete podatke" ili „Rezervacije trenutno nisu dostupne" za ispravan unos).
  Meni i dnevna provera odmah koriste novi kod.
- **Nova godina bala:** promenite `BALL_YEAR` (npr. `28`) i brojevi kreću od 28001.

---

## 4. Šabloni za ručno slanje (ako ne koristite meni)

**Instrukcije za uplatu**

> Naslov: Sretenjski bal — instrukcije za uplatu, rezervacija 27001
>
> Dobar dan, [ime],
>
> pregledali smo vašu rezervaciju broj **27001** ([broj] × [tip karte]).
>
> Iznos za uplatu: **[iznos] EUR**
> Rok za uplatu: **[datum, 3 dana od danas]**
> Primalac: [naziv i adresa]
> IBAN: [broj računa]
> Svrha uplate: **Sretenjski bal 27001**
>
> Molimo vas da u svrsi uplate obavezno navedete „Sretenjski bal 27001", kako bismo uplatu povezali sa
> vašom rezervacijom. Kada uplatu evidentiramo na izvodu, poslaćemo vam potvrdu.
>
> Srdačan pozdrav,
> Sretenjski bal

**Potvrda uplate**

> Naslov: Sretenjski bal — uplata za rezervaciju 27001 je evidentirana
>
> Dobar dan, [ime],
>
> potvrđujemo da je uplata za vašu rezervaciju broj **27001** evidentirana. Hvala vam!
> Radujemo se vašem dolasku na Sretenjski bal.
>
> Srdačan pozdrav,
> Sretenjski bal

Automatski mejlovi postoje na srpskom, slovenačkom i engleskom (`MAIL` u `Code.gs`).
Šalju se na jeziku na kom je gost popunio formu.

---

## 5. Lokalni razvoj i testovi

- `cd frontend && npm start` → http://localhost:4200. Forme šalju pravoj skripti iz `APPS_SCRIPT_URL`
  (lokalno sa Cloudflareovim probnim Turnstile ključem), pa probne rezervacije završavaju u tabeli.
- `cd google-apps-script && npm install && npm test`: provere **cele logike `Code.gs`** — skripta se
  izvršava u Node-u sa lažnom tabelom, lažnim Gmailom i lažnim Turnstileom, pa se ništa ne šalje.
- `cd frontend && npx ng test --watch=false`: provere formi.
- Za testiranje sa pravom tabelom koristite **kopiju tabele** (Datoteka → Napravi kopiju, kopija dobija
  i skriptu) sa sopstvenom web aplikacijom i svojim mejlom, a ne produkcionu tabelu.

## Faktura na firmu (podaci za Sloveniju)

Ako gost traži fakturu na firmu, forma traži:

| Polje | Zašto |
|---|---|
| Naziv firme | piše na fakturi |
| Sedež (ulica, poštanski broj, mesto) | piše na fakturi |
| Država sedišta: Slovenija / druga država EU (firme izvan EU ne mogu da traže fakturu) | firme plaćaju samo iz Slovenije ili EU |
| Poreski broj firme: davčna številka (SI, 8 cifara, uz opcioni prefiks SI) ili broj sa oznakom države (EU, npr. HR12345678901) | obavezan podatak na fakturi; format se proverava |

Forma ne pominje PDV/DDV: društvo je neprofitno i uplata se vodi kao donacija. U koloni „Podaci firme" u tabeli
ova polja stoje u jednoj ćeliji.


## PDF ulaznice

Uz potvrdu uplate gost dobija i PDF ulaznicu za svakog gosta (uspravna, 5,625 × 10 in), pored QR kodova u mejlu.
Za svaku ulaznicu skripta napravi privremenu Google Slides prezentaciju, sačuva je kao PDF i pošalje je u Otpad
na Drajvu naloga pod kojim skripta radi (Otpad se sam prazni posle 30 dana). Jezik ulaznice prati jezik forme.

- Probni PDF: **Sretenjski bal → Pošalji probnu PDF ulaznicu organizatoru** (ime i kod su izmišljeni).
- Ako pravljenje PDF-a ne uspe, potvrda uplate ipak odlazi sa QR kodovima, a poruka posle slanja to javi.
- Posle dodavanja fajla `Ulaznica.gs` Google jednom ponovo traži dozvolu (Slides i Drive).
- Izgled (tekst, boje, raspored) menja se u `Ulaznica.gs`; pozadina (bordo deo sa logom, papir, belo polje za QR)
  je JPEG slika ugrađena na kraju tog fajla.

## PDF potvrda o uplati

Uz ulaznice, u istom mejlu, gost dobija i PDF potvrdu o uplati (A4) — **samo ako je plaćeno na račun**
(kolona „Način plaćanja" = Na račun). Za gotovinu se potvrda ne pravi i ne šalje (ulaznice idu normalno).
Potvrda je **uvek na slovenačkom** („Potrdilo o plačilu"), bez obzira na jezik forme; mejl gostu je i dalje
na njegovom jeziku. Broj potvrde je broj rezervacije; nije račun.

- Organizator: Kulturno društvo Kulturni center Sretenje, Zagrebška cesta 20, 2000 Maribor, matični broj 2949903000,
  poreski broj 41959787, nije obveznik PDV-a (podaci iz registra, upisani u `Potvrda.gs`).
- Uplatilac: kontakt osoba i e-mail, a ako je tražena faktura na firmu — podaci firme i kontakt osoba.
- Stavke po tipu karte sa cenama iz Podešavanja; ako upisani iznos ne odgovara cenama (popust, ručna izmena),
  ide jedna stavka sa upisanim iznosom.
- Datum uplate iz kolone „Datum evidentirane uplate" (ako je prazna — dan slanja), način plaćanja iz kolone
  „Način plaćanja" (popunite je pre slanja!), a kod uplate na račun i IBAN primaoca.
- Potvrda se ne šalje ako je plaćeno u gotovini, ako način plaćanja nije upisan ili ako „Iznos za uplatu" nije upisan —
  poruka posle slanja kaže zašto. Ako pravljenje ne uspe, mejl ipak odlazi, a poruka to javi.
- Probni PDF: **Sretenjski bal → Pošalji probnu potvrdu o uplati organizatoru**.
- Šablon „Sretenjski bal — šablon potvrde o uplati (ne brisati)" skripta sama napravi na Drajvu (ID u Script Properties
  kao `RECEIPT_TEMPLATE_ID`).

## Karte za specijalne zvanice (bez forme i bez uplate)

Za protokolarni sto ili goste koje pozivate (imena možda još ne znate):

1. Meni **Sretenjski bal → Dodaj karte za specijalne zvanice (bez uplate)**.
2. Upišite naziv (npr. „Specijalne zvanice — sto 1"), tip (**S** = svečane, **G** = galerija) i broj karata (sto = 8).
3. Skripta dodaje rezervaciju sa sledećim brojem i statusom **ZVANICE**:
   - mesta se u Statistici računaju kao zauzeta (kolona „Zvanice"), uplata se ne očekuje, podsetnici i istek se ne šalju;
   - u tabu **Gosti** dobija redove „Gost 1…N" sa **kodom ulaznice** (ID) i nazivom u koloni „Funkcija / firma".
4. **Ulaznice:** izaberite taj red u tabu Rezervacije → **Pošalji potvrdu uplate**. QR kodovi i PDF ulaznice stižu na
   mejl organizatora (ADMIN_EMAIL) — prosledite ih ili odštampajte i uručite. Ulaznice važe na ulazu kao plaćene.
5. **Imena kasnije:** upišite ime i prezime umesto „Gost 1…" u tabu Gosti, obrišite datum u koloni
   „Datum slanja potvrde uplate" i ponovo pošaljite — ulaznice dobijaju imena, kodovi ostaju isti.

## Račun za firme i čuvanje na Drajvu

Uz mejl sa ulaznicama ide **jedan** dokument, zavisno od reda u tabeli:

| Način plaćanja | Faktura na firmu | U prilogu |
|---|---|---|
| Na račun | NE | potvrda o uplati („Potrdilo o plačilu") |
| Na račun | **DA** | **račun** na ime firme („Račun št. 2027-001") |
| Gotovina ili prazno | bilo šta | ništa (račun za gotovinu bi morao kroz davčnu blagajnu) |

**Račun** (A4, uvek na slovenačkom) ima: podatke društva (matični i poreski broj, „Ni zavezanec za DDV", IBAN, BIC),
podatke firme iz kolone „Podaci firme" i kontakt osobu, datum izdavanja, datum bala kao datum opravljene storitve,
datum plačila, način plačila i broj rezervacije, stavke po tipu karte, ukupno, „Plačano" i napomenu
„DDV ni obračunan na podlagi 1. odstavka 94. člena ZDDV-1.". Mejl firmi kaže da je u prilogu račun.

- **Broj računa:** GODINA-NNN (2027-001, 2027-002…), redom; upisuje se u kolonu **„Broj računa"**. Broj se troši tek kad
  je PDF napravljen. Ako društvo u toj godini već ima izdate račune, u Podešavanjima upišite **INVOICE_START**
  (prvi slobodan broj) pre prvog računa. Brojač je u Script Properties (`INVOICE_COUNTER_<godina>`) — ne menjati ručno.
- **Drajv:** svaki dokument se čuva u fascikli **„Sretenjski bal — potvrde i računi"** (podfascikle „Računi" i
  „Potrdila o plačilu"), link je u koloni **„Potvrda/račun (Drive)"**. Na kraju je dovoljno tu fasciklu podeliti
  knjigovođi. Ako se potvrda uplate šalje ponovo, koristi se isti fajl i isti broj računa. Ako se link obriše,
  pravi se novi dokument (za račun sa istim brojem iz kolone „Broj računa").
- **Već poslate potvrde:** meni **Sretenjski bal → Sačuvaj na Drajv potvrde/račune već poslatih uplata** napravi
  dokumente koji nedostaju i sačuva ih, **bez slanja mejlova**. Ako je firma tražila račun, a dobila samo potvrdu,
  napravi se račun — pošaljite ga firmi ručno (link u tabeli).
- **Probni račun:** meni **Pošalji probni račun organizatoru** (izmišljena firma, broj „PROBA"; ne troši broj i ne čuva se).
- Pre slanja potvrde uplate firmi proverite kolonu „Podaci firme" (naziv, sedež, davčna številka) — to ide na račun.

## Rezervne kopije

- Meni **Sretenjski bal → Uključi dnevnu rezervnu kopiju**: svake noći (3–4 h) skripta pravi kopiju cele tabele u
  fascikli „Sretenjski bal — rezervne kopije" na Drajvu i čuva poslednjih 14 (starije idu u Otpad). Prva kopija se
  pravi odmah.
- **Napravi rezervnu kopiju sada**: jedna kopija odmah, npr. pre većih izmena.
- Vraćanje: otvorite kopiju iz fascikle i iz nje prepišite potrebne redove; ili u originalnoj tabeli
  **Datoteka → Istorija verzija**.
