import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AppLanguage, LanguageService } from '../../../core/services/language.service';
import { PassengerPreferenceService } from '../../../core/services/passenger-preference.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile-language',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h2 class="h4 mb-3">{{ 'accountSettings.languageTitle' | translate }}</h2>
      @if (loading()) {
        <p class="text-body-secondary mb-0">{{ 'accountSettings.loading' | translate }}</p>
      } @else {
        <div class="d-flex flex-column gap-2" role="radiogroup" [attr.aria-label]="'accountSettings.language' | translate">
          @for (opt of language.options; track opt.code) {
            <div class="form-check">
              <input
                class="form-check-input"
                type="radio"
                name="profile-lang"
                [id]="'lang-' + opt.code"
                [checked]="selected() === opt.code"
                [disabled]="saving()"
                (change)="choose(opt.code)"
              />
              <label class="form-check-label" [for]="'lang-' + opt.code">
                {{ opt.label }}
              </label>
            </div>
          }
        </div>
        @if (saving()) {
          <p class="small text-body-secondary mt-2 mb-0">{{ 'accountSettings.saving' | translate }}</p>
        }
      }
    </section>
  `,
})
export class ProfileLanguageComponent implements OnInit {
  readonly language = inject(LanguageService);
  private readonly preferences = inject(PassengerPreferenceService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly selected = signal<AppLanguage>(this.language.currentLang());
  readonly loading = signal(true);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.preferences.get().subscribe({
      next: (prefs) => {
        const lang = (prefs.language ?? 'FR').trim().toLowerCase();
        if (lang === 'fr' || lang === 'ar' || lang === 'en') {
          this.selected.set(lang);
          void this.language.setLanguage(lang);
        }
        this.loading.set(false);
      },
      error: () => {
        this.selected.set(this.language.currentLang());
        this.loading.set(false);
        this.notifications.error(this.translate.instant('accountSettings.loadError'));
      },
    });
  }

  choose(lang: AppLanguage): void {
    if (this.saving() || this.selected() === lang) {
      return;
    }
    const previous = this.selected();
    this.selected.set(lang);
    this.saving.set(true);
    this.preferences.update({ language: lang }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(this.translate.instant('accountSettings.saved'));
      },
      error: () => {
        this.selected.set(previous);
        this.saving.set(false);
        this.notifications.error(this.translate.instant('accountSettings.saveError'));
      },
    });
  }
}
