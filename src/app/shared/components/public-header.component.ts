import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
              @if ($index > 0) {
                <span class="lang-switch__sep" aria-hidden="true"></span>
              }
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
          <div class="user-menu">
            <button
              type="button"
              class="user-menu__trigger"
              [attr.aria-expanded]="userMenuOpen()"
              aria-haspopup="menu"
              [attr.aria-label]="auth.isAuthenticated() ? displayName() : ('header.account' | translate)"
              (click)="toggleUserMenu()"
            >
              @if (auth.isAuthenticated()) {
                {{ userInitials() }}
              } @else {
                <span class="material-symbols-outlined" aria-hidden="true">person</span>
              }
            </button>
            @if (userMenuOpen()) {
              <div class="user-menu__dropdown" role="menu">
                @if (auth.isAuthenticated()) {
                  <a routerLink="/profil" role="menuitem" (click)="closeUserMenu()">
                    <span class="material-symbols-outlined" aria-hidden="true">person</span>
                    {{ 'header.profile' | translate }}
                  </a>
                  <button type="button" role="menuitem" (click)="logout()">
                    <span class="material-symbols-outlined" aria-hidden="true">logout</span>
                    {{ 'header.logout' | translate }}
                  </button>
                } @else {
                  <a
                    routerLink="/connexion"
                    [queryParams]="{ returnUrl: '/mes-signalements' }"
                    role="menuitem"
                    (click)="closeUserMenu()"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">login</span>
                    {{ 'header.login' | translate }}
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>
      <nav class="public-header__links d-none d-md-flex" [attr.aria-label]="'common.navMain' | translate">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.key | translate }}</a>
        }
      </nav>
      <div class="brand-ribbon" aria-hidden="true">
        <span class="brand-ribbon__green"></span>
        <span class="brand-ribbon__gold"></span>
        <span class="brand-ribbon__blue"></span>
      </div>
    </header>
    <nav class="public-bottom-nav d-md-none" [attr.aria-label]="'common.navMain' | translate">
      @for (item of bottomNavItems; track item.path) {
        @if (item.fab) {
          <div class="public-bottom-nav__fab-slot">
            <a
              [routerLink]="item.path"
              routerLinkActive="is-active"
              class="public-bottom-nav__fab"
              [attr.aria-label]="item.key | translate"
            >
              <span class="material-symbols-outlined" aria-hidden="true">{{ item.icon }}</span>
            </a>
          </div>
        } @else {
          <a [routerLink]="item.path" routerLinkActive="is-active">
            <span class="material-symbols-outlined" aria-hidden="true">{{ item.icon }}</span>
            <span class="public-bottom-nav__label">{{ item.key | translate }}</span>
          </a>
        }
      }
    </nav>
  `,
  styles: [
    `
      .public-header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(248, 249, 255, 0.9);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 2px 8px rgba(27, 36, 48, 0.06);
      }
      .public-header__inner {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 0.6rem 1rem 0.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
        min-width: 0;
      }
      .brand__logo {
        height: 40px;
        width: auto;
        object-fit: contain;
      }
      .public-header__tools {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .public-header__links {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 0 1rem 0.6rem;
        gap: 1.1rem;
        justify-content: flex-start;
      }
      .public-header__links a {
        color: var(--on-surface-variant);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
        padding-bottom: 0.15rem;
        border-bottom: 2px solid transparent;
        transition: color 0.15s ease;
      }
      .public-header__links a.is-active,
      .public-header__links a:hover {
        color: var(--primary);
      }
      .public-header__links a.is-active {
        border-bottom-color: var(--primary);
      }
      .lang-switch {
        display: inline-flex;
        align-items: center;
        gap: 0.1rem;
        padding: 0.2rem 0.35rem;
        border-radius: 0.5rem;
        background: var(--surface-container);
      }
      .lang-switch__sep {
        width: 1px;
        height: 0.85rem;
        background: var(--outline-variant);
        margin: 0 0.15rem;
      }
      .lang-btn {
        background: transparent;
        border: none;
        color: var(--on-surface-variant);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        padding: 0.28rem 0.45rem;
        border-radius: 0.4rem;
        cursor: pointer;
        line-height: 1.2;
        transition: color 0.15s ease;
      }
      .lang-btn:hover {
        color: var(--primary);
      }
      .lang-btn--active {
        color: var(--primary);
      }
      .user-menu {
        position: relative;
      }
      .user-menu__trigger {
        width: 2.5rem;
        height: 2.5rem;
        border: 0;
        border-radius: 50%;
        background: var(--surface-container);
        color: var(--primary);
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        outline: 2px solid rgba(0, 59, 127, 0.2);
        outline-offset: 1px;
        transition: background 0.15s ease;
      }
      .user-menu__trigger:hover {
        background: var(--surface-container-high);
      }
      .user-menu__trigger .material-symbols-outlined {
        font-size: 1.4rem;
      }
      .user-menu__dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        z-index: 40;
        min-width: 10rem;
        padding: 0.35rem;
        background: var(--surface-container-lowest);
        border: 1px solid var(--outline-variant);
        border-radius: 0.75rem;
        box-shadow: 0 8px 24px rgba(19, 28, 40, 0.16);
      }
      .user-menu__dropdown a,
      .user-menu__dropdown button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.55rem 0.65rem;
        border: 0;
        border-radius: 0.5rem;
        background: transparent;
        color: var(--on-surface);
        text-align: left;
        text-decoration: none;
        font: inherit;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
      }
      .user-menu__dropdown a .material-symbols-outlined,
      .user-menu__dropdown button .material-symbols-outlined {
        font-size: 1.15rem;
        color: var(--on-surface-variant);
      }
      .user-menu__dropdown a:hover,
      .user-menu__dropdown button:hover {
        background: var(--surface-container-low);
        color: var(--primary);
      }
      .public-bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: calc(4rem + env(safe-area-inset-bottom));
        padding: 0 0.5rem env(safe-area-inset-bottom);
        background: rgba(248, 249, 255, 0.92);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 -4px 16px rgba(27, 36, 48, 0.08);
        border-top: 1px solid rgba(194, 198, 212, 0.4);
      }
      .public-bottom-nav a {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.15rem;
        min-height: 48px;
        color: var(--on-surface-variant);
        text-decoration: none;
        transition: color 0.15s ease;
      }
      .public-bottom-nav a:hover {
        color: var(--primary);
      }
      .public-bottom-nav a .material-symbols-outlined {
        font-size: 1.5rem;
      }
      .public-bottom-nav__label {
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        line-height: 14px;
      }
      .public-bottom-nav a.is-active {
        color: var(--primary);
        font-weight: 700;
      }
      .public-bottom-nav__fab-slot {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .public-bottom-nav__fab {
        flex: none !important;
        width: 3rem;
        height: 3rem;
        min-height: 3rem !important;
        margin-top: -1.25rem;
        border-radius: 50%;
        background: var(--primary-container);
        color: var(--tertiary-fixed) !important;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(11, 82, 168, 0.35);
        transition: transform 0.15s ease;
      }
      .public-bottom-nav__fab:active {
        transform: scale(0.95);
      }
      .public-bottom-nav__fab .material-symbols-outlined {
        font-size: 1.6rem;
        font-weight: 700;
      }
    `,
  ],
})
export class PublicHeaderComponent {
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);
  readonly router = inject(Router);
  readonly userMenuOpen = signal(false);

  readonly navItems = [
    { path: '/accueil', key: 'nav.home', icon: 'home' },
    { path: '/signalement', key: 'nav.report', icon: 'campaign' },
    { path: '/mes-signalements', key: 'nav.myReports', icon: 'assignment' },
    { path: '/scan', key: 'nav.scan', icon: 'qr_code_scanner' },
  ];

  readonly bottomNavItems = [
    { path: '/accueil', key: 'nav.home', icon: 'home', fab: false },
    { path: '/mes-signalements', key: 'nav.myReports', icon: 'assignment', fab: false },
    { path: '/signalement', key: 'nav.report', icon: 'add', fab: true },
    { path: '/scan', key: 'nav.scan', icon: 'qr_code_scanner', fab: false },
    { path: '/profil', key: 'nav.profile', icon: 'person', fab: false },
  ];

  displayName(): string {
    const user = this.auth.currentUser();
    if (!user?.name?.trim()) {
      return user?.email?.split('@')[0] ?? '';
    }
    return user.name.split(' ')[0];
  }

  userInitials(): string {
    const user = this.auth.currentUser();
    const value = user?.name?.trim() || user?.email?.split('@')[0] || '';
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return value.slice(0, 2).toUpperCase();
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.auth.logout();
    void this.router.navigate(['/accueil']);
  }

  onLang(code: AppLanguage): void {
    void this.language.setLanguage(code);
  }
}
