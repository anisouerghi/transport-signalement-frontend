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
            src="assets/images/signalement_logo.jpg"
            [attr.alt]="'common.appLogoAlt' | translate"
            class="brand__logo"
            width="168"
            height="68"
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
                    {{ 'accountSettings.title' | translate }}
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
        background: rgba(248, 249, 255, 0.92);
        backdrop-filter: blur(18px);
        color: #131c28;
        max-width: 100%;
        overflow-x: clip;
        box-shadow: 0 2px 8px rgba(27, 36, 48, 0.06);
      }
      .public-header__inner {
        box-sizing: border-box;
        width: min(720px, 100%);
        max-width: 100vw;
        margin: 0 auto;
        padding: 0.45rem 1rem 0.3rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        box-sizing: border-box;
        width: 168px;
        height: 68px;
        margin: 0;
        padding: 0;
        text-decoration: none;
        flex: 0 0 auto;
        min-width: 0;
        overflow: hidden;
        background: transparent;
      }
      .brand__logo {
        display: block;
        height: 68px;
        width: 168px;
        max-width: none;
        object-fit: fill;
      }
      .public-header__tools {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex: 0 0 auto;
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
        color: #424752;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 600;
        padding-bottom: 0.15rem;
        border-bottom: 2px solid transparent;
        transition: color 0.15s ease;
      }
      .public-header__links a:hover,
      .public-header__links a.is-active {
        color: #003b7f;
        border-bottom-color: #003b7f;
      }
      .lang-switch {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        min-height: 2.75rem;
        padding: 0.2rem;
        border-radius: 0.5rem;
        background: #eff4ff;
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
        color: #0f2758;
      }
      @media (max-width: 420px) {
        .public-header__inner {
          gap: 0.35rem;
          padding-inline: 0.6rem;
        }
        .brand,
        .brand__logo {
          width: 96px;
          height: 40px;
          object-fit: contain;
        }
        .public-header__tools {
          gap: 0.35rem;
          min-width: 0;
        }
        .lang-btn {
          padding: 0.2rem 0.3rem;
          font-size: 0.65rem;
        }
      }
      .lang-btn--active {
        background: #fff;
        color: #003b7f;
      }
      .nav-link-muted {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .user-menu {
        position: relative;
      }
      .user-menu__trigger {
        width: 2.5rem;
        height: 2.5rem;
        border: 0;
        border-radius: 50%;
        background: #0b52a8;
        color: #fff;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 0 0 2px rgba(0, 59, 127, 0.18);
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
        inset-inline-end: 0;
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
        color: #0f2758;
        text-align: start;
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
        background: #f1f4f8;
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
        height: 4px;
        background: linear-gradient(90deg, #006e2f 0 33.33%, #f5bf00 33.33% 66.66%, #0b52a8 66.66% 100%);
      }
      .public-bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        box-sizing: border-box;
        width: 100%;
        max-width: 100vw;
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.45fr) 2.75rem minmax(0, 1.45fr) minmax(0, 0.8fr);
        align-items: center;
        overflow: hidden;
        background: rgba(248, 249, 255, 0.92);
        backdrop-filter: blur(18px);
        padding: 0.2rem 0.15rem calc(0.2rem + env(safe-area-inset-bottom));
        border-radius: 0;
        box-shadow: 0 -4px 16px rgba(27, 36, 48, 0.06);
      }
      .public-bottom-nav a {
        box-sizing: border-box;
        min-width: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.12rem;
        min-height: 3rem;
        padding: 0.1rem 0.05rem;
        color: var(--on-surface-variant, #424752);
        text-decoration: none;
        font-size: clamp(0.5625rem, 2.55vw, 0.6875rem);
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.15;
        transition: color 0.15s ease;
      }
      .public-bottom-nav .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        font-weight: normal;
        font-style: normal;
        font-size: 1.35rem;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: block;
        white-space: nowrap;
        direction: ltr;
        font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
      }
      .public-bottom-nav__label {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
      }
      .public-bottom-nav__fab-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        min-height: 3rem;
      }
      .public-bottom-nav a.public-bottom-nav__fab {
        flex: 0 0 auto;
        width: 2.75rem;
        height: 2.75rem;
        min-height: 2.75rem;
        padding: 0;
        border-radius: 999px;
        background: #003b7f;
        color: #fff;
        box-shadow: 0 4px 12px rgba(0, 59, 127, 0.28);
      }
      .public-bottom-nav__fab .material-symbols-outlined {
        font-size: 1.5rem;
        font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
      }
      .public-bottom-nav a.is-active,
      .public-bottom-nav a:hover {
        color: #003b7f;
      }
      .public-bottom-nav a.public-bottom-nav__fab,
      .public-bottom-nav a.public-bottom-nav__fab.is-active,
      .public-bottom-nav a.public-bottom-nav__fab:hover {
        color: #fff;
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
