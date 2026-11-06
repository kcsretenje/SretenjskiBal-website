# Prevodi sajta (srpski latinicom i ćirilicom, slovenački, engleski)

Sajt ima četiri verzije, svaka je zasebna gradnja:

| Jezik | Adresa | Fajl sa prevodom |
|---|---|---|
| Srpski (izvorni) | `/` | tekstovi su direktno u kodu, spisak je u `frontend/src/locale/messages.xlf` |
| Srpski ćirilicom | `/cir/` | `frontend/src/locale/messages.sr-Cyrl.xlf` — **pravi se sam, ne menja se ručno** (vidi dole) |
| Slovenački | `/sl/` | `frontend/src/locale/messages.sl.xlf` |
| Engleski | `/en/` | `frontend/src/locale/messages.en.xlf` |

Prevod jednog teksta je u `<target>` oznaci, odmah ispod izvornog `<source>`.
Ispravka prevoda = izmeni tekst u `<target>`, pa ponovo objavi sajt (`docker compose up --build`).
Delovi unutar vitičastih/oštrih oznaka (`<x id="..." />`) su mesta za linkove i ubačene vrednosti — ne brisati ih.

## Kad se promeni ili doda tekst na sajtu

1. U `frontend/` pokrenuti: `npx ng extract-i18n --format xlf --output-path src/locale` — osvežava `messages.xlf`.
2. Novi ili izmenjeni tekstovi dobijaju novi ID. U `messages.sl.xlf` i `messages.en.xlf` dodati taj `<trans-unit>`
   (kopirati ga iz `messages.xlf`) i ispod `<source>` dopisati `<target>` sa prevodom.
   Tekst bez prevoda se prikazuje na srpskom (gradnja ispiše upozorenje „No translation found").
3. Pravni tekstovi (`/privacy`, `/cookies`) ne idu kroz ovaj sistem; njihovi prevodi su u `core/content/legal-content.ts`.

## Ćirilica (`/cir/`)

- Ćirilični tekst se ne prevodi: pri svakoj gradnji (`npm run build`) skripta `frontend/scripts/cyrillic-xlf.mjs`
  preslovi srpski tekst iz `messages.xlf` i napiše `messages.sr-Cyrl.xlf`. Ručno: `npm run i18n:cyrillic`.
- Pravila preslovljavanja su u `frontend/src/app/core/i18n/cyrillic.ts`. Ako neka reč ne ispadne dobro, dodati je u
  `EXCEPTIONS` (npr. `Maistra: 'Мајстра'`) ili u `KEEP_WORDS` (reči koje ostaju latinicom, npr. `Google`).
  Latinicom ostaju i adrese sajtova, mejlovi, oznake sa ciframa i rimski brojevi.
- Tekstovi van prevoda (imena izvođača, naziv bala u logotipu) koriste pipe `| cyr`; pravni tekst se preslovljava u stranici.
- **Mejlovi, ulaznice i potvrde za rezervacije sa `/cir/` stižu latinicom** — forma šalje jezik `sr`, isto kao sa `/`.

## Napomene

- Nazivi stranica (`/rezervacija`, `/kontakt`, `/balska-tradicija`) su isti u sva tri jezika; menja se samo prefiks (`/sl/rezervacija`).
- Prevodi su pisani kao nacrt: pre objave ih treba da pregleda osoba kojoj je slovenački odnosno engleski maternji jezik.
- `npm start` (`ng serve`, brzo osvežavanje) prikazuje samo srpski, pa tamo prekidač SL/EN ne vodi nigde. Za proveru sva tri jezika:
  `npm run start:all` (u folderu `frontend`; gradi sajt i pokreće ga), pa otvoriti `http://localhost:4000/`, `/cir/`, `/sl/` i `/en/`.
- Gotov sajt (`npm run build`) sadrži sve četiri verzije u `dist/frontend/browser` (`/`, `/cir/`, `/sl/`, `/en/`), pa ga Cloudflare Pages služi bez ikakvih dodatnih podešavanja.
