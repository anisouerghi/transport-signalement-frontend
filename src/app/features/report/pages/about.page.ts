import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h1 class="h3 mb-2">{{ 'about.title' | translate }}</h1>
      <div class="gold-rule mb-3"></div>
      <p class="text-secondary mb-4">{{ 'about.intro' | translate }}</p>
      <p class="text-secondary mb-4">{{ 'about.follow' | translate }}</p>

      <h2 class="h5 mb-3">{{ 'about.howTitle' | translate }}</h2>
      <ol class="about-steps mb-0">
        <li>{{ 'about.step1' | translate }}</li>
        <li>{{ 'about.step2' | translate }}</li>
        <li>{{ 'about.step3' | translate }}</li>
        <li>{{ 'about.step4' | translate }}</li>
      </ol>
    </section>
  `,
})
export class AboutPage {}
