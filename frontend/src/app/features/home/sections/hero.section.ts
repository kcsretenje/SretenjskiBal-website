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
      const place = () => {
        const top = line.getBoundingClientRect().top - hero.getBoundingClientRect().top;
        hero.style.setProperty('--couple-top', `${Math.round(top)}px`);
      };
      place();
      const ro = new ResizeObserver(place);
      ro.observe(hero);
      ro.observe(host.querySelector('.content') ?? hero);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }
}
