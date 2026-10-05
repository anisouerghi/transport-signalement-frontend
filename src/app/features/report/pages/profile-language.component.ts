import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-language',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h2 class="h4 mb-0">{{ 'accountSettings.language' | translate }}</h2>
      <p class="text-secondary mt-2 mb-0">{{ 'accountSettings.languageEmpty' | translate }}</p>
    </section>
  `,
})
export class ProfileLanguageComponent {}
