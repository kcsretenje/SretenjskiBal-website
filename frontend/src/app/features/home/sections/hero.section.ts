import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HERO_IMAGE } from '../../../core/content/site-content';
import { EmblemComponent } from '../../../shared/components/emblem/emblem.component';

/**
 * Hero „Bordo noć": tamni bordo, fotografija Narodnog doma tonirana u bordo
 * (kad postoji) i plesni par (linijski crtež) koji se polako ukazuje.
 */
@Component({
  selector: 'app-hero-section',
  imports: [NgOptimizedImage, RouterLink, EmblemComponent],
  templateUrl: './hero.section.html',
  styleUrl: './hero.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {
  protected readonly image = HERO_IMAGE;

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const destroyRef = inject(DestroyRef);
    // Telefon: glave para počinju u visini reda „BAL" (desno od njega), ispod reda „SRETENJSKI". Položaj linije zavisi od visine ekrana i fonta,
    // pa ga merimo i ponovo računamo kad se veličina promeni (okretanje telefona, učitan font).
    afterNextRender(() => {
      const hero = host.querySelector<HTMLElement>('.hero');
      const line = host.querySelector<HTMLElement>('.title span:last-child');
      if (!hero || !line || typeof ResizeObserver === 'undefined') return;
      const first = host.querySelector<HTMLElement>('.title span:first-child');
      const textBox = (el: HTMLElement) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return r.getBoundingClientRect();
      };
      const place = () => {
        const h = hero.getBoundingClientRect();
        const top = line.getBoundingClientRect().top - h.top;
        hero.style.setProperty('--couple-top', `${Math.round(top)}px`);
        // Računar/tablet: par ne sme da preklopi „SRETENJSKI". Ako bi se preklopio, smanjujemo ga tako da glave
        // počnu u visini reda „BAL" i da ostane razmak desno od teksta.
        hero.style.removeProperty('--couple-hmax');
        if (!first || window.matchMedia('(max-width: 767.98px)').matches) return;
        const ratio = 783 / 846;
        const gap = 32;
        const right = 24;
        const fullH = Math.min(h.height * 0.78, 650);
        const fullLeft = h.width - right - fullH * ratio;
        const row1 = textBox(first);
        const row2 = textBox(line);
        const overlaps = h.height - fullH < row1.bottom - h.top && fullLeft < row1.right - h.left + gap;
        if (!overlaps) return;
        const byHeight = h.height - top;
        const byWidth = (h.width - right - (row2.right - h.left) - gap) / ratio;
        hero.style.setProperty('--couple-hmax', `${Math.max(0, Math.round(Math.min(byHeight, byWidth)))}px`);
      };
      place();
      const ro = new ResizeObserver(place);
      ro.observe(hero);
      ro.observe(host.querySelector('.content') ?? hero);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }
}
