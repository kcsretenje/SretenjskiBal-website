import { deepToCyrillic, toCyrillic } from './cyrillic';
import { siteLocaleOf } from './locale';

describe('toCyrillic', () => {
  it('preslovljava slova i dvoslove lj, nj, dž (i velika slova)', () => {
    expect(toCyrillic('Sretenjski bal')).toBe('Сретењски бал');
    expect(toCyrillic('Ljubav, NJIVA, Džep, odžak')).toBe('Љубав, ЊИВА, Џеп, оџак');
    expect(toCyrillic('Đurđevdan, čaša, ćup, žito, šuma')).toBe('Ђурђевдан, чаша, ћуп, жито, шума');
  });

  it('izuzeci: dž na granici prefiksa i strana imena', () => {
    expect(toCyrillic('nadživljavale')).toBe('надживљавале');
    expect(toCyrillic('Dvorana generala Maistra')).toBe('Дворана генерала Мајстра');
    expect(toCyrillic('arhitekta Jan Vejrych')).toBe('архитекта Јан Вејрих');
    expect(toCyrillic('od latinskog ballare')).toBe('од латинског ballare');
  });

  it('ne dira adrese, mejlove, oznake sa ciframa, rimske brojeve i skraćenice', () => {
    expect(toCyrillic('Pišite na info@kcsretenje.si ili posetite https://sretenjskibal.si/cir.')).toBe(
      'Пишите на info@kcsretenje.si или посетите https://sretenjskibal.si/cir.',
    );
    expect(toCyrillic('npr. HR12345678901 ili ATU12345678')).toBe('нпр. HR12345678901 или ATU12345678');
    expect(toCyrillic('krajem XIX veka, 1860-ih')).toBe('крајем XIX века, 1860-их');
    expect(toCyrillic('PDF ulaznica i QR kod, čl. 6(1)(b) GDPR')).toBe('PDF улазница и QR код, чл. 6(1)(b) GDPR');
    expect(toCyrillic('Google Ireland Ltd.')).toBe('Google Ireland Ltd.');
  });

  it('fraze iz keep ostaju latinicom', () => {
    expect(toCyrillic('Adresa: Zagrebška cesta 20, 2000 Maribor.', ['Zagrebška cesta 20, 2000 Maribor'])).toBe(
      'Адреса: Zagrebška cesta 20, 2000 Maribor.',
    );
  });

  it('deepToCyrillic preslovljava sve tekstove u objektu', () => {
    expect(deepToCyrillic({ title: 'Politika', list: ['Ime', 'Prezime'], n: 2 })).toEqual({
      title: 'Политика',
      list: ['Име', 'Презиме'],
      n: 2,
    });
  });
});

describe('siteLocaleOf', () => {
  it('ćirilica je posebna verzija sajta, ali jezik ostaje srpski', () => {
    expect(siteLocaleOf('sr-Latn')).toBe('sr');
    expect(siteLocaleOf('sr-Cyrl')).toBe('sr-Cyrl');
    expect(siteLocaleOf('sl')).toBe('sl');
    expect(siteLocaleOf('en')).toBe('en');
  });
});
