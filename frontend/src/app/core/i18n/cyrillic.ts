/**
 * Preslovljavanje srpske latinice u ćirilicu — za ćiriličnu verziju sajta (/cir/).
 *
 * Koristi se na dva mesta:
 *  - scripts/cyrillic-xlf.mjs pravi src/locale/messages.sr-Cyrl.xlf iz izvornog (srpskog) messages.xlf,
 *    pri svakoj gradnji — zato ćirilični prevod nikad ne zastareva i ne prevodi se ručno;
 *  - pravni tekst (legal-content.ts) koji nije u xlf-u preslovljava se u stranici.
 *
 * Fajl je napisan tako da ga Node pokreće direktno (bez Angulara): samo tipovi, bez importa.
 *
 * Šta ostaje latinicom: adrese sajtova i mejlova, @nalozi, reči sa q/w/x/y (strana imena i brendovi),
 * oznake sa ciframa (HR12345678901, ZVOP-2), rimski brojevi (XIX), skraćenice iz KEEP_WORDS
 * i fraze koje pozivalac prosledi u `keep` (npr. naziv društva i adresa u Sloveniji).
 */

const LETTERS: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к',
  l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', z: 'з', ž: 'ж',
};

const DIGRAPHS: Record<string, string> = { lj: 'љ', nj: 'њ', dž: 'џ' };

/** Reči koje se ne preslovljavaju (skraćenice i oznake koje se i u ćiriličnom tekstu pišu latinicom). */
const KEEP_WORDS = new Set([
  'GDPR', 'PDF', 'QR', 'UPN', 'IBAN', 'BIC', 'SEPA', 'EPC', 'PIN', 'URL', 'IP', 'DNS', 'HTTPS', 'ID', 'ATU', 'HR', 'SI',
  'EUR', 'DDV', 'SB', 'Ltd', 'Inc', 'LLC', 'Gmail', 'Google', 'Sheets', 'Apps', 'Script', 'Cloudflare', 'Workers', 'Turnstile',
  'Ireland', 'Instagram', 'Facebook', 'Viber', 'WhatsApp', 'Maps', 'Analytics',
]);

/** Reči kod kojih pravilo ne radi: dž/nj na granici prefiksa, strana imena koja se preslovljavaju po izgovoru. */
const EXCEPTIONS: Record<string, string> = {
  nadživljavale: 'надживљавале',
  nadživeti: 'надживети',
  nadživeo: 'надживео',
  podžanr: 'поджанр',
  injekcija: 'инјекција',
  konjunktura: 'конјунктура',
  ballare: 'ballare',
  Maister: 'Мајстер',
  Maistra: 'Мајстра',
  Maistru: 'Мајстру',
  Vejrych: 'Вејрих',
  Vejrycha: 'Вејриха',
};

/** Ono što se nikad ne dira: adrese sajtova, mejlovi, domeni, @nalozi, oznake članova propisa (čl. 6(1)(b)). */
const PROTECTED = /(\d+\(\d+\)(?:\([a-z]\))+|https?:\/\/[^\s<>"]+|www\.[^\s<>"]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|@[\w.]+|\b[\w-]+\.(?:si|rs|com|org|net|eu|io|dev)\b(?:\/[^\s<>"]*)?)/g;

/** Reč: slova (srpska latinica i strana), cifre, crtica i apostrof unutar reči. */
const WORD = /[A-Za-zČĆŽŠĐčćžšđ0-9]+(?:[-'’][A-Za-zČĆŽŠĐčćžšđ0-9]+)*/g;

function caseLike(src: string, out: string): string {
  if (src.length > 1 && src === src.toUpperCase()) return out.toUpperCase();
  if (src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase()) return out[0].toUpperCase() + out.slice(1);
  return out;
}

function letters(word: string): string {
  let out = '';
  for (let i = 0; i < word.length; i++) {
    const two = word.slice(i, i + 2);
    const dg = DIGRAPHS[two.toLowerCase()];
    if (dg) {
      // „Lj", „LJ" i „lj" su jedno slovo; veliko ako je prvo slovo veliko.
      out += two[0] === two[0].toLowerCase() ? dg : dg.toUpperCase();
      i++;
      continue;
    }
    const ch = word[i];
    const low = ch.toLowerCase();
    const cy = LETTERS[low];
    out += cy === undefined ? ch : ch === low ? cy : cy.toUpperCase();
  }
  return out;
}

function word(w: string): string {
  if (KEEP_WORDS.has(w)) return w;
  const exc = EXCEPTIONS[w] ?? EXCEPTIONS[w.toLowerCase()];
  if (exc) return caseLike(w, exc);
  // Delovi sa crticom (koktel-haljine, 1860-ih) svaki za sebe.
  return w
    .split(/([-'’])/)
    .map((part) => (/^[-'’]$/.test(part) ? part : wordPart(part)))
    .join('');
}

function wordPart(p: string): string {
  if (KEEP_WORDS.has(p)) return p;
  if (/[qwxyQWXY0-9]/.test(p)) return p;
  if (/^[IVXLCDM]+$/.test(p) && p.length > 1) return p;
  return letters(p);
}

function plain(text: string): string {
  return text.replace(WORD, word);
}

/**
 * Srpski tekst latinicom → ćirilicom.
 * @param keep fraze koje ostaju tačno kako su napisane (npr. naziv firme ili adresa u Sloveniji).
 */
export function toCyrillic(text: string, keep: readonly string[] = []): string {
  if (!text) return text;
  const phrases = keep.filter(Boolean).sort((a, b) => b.length - a.length);
  const parts: string[] = [];
  let rest = text;
  // Prvo izdvajamo fraze iz `keep`, pa u ostatku adrese/mejlove, pa preslovljavamo ostalo.
  while (rest) {
    let at = -1;
    let hit = '';
    for (const p of phrases) {
      const i = rest.indexOf(p);
      if (i !== -1 && (at === -1 || i < at)) {
        at = i;
        hit = p;
      }
    }
    if (at === -1) {
      parts.push(protectedAware(rest));
      break;
    }
    parts.push(protectedAware(rest.slice(0, at)), hit);
    rest = rest.slice(at + hit.length);
  }
  return parts.join('');
}

function protectedAware(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(PROTECTED)) {
    out += plain(text.slice(last, m.index)) + m[0];
    last = (m.index ?? 0) + m[0].length;
  }
  return out + plain(text.slice(last));
}

/** Isto za ceo objekat (svi tekstovi u njemu, rekurzivno). */
export function deepToCyrillic<T>(value: T, keep: readonly string[] = []): T {
  if (typeof value === 'string') return toCyrillic(value, keep) as T;
  if (Array.isArray(value)) return value.map((v) => deepToCyrillic(v, keep)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepToCyrillic(v, keep);
    return out as T;
  }
  return value;
}
