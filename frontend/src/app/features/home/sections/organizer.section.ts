import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeadingComponent } from '../../../shared/components/section-heading/section-heading.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-organizer-section',
  imports: [SectionHeadingComponent, RevealDirective],
  template: `
    <section id="organizator" class="section bg-parchment paper" aria-labelledby="org-title">
      <div class="container grid">
        <div class="heading" appReveal>
          <app-section-heading headingId="org-title" i18n-eyebrow eyebrow="Organizator">Kulturni centar Sretenje</app-section-heading>
        </div>
        <div class="body" appReveal [appRevealDelay]="120">
          <p class="lead" i18n>
            Prvi Sretenjski bal organizuje Kulturni centar Sretenje, inicijativa nastala iz želje da građanska kultura i njene pomalo zaboravljene vrednosti ponovo dobiju svoje mesto u savremenom društvu.
          </p>
          <p i18n>
            Tokom istorije, srpska zajednica na ovim prostorima ostavljala je trag u kulturi, obrazovanju, privredi i duhovnom životu. Naša je namera da to nasleđe približimo savremenom trenutku — ne kao povratak u prošlost, već kao temelj za ono što ćemo tek stvarati.
          </p>
          <p i18n>
            Kulturni centar Sretenje zamišljen je kao trajno mesto okupljanja ljudi iz sveta kulture, nauke, privrede i duhovnog života — mesto razgovora, povezivanja i novih ideja. Njegova je namera da neguje sopstveno nasleđe i istovremeno gradi odnose sa kulturnom sredinom u kojoj deluje.
          </p>
          <div class="why">
            <h3 class="label" i18n>Ideja Sretenja</h3>
            <p i18n>
              U imenu Sretenje sadržana je suština ove zamisli: susret duhovnog i građanskog, tradicije i savremenosti, našeg nasleđa i kulture sredine u kojoj živimo. Verujemo da upravo iz takvih susreta nastaju nove veze i trajna prijateljstva.
            </p>
          </div>
          <p class="closing" i18n>Sretenjski bal prvi je korak ka ostvarenju te zamisli.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .heading { grid-column: 1 / span 5; }
    .body { grid-column: 7 / span 6; display: flex; flex-direction: column; align-items: flex-start; gap: 2rem; padding-top: 2.75rem; }
    .body p { max-width: 38rem; }
    .why { padding-top: 1.5rem; border-top: 1px solid var(--c-rule-brass); display: flex; flex-direction: column; gap: 0.75rem; }
    .closing { font-family: var(--font-display); font-size: clamp(1.5rem, 2.5vw, 2rem); font-style: italic; color: var(--c-wine); }
    @media (max-width: 1023.98px) { .heading, .body { grid-column: 1 / -1; } .body { padding-top: 1rem; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerSectionComponent {}
