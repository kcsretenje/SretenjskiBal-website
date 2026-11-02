import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgramItem } from '../../../core/models/content.models';
import { RevealDirective } from '../../directives/reveal.directive';

/** Vremenska linija večeri: vreme levo, tačka na vertikalnoj liniji, naziv i opis desno. `dark` za tamne pozadine. */
@Component({
  selector: 'app-program-timeline',
  imports: [RevealDirective],
  host: { '[class.dark]': 'variant() === "dark"' },
  template: `
    <ol class="timeline">
      @for (item of items(); track item.time + item.title; let i = $index) {
        <li class="row" appReveal [appRevealDelay]="i * 60">
          <time class="time">{{ item.time }}@if (item.until) { <span class="until">– {{ item.until }}</span> }</time>
          <span class="dot" aria-hidden="true"></span>
          <div class="text">
            <span class="title">{{ item.title }}</span>
            @if (item.description) { <span class="desc">{{ item.description }}</span> }
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      --tl-line: var(--c-rule-dark);
      --tl-time: var(--c-burgundy);
      --tl-title: var(--c-ink);
      --tl-desc: var(--c-ink-soft);
      --tl-dot: var(--c-burgundy);
      /* Boja pozadine sekcije: tačka je popunjena njom, pa linija ide iza tačke, a ne kroz nju. */
      --tl-bg: var(--c-ivory);
      display: block;
    }
    :host(.dark) {
      --tl-line: var(--c-rule-brass);
      --tl-time: var(--c-brass);
      --tl-title: var(--c-ivory);
      --tl-desc: var(--c-on-dark-soft);
      --tl-dot: var(--c-brass);
      --tl-bg: var(--c-burgundy);
    }
    .timeline { position: relative; }
    .row {
      /* Veličina vremena; od nje zavisi gde je tačka i gde linija počinje i završava. */
      --tl-fs: clamp(1.625rem, 2.4vw, 2.125rem);
      --tl-pad: 1.5rem;
      /* Sredina prvog reda teksta vremena (od vrha reda). */
      --tl-mid: calc(var(--tl-pad) + var(--tl-fs) * 0.55);
      position: relative;
      display: grid;
      grid-template-columns: minmax(70px, 120px) 28px minmax(0, 1fr);
      align-items: start;
      column-gap: 1rem;
      padding: var(--tl-pad) 0.5rem var(--tl-pad) 0;
    }
    /* Vertikalna linija kroz sve redove: od sredine prve do sredine poslednje tačke, iza tačaka. */
    .row::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: calc(min(120px, 100%) + 1rem + 14px);
      width: 1px;
      background: var(--tl-line);
    }
    .row:first-child::before { top: var(--tl-mid); }
    .row:last-child::before { bottom: auto; height: var(--tl-mid); }
    .row:only-child::before { display: none; }
    .dot {
      position: relative;
      z-index: 1;
      justify-self: center;
      width: 11px;
      height: 11px;
      margin-top: calc(var(--tl-fs) * 0.55 - 5.5px);
      border: 1px solid var(--tl-dot);
      border-radius: 1px; /* mali romb */
      background: var(--tl-bg);
      transform: rotate(45deg);
    }
    .time { font-family: var(--font-display); font-size: var(--tl-fs); color: var(--tl-time); line-height: 1.1; text-align: right; }
    .until { display: block; font-size: 0.55em; opacity: 0.75; margin-top: 0.15rem; }
    .text { display: flex; flex-direction: column; gap: 0.25rem; }
    .title { padding-top: calc(var(--tl-fs) * 0.55 - 0.6 * clamp(1.375rem, 2vw, 1.625rem)); font-family: var(--font-display); font-weight: 500; font-size: clamp(1.375rem, 2vw, 1.625rem); color: var(--tl-title); line-height: 1.2; }
    .desc { font-size: 0.9375rem; font-weight: 300; color: var(--tl-desc); }
    @media (max-width: 599.98px) {
      .row { --tl-fs: 1.375rem; grid-template-columns: 64px 20px minmax(0, 1fr); column-gap: 0.75rem; }
      .row::before { left: calc(64px + 0.75rem + 10px); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramTimelineComponent {
  readonly items = input.required<ProgramItem[]>();
  readonly variant = input<'light' | 'dark'>('light');
}
