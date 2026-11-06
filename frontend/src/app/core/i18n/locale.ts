import { LOCALE_ID, inject } from '@angular/core';

/** Jezik: određuje sadržaj, jezik mejlova, ulaznica i potvrda (tabela rezervacija zna samo za ova tri). */
export type Locale = 'sr' | 'sl' | 'en';

/**
 * Verzija sajta: jezik + pismo. Srpski postoji latinicom (koren) i ćirilicom (/cir/).
 * Ćirilica je samo prikaz sajta — rezervacija sa /cir/ šalje jezik 'sr', pa mejlovi i ulaznice stižu latinicom.
 */
export type SiteLocale = Locale | 'sr-Cyrl';

export interface LocaleOption {
  code: SiteLocale;
  /** Jezik te verzije (za mejlove, rezervaciju, pravne tekstove). */
  lang: Locale;
  label: string;
  /** Pun naziv za čitače ekrana i title. */
  name: string;
  /** Putanja na kojoj živi ta jezička verzija sajta. */
  path: string;
  /** Jezici koji još nisu prevedeni prikazuju se, ali nisu klikabilni. */
  available: boolean;
}

/**
 * Verzije sajta. Prevodi su u src/locale/messages.sl.xlf i messages.en.xlf; ćirilica (messages.sr-Cyrl.xlf)
 * pravi se sama iz srpskog teksta pri svakoj gradnji (scripts/cyrillic-xlf.mjs) i ne prevodi se ručno.
 * Svaka verzija je zasebna gradnja (angular.json → i18n), objavljena na svojoj putanji. Izvorni jezik je srpski
 * latinicom (koren sajta). Posle izmene teksta: `npx ng extract-i18n --format xlf --output-path src/locale`,
 * pa dopuniti prevode (docs/PREVODI.md).
 */
export const LOCALES: LocaleOption[] = [
  { code: 'sr', lang: 'sr', label: 'SR', name: 'Srpski (latinica)', path: '/', available: true },
  { code: 'sr-Cyrl', lang: 'sr', label: 'СР', name: 'Српски (ћирилица)', path: '/cir/', available: true },
  { code: 'sl', lang: 'sl', label: 'SL', name: 'Slovenščina', path: '/sl/', available: true },
  { code: 'en', lang: 'en', label: 'EN', name: 'English', path: '/en/', available: true },
];

/** Verzija sajta iz LOCALE_ID gradnje ('sr-Latn', 'sr-Cyrl', 'sl', 'en'). */
export function siteLocaleOf(id: string): SiteLocale {
  const v = id.toLowerCase();
  if (v.startsWith('sl')) return 'sl';
  if (v.startsWith('en')) return 'en';
  if (v.includes('cyrl')) return 'sr-Cyrl';
  return 'sr';
}

/** Verzija sajta koja se trenutno prikazuje. */
export function currentSiteLocale(): SiteLocale {
  return siteLocaleOf(inject(LOCALE_ID));
}

/** Jezik trenutne verzije — za ćirilicu je to 'sr'. */
export function currentLocale(): Locale {
  const s = currentSiteLocale();
  return s === 'sr-Cyrl' ? 'sr' : s;
}

/** Da li je sajt na ćirilici (/cir/). */
export function isCyrillic(): boolean {
  return currentSiteLocale() === 'sr-Cyrl';
}

/** Prefiks putanje za verziju sajta: '' za srpski latinicom (koren), '/cir', '/sl' ili '/en'. */
export function localePrefix(locale: SiteLocale): string {
  const o = LOCALES.find((l) => l.code === locale);
  return o ? o.path.replace(/\/$/, '') : '';
}
