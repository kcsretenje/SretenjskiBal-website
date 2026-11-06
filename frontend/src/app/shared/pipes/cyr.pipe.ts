import { Pipe, PipeTransform } from '@angular/core';
import { toCyrillic } from '../../core/i18n/cyrillic';
import { isCyrillic } from '../../core/i18n/locale';

/**
 * Tekst koji nije u prevodima (imena izvođača, naziv bala u logotipu, naziv društva) — na ćiriličnoj verziji
 * sajta (/cir/) prikazuje se ćirilicom, na ostalima ostaje kako je napisan. Primer: {{ p.name | cyr }}
 */
@Pipe({ name: 'cyr' })
export class CyrPipe implements PipeTransform {
  private readonly on = isCyrillic();

  transform<T extends string | null | undefined>(value: T): T {
    return this.on && value ? (toCyrillic(value) as T) : value;
  }
}
