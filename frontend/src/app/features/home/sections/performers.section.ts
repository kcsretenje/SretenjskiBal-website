import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PERFORMERS } from '../../../core/content/site-content';
import { SectionHeadingComponent } from '../../../shared/components/section-heading/section-heading.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { CyrPipe } from '../../../shared/pipes/cyr.pipe';

/**
  * Izvođači kao karusel: portreti (motiv iz znaka), prevlačenje prstom
 * na telefonu, strelice na računaru. Dok nema imena, prikazuje prazne lukove i najavu.
 */
@Component({
  selector: 'app-performers-section',
  imports: [SectionHeadingComponent, RevealDirective, CyrPipe],
  template: `
    <section id="izvodjaci" class="section bg-ivory performers" aria-labelledby="performers-title">
      <div class="container">
        <div class="head" appReveal>
          <app-section-heading headingId="performers-title" i18n-eyebrow eyebrow="U programu učestvuju">
            <ng-container i18n>Učesnici programa</ng-container>
          </app-section-heading>

          @if (performers.length > 1) {
            <div class="controls">
              <button class="arrow" type="button" (click)="step(-1)" [disabled]="atStart()" i18n-aria-label aria-label="Prethodni izvođač">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button class="arrow" type="button" (click)="step(1)" [disabled]="atEnd()" i18n-aria-label aria-label="Sledeći izvođač">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          }
        </div>

        @if (performers.length) {
          <ul #track class="track" appReveal [appRevealDelay]="120" (scroll)="sync()">
            @for (p of performers; track p.role + p.name) {
              <li class="card" [class.card--featured]="p.featured" [class.card--wide]="p.wide">
                <div class="portrait">
                  @if (p.photo) {
                    <img [src]="p.photo" [alt]="(p.name | cyr) ?? p.role" loading="lazy" decoding="async" />
                  } @else {
                    <span class="portrait__mark" aria-hidden="true"></span>
                  }
                </div>
                @if (p.name) {
                  <h3 class="name">{{ p.name | cyr }}</h3>
                } @else {
                  <h3 class="name name--soon" i18n>Uskoro</h3>
                }
                <p class="label role">{{ p.role }}</p>
              </li>
            }
          </ul>
          @if (performers.length > 1) {
            <!-- Telefon: tačkice pokazuju da ima još učesnika i koji je trenutno prikazan. -->
            <div class="dots" role="group" i18n-aria-label aria-label="Učesnici programa">
              @for (p of performers; track p.role + p.name; let i = $index) {
                <button type="button" class="dot" [class.dot--on]="i === current()" (click)="goTo(i)" [attr.aria-label]="(p.name | cyr) ?? p.role" [attr.aria-current]="i === current() ? 'true' : null"></button>
              }
            </div>
          }
          <p class="more" appReveal i18n>Imena ostalih učesnika programa biće uskoro objavljena.</p>
        } @else {
          <ul class="track track--soon" appReveal [appRevealDelay]="120" aria-hidden="true">
            @for (i of soon; track i) {
              <li class="card"><div class="portrait"></div></li>
            }
          </ul>
          <p class="lead soon-note" appReveal i18n>Imena izvođača objavljujemo uskoro.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .performers { overflow: hidden; }
    .head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: clamp(2.5rem, 5vw, 4rem);
    }
    .controls { display: flex; align-items: center; gap: 0.75rem; }
    .arrow {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border: 1px solid var(--c-wine);
      background: transparent;
      color: var(--c-wine);
      cursor: pointer;
      transition: background-color var(--dur-base) var(--ease), color var(--dur-base) var(--ease), opacity var(--dur-base) var(--ease);
    }
    .arrow svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.25; }
    .arrow:hover:not(:disabled) { background: var(--c-wine); color: var(--c-ivory); }
    .arrow:disabled { opacity: 0.3; cursor: default; }

    .track {
      --card-w: clamp(280px, 28vw, 360px);
      --card-gap: clamp(1.25rem, 2.5vw, 2.5rem);
      display: flex;
      gap: var(--card-gap);
      margin: 0;
      padding: 0 0 0.5rem;
      list-style: none;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      /* Karusel izlazi do desne ivice ekrana, poravnat levo sa sadržajem. */
      margin-right: calc(-1 * var(--gutter));
      padding-right: var(--gutter);
    }
    .track::-webkit-scrollbar { display: none; }
    .card { flex: 0 0 var(--card-w); scroll-snap-align: start; }
    /* Grupe (bend, hor, folklor): šira kartica za grupnu fotografiju (krajnjima se malo seku ramena). */
    .card--wide { flex-basis: calc(var(--card-w) * 1.6); }

    .portrait {
      position: relative;
      height: calc(var(--card-w) * 4 / 3);
      overflow: hidden;
      /* Pravougaonik sa zaobljenim gornjim uglovima (blagi luk, bez sečenja glava). */
      border-radius: calc(var(--card-w) * 0.23) calc(var(--card-w) * 0.23) 0 0;
      background: var(--c-placeholder-warm);
    }
    .portrait__mark {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 14px;
      height: 14px;
      border: 1px solid var(--c-brass);
      transform: translate(-50%, -50%) rotate(45deg);
    }
    .name--soon { font-style: italic; color: var(--c-ink-soft); }
    /* Boje fotografija 10% prigušene (blago ka crno-belom), da se slažu međusobno i sa sajtom. */
    .portrait img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(0.9); }
    .name {
      margin: 1.5rem 0 0.5rem;
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 1.75rem;
      line-height: 1.15;
    }
    .role { margin: 0; color: var(--c-burgundy); }

    .track--soon { overflow: hidden; scroll-snap-type: none; }
    .track--soon .portrait { background: transparent; border: 1px solid var(--c-rule-dark); }
    .soon-note { margin-top: 2.5rem; color: var(--c-ink-soft); }
    .more { margin: 2.25rem 0 0; font-family: var(--font-display); font-style: italic; font-size: clamp(1.25rem, 1.8vw, 1.5rem); color: var(--c-burgundy); }

    @media (prefers-reduced-motion: reduce) { .track { scroll-behavior: auto; } }
    .dots { display: none; }
    @media (max-width: 767.98px) {
      /* Kartice uže od ekrana: sledeći učesnik viri sa desne strane, pa se vidi da ima još. */
      .track { --card-w: 64vw; }
      .card--wide { flex-basis: 76vw; }
      .controls .arrow { display: none; }
      .dots { display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.25rem; }
      .dot { width: 24px; height: 24px; padding: 0; border: 0; background: none; cursor: pointer; display: grid; place-items: center; }
      .dot::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--c-rule-dark); transition: background-color 200ms, transform 200ms; }
      .dot--on::before { background: var(--c-wine); transform: scale(1.3); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformersSectionComponent {
  protected readonly performers = PERFORMERS;
  protected readonly soon = [1, 2, 3, 4, 5];
  protected readonly atStart = signal(true);
  protected readonly atEnd = signal(false);
  /** Kartica koja je trenutno na početku karusela (za tačkice na telefonu). */
  protected readonly current = signal(0);
  private readonly track = viewChild<ElementRef<HTMLUListElement>>('track');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.sync();
      const onResize = () => this.sync();
      window.addEventListener('resize', onResize, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
    });
  }

  /** Pomera karusel za jednu karticu levo (-1) ili desno (1). */
  protected step(dir: 1 | -1): void {
    const el = this.track()?.nativeElement;
    const card = el?.querySelector<HTMLElement>('.card:not(.card--featured)') ?? el?.querySelector<HTMLElement>('.card');
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (card.offsetWidth + gap) });
  }

  protected sync(): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    this.atStart.set(el.scrollLeft <= 2);
    this.atEnd.set(el.scrollLeft >= max - 2);
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.card'));
    if (!cards.length) return;
    const x0 = cards[0].offsetLeft;
    let best = 0;
    cards.forEach((c, i) => {
      if (Math.abs(c.offsetLeft - x0 - el.scrollLeft) < Math.abs(cards[best].offsetLeft - x0 - el.scrollLeft)) best = i;
    });
    // Na kraju trake poslednja kartica ne može da stigne do levog ruba — tada je ona aktivna.
    this.current.set(el.scrollLeft >= max - 2 ? cards.length - 1 : best);
  }

  /** Tačkica: skrol do izabrane kartice. */
  protected goTo(i: number): void {
    const el = this.track()?.nativeElement;
    const cards = el ? Array.from(el.querySelectorAll<HTMLElement>('.card')) : [];
    if (!el || !cards[i]) return;
    el.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft });
  }
}
