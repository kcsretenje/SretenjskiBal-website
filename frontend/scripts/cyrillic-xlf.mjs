/**
 * Pravi src/locale/messages.sr-Cyrl.xlf (ćirilična verzija sajta, /cir/) iz izvornog src/locale/messages.xlf,
 * tako što srpski tekst preslovi u ćirilicu (src/app/core/i18n/cyrillic.ts).
 *
 * Pokreće se sam pre svake gradnje (npm run build / npm start), pa ćirilica nikad ne zastareva.
 * Fajl messages.sr-Cyrl.xlf se ne menja ručno — ako neka reč ne ispadne dobro, dodaje se izuzetak
 * u EXCEPTIONS ili KEEP_WORDS u cyrillic.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toCyrillic } from '../src/app/core/i18n/cyrillic.ts';

const dir = join(import.meta.dirname, '..', 'src', 'locale');
const src = readFileSync(join(dir, 'messages.xlf'), 'utf8');

/** Preslovljava samo tekst — XML oznake (<x .../>), entiteti (&quot;) i ICU ključne reči ostaju netaknuti. */
function convert(xml) {
  return xml
    .split(/(<[^>]+>|&[#\w]+;|\{VAR_\w+, (?:plural|select),|(?:=\d+|other|\w+) \{|[{}])/)
    .map((part, i) => (i % 2 === 1 || part === undefined ? part ?? '' : toCyrillic(part)))
    .join('');
}

let count = 0;
const out = src
  .replace('source-language="sr-Latn"', 'source-language="sr-Latn" target-language="sr-Cyrl"')
  .replace(/(<source>)([\s\S]*?)(<\/source>)/g, (_m, open, body, close) => {
    count++;
    return `${open}${body}${close}\n        <target>${convert(body)}</target>`;
  });

writeFileSync(join(dir, 'messages.sr-Cyrl.xlf'), out);
console.log(`cyrillic-xlf: ${count} poruka preslovljeno u messages.sr-Cyrl.xlf`);
