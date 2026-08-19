import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { AppLanguage, LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <header class="public-header">
      <div class="public-header__inner">
        <a routerLink="/accueil" class="brand" [attr.aria-label]="'common.brandAria' | translate">
          <img
            src="assets/images/transtu_logo.png"
            [attr.alt]="'common.logoAlt' | translate"
            class="brand__logo"
            width="160"
            height="48"
          />
        </a>
        <div class="public-header__tools">
          <div class="lang-switch" role="group" [attr.aria-label]="'header.language' | translate">
            @for (opt of language.options; track opt.code) {
              <button
                type="button"
                class="lang-btn"
                [class.lang-btn--active]="language.currentLang() === opt.code"
                [attr.aria-pressed]="language.currentLang() === opt.code"
                (click)="onLang(opt.code)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
          @if (auth.isAuthenticated()) {
            <span class="nav-user d-none d-md-inline-flex" [attr.title]="auth.currentUser()?.email">
              <i class="bi bi-person-check-fill" aria-hidden="true"></i>
              {{ displayName() }}
            </span>
            <button type="button" class="nav-btn" (click)="logout()">
              {{ 'header.logout' | translate }}
            </button>
          } @else {
            <a routerLink="/connexion" [queryParams]="{ returnUrl: '/mes-signalements' }" class="nav-link-muted">
              {{ 'header.login' | translate }}
            </a>
          }
        </div>
      </div>
      <nav class="public-header__links d-none d-md-flex" [attr.aria-label]="'common.navMain' | translate">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.key | translate }}</a>
        }
      </nav>
      <div class="gold-bar" aria-hidden="true"></div>
    </header>
    <nav class="public-bottom-nav d-md-none" [attr.aria-label]="'common.navMain' | translate">
      @for (item of navItems; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="is-active">
          <i class="bi" [class]="item.icon" aria-hidden="true"></i>
          <span>{{ item.key | translate }}</span>
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .public-header {
        background: linear-gradient(180deg, #0f2758 0%, #1a3a7a 100%);
        color: #fff;
      }
      .public-header__inner {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 0.7rem 1rem 0.45rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
      }
      .brand__logo {
        height: 40px;
        width: auto;
        object-fit: contain;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
      }
      .public-header__tools {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .public-header__links {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 0 1rem 0.65rem;
        gap: 1.1rem;
        justify-content: flex-start;
      }
      .public-header__links a {
        color: rgba(255, 255, 255, 0.82);
        text-decoration: none;
        font-size: 0.92rem;
        font-weight: 600;
        padding-bottom: 0.15rem;
        border-bottom: 2px solid transparent;
      }
      .public-header__links a.is-active,
      .public-header__links a:hover {
        color: #fff;
        border-bottom-color: #e8a317;
      }
      .lang-switch {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        padding: 0.15rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
      }
      .lang-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        padding: 0.28rem 0.45rem;
        border-radius: 999px;
        cursor: pointer;
        line-height: 1.2;
      }
      .lang-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.12);
      }
      .lang-btn--active {
        background: #fff;
        color: #0f2758;
      }
      .nav-link-muted {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .nav-user {
        font-size: 0.85rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        max-width: 8rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .nav-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.45);
        color: #fff;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        cursor: pointer;
      }
      .gold-bar {
        height: 3px;
        background: linear-gradient(90deg, #e8a317, #0b8a3e 55%, #1a3a7a);
      }
      .public-bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 30;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: #0f2758;
        border-top: 3px solid #e8a317;
        padding: 0.35rem 0.2rem calc(0.4rem + env(safe-area-inset-bottom));
      }
      .public-bottom-nav a {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 0.68rem;
        font-weight: 600;
        min-height: 2.85rem;
        justify-content: center;
      }
      .public-bottom-nav a i {
        font-size: 1.15rem;
      }
      .public-bottom-nav a.is-active {
        color: #fff;
      }
    `,
  ],
})
export class PublicHeaderComponent {
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);

  readonly navItems = [
    { path: '/accueil', key: 'nav.home', icon: 'bi-house' },
    { path: '/signalement', key: 'nav.report', icon: 'bi-exclamation-circle' },
    { path: '/mes-signalements', key: 'nav.myReports', icon: 'bi-clipboard-check' },
    { path: '/a-propos', key: 'nav.about', icon: 'bi-info-circle' },
  ];

  displayName(): string {
    const user = this.auth.currentUser();
    if (!user?.name?.trim()) {
      return user?.email?.split('@')[0] ?? '';
    }
    return user.name.split(' ')[0];
  }

  logout(): void {
    this.auth.logout();
  }

  onLang(code: AppLanguage): void {
    void this.language.setLanguage(code);
  }
}
