import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type AppLanguage = 'fr' | 'ar' | 'en';

export interface LanguageOption {
  code: AppLanguage;
  /** Libellé affiché dans le sélecteur (langue native). */
  label: string;
  dir: 'ltr' | 'rtl';
}

const STORAGE_KEY = 'transtu_public_lang';
const DEFAULT_LANG: AppLanguage = 'fr';

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'fr', label: 'FR', dir: 'ltr' },
  { code: 'ar', label: 'ع', dir: 'rtl' },
  { code: 'en', label: 'EN', dir: 'ltr' },
];

/**
 * Gère la langue de l'interface publique Voyageur :
 * persistance navigateur, chargement ngx-translate, bascule RTL pour l'arabe.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal<AppLanguage>(DEFAULT_LANG);
  readonly options = LANGUAGE_OPTIONS;

  /** Initialise la langue au démarrage (localStorage ou français par défaut). */
  async init(): Promise<void> {
    const saved = this.readStored();
    await this.applyLanguage(saved ?? DEFAULT_LANG, false);
  }

  /** Change la langue immédiatement sans perdre le parcours / formulaire. */
  async setLanguage(lang: AppLanguage): Promise<void> {
    if (lang === this.currentLang()) {
      return;
    }
    await this.applyLanguage(lang, true);
  }

  isRtl(lang: AppLanguage = this.currentLang()): boolean {
    return LANGUAGE_OPTIONS.find((o) => o.code === lang)?.dir === 'rtl';
  }

  private async applyLanguage(lang: AppLanguage, persist: boolean): Promise<void> {
    const option = LANGUAGE_OPTIONS.find((o) => o.code === lang) ?? LANGUAGE_OPTIONS[0];
    this.translate.setFallbackLang(DEFAULT_LANG);
    await firstValueFrom(this.translate.use(option.code));
    this.currentLang.set(option.code);
    this.applyDocumentDirection(option);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, option.code);
      } catch {
        /* mode privé / quota — non bloquant */
      }
    }
  }

  /** Met à jour lang/dir sur &lt;html&gt; pour l'accessibilité et le CSS RTL. */
  private applyDocumentDirection(option: LanguageOption): void {
    const root = document.documentElement;
    root.lang = option.code;
    root.dir = option.dir;
    root.classList.toggle('lang-rtl', option.dir === 'rtl');
    root.classList.toggle('lang-ltr', option.dir === 'ltr');
  }

  private readStored(): AppLanguage | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === 'fr' || value === 'ar' || value === 'en') {
        return value;
      }
    } catch {
      /* ignore */
    }
    return null;
  }
}
