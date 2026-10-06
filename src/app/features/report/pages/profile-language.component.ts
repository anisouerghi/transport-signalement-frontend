import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-language',
  standalone: true,
  imports: [],
  template: `
    <section class="panel p-4">
      <h2 class="h4 mb-3">Sélectionnez une langue</h2>
      <div class="d-flex flex-column gap-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="lang-ar"
            [checked]="language.currentLang() === 'ar'"
            (change)="choose('ar')" />
          <label class="form-check-label" for="lang-ar">
            <span class="flag" aria-hidden="true">🇹🇳</span> AR
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="lang-fr"
            [checked]="language.currentLang() === 'fr'"
            (change)="choose('fr')" />
          <label class="form-check-label" for="lang-fr">
            <span class="flag" aria-hidden="true">🇫🇷</span> FR
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="lang-en"
            [checked]="language.currentLang() === 'en'"
            (change)="choose('en')" />
          <label class="form-check-label" for="lang-en">
            <span class="flag" aria-hidden="true">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span> EN
          </label>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .flag {
      font-size: 1.1rem;
      line-height: 1;
    }
  `],
})
export class ProfileLanguageComponent {
  readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);

  async choose(lang: 'ar' | 'fr' | 'en'): Promise<void> {
    await this.language.setLanguage(lang);
    // Persisté sur le compte si l'utilisateur est connecté → langue par défaut à la prochaine connexion.
    if (this.auth.isAuthenticated() && this.auth.currentUser()?.email) {
      this.auth
        .updateProfile({ email: this.auth.currentUser()!.email, language: lang })
        .subscribe();
    }
  }
}
