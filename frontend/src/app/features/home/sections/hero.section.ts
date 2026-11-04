import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HERO_IMAGE } from '../../../core/content/site-content';
import { EmblemComponent } from '../../../shared/components/emblem/emblem.component';

/**
 * Leva ivica crteža para (plesni-par-linije.svg) u 20 vodoravnih pojaseva od vrha do dna, kao deo širine slike.
 * Gore su glave (crtež počinje tek oko sredine širine), dole suknja (skoro do leve ivice).
 */
const COUPLE_LEFT_EDGE = [0.585, 0.437, 0.391, 0.369, 0.37, 0.406, 0.407, 0.45, 0.452, 0.414, 0.342, 0.278, 0.229, 0.051, 0.032, 0.033, 0.172, 0.171, 0.282, 0.337];


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
      const texts = () => [
        ...host.querySelectorAll<HTMLElement>('.title span'),
        ...[...(host.querySelector('.content')?.children ?? [])].filter((el) => !el.classList.contains('title')),
      ] as HTMLElement[];
      const textBox = (el: HTMLElement) => {
        // Za tekst merimo sam tekst (ne celu širinu bloka); za dugme i sliku ceo element.
        if (el.matches('a, button, img, svg') || !el.textContent?.trim()) return el.getBoundingClientRect();
        const r = document.createRange();
        r.selectNodeContents(el);
        return r.getBoundingClientRect();
      };
      const place = () => {
        const h = hero.getBoundingClientRect();
        const top = line.getBoundingClientRect().top - h.top;
        hero.style.setProperty('--couple-top', `${Math.round(top)}px`);
        // Računar/tablet: par je što veći, ali crtež ne sme da dodirne tekst. Za svaku visinu para proveravamo
        // levu ivicu crteža (COUPLE_LEFT_EDGE) u visini svakog reda teksta i biramo najveću visinu bez preklapanja.
        hero.style.removeProperty('--couple-hmax');
        if (window.matchMedia('(max-width: 767.98px)').matches) return;
        const ratio = 783 / 846;
        const gap = 28;
        const right = 24;
        const boxes = texts()
          .map(textBox)
          .filter((r) => r.width > 0)
          .map((r) => ({ top: r.top - h.top, bottom: r.bottom - h.top, right: r.right - h.left }));
        const fits = (H: number) => {
          const W = H * ratio;
          const left = h.width - right - W;
          const y0 = h.height - H;
          const n = COUPLE_LEFT_EDGE.length;
          return boxes.every((r) =>
            COUPLE_LEFT_EDGE.every((edge, i) => {
              const a = y0 + (i * H) / n;
              const b = y0 + ((i + 1) * H) / n;
              const touches = b > r.top - gap / 2 && a < r.bottom + gap / 2;
              return !touches || left + edge * W >= r.right + gap;
            }),
          );
        };
        const fullH = Math.min(h.height * 0.78, 650);
        if (fits(fullH)) return;
        let H = fullH;
        while (H > 120 && !fits(H)) H -= 8;
        hero.style.setProperty('--couple-hmax', `${Math.round(H)}px`);
      };
      place();
      const ro = new ResizeObserver(place);
      ro.observe(hero);
      ro.observe(host.querySelector('.content') ?? hero);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }
}
