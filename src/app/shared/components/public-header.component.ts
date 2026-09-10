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
                <i class="bi bi-person-circle" aria-hidden="true"></i>
              }
            </button>
            @if (userMenuOpen()) {
              <div class="user-menu__dropdown" role="menu">
                @if (auth.isAuthenticated()) {
                  <a routerLink="/profil" role="menuitem" (click)="closeUserMenu()">
                    {{ 'header.profile' | translate }}
                  </a>
                  <button type="button" role="menuitem" (click)="logout()">
                    {{ 'header.logout' | translate }}
                  </button>
                } @else {
                  <a
                    routerLink="/connexion"
                    [queryParams]="{ returnUrl: '/mes-signalements' }"
                    role="menuitem"
                    (click)="closeUserMenu()"
                  >
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
        background: #ffffff;
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
        color: #0f2758;
        text-decoration: none;
        font-size: 0.92rem;
        font-weight: 600;
        padding-bottom: 0.15rem;
        border-bottom: 2px solid transparent;
      }
      .public-header__links a.is-active,
      .public-header__links a:hover {
        // font-size: 0.95rem;
        color: #0f2758af;
      }
      .lang-switch {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        padding: 0.15rem;
        border-radius: 999px;
        background: rgba(169, 214, 181, 0.47);
      }
      .lang-btn {
        background: transparent;
        border: none;
        color: rgba(10, 10, 10, 0.85);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        padding: 0.28rem 0.45rem;
        border-radius: 999px;
        cursor: pointer;
        line-height: 1.2;
      }
      .lang-btn:hover {
      font-size: 0.82rem;

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
      .user-menu {
        position: relative;
      }
      .user-menu__trigger {
        width: 2.35rem;
        height: 2.35rem;
        border: 0;
        border-radius: 50%;
        background: #0b8a3e;
        color: #fff;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
      }
      .user-menu__trigger i {
        font-size: 1.35rem;
      }
      .user-menu__dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        z-index: 40;
        min-width: 9rem;
        padding: 0.35rem;
        background: #fff;
        border: 1px solid rgba(15, 39, 88, 0.14);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1.25rem rgba(15, 39, 88, 0.18);
      }
      .user-menu__dropdown a,
      .user-menu__dropdown button {
        display: block;
        width: 100%;
        padding: 0.5rem 0.65rem;
        border: 0;
        border-radius: 0.3rem;
        background: transparent;
        color: #0f2758;
        text-align: left;
        text-decoration: none;
        font: inherit;
        cursor: pointer;
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
        height: 3px;
        background: linear-gradient(90deg, #e8a317, #0b8a3e 55%, #1a3a7a);
      }
      .public-bottom-nav {
        position: fixed;
        left: 0.75rem;
        right: 0.75rem;
        bottom: calc(0.75rem + env(safe-area-inset-bottom));
        z-index: 30;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: #0f2758;
        padding: 0.4rem 0.2rem;
        border-radius: 2rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
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
  readonly router = inject(Router);
  readonly userMenuOpen = signal(false);

  readonly navItems = [
    { path: '/accueil', key: 'nav.home', icon: 'bi-house' },
    { path: '/signalement', key: 'nav.report', icon: 'bi-exclamation-circle' },
    { path: '/mes-signalements', key: 'nav.myReports', icon: 'bi-clipboard-check' },
    { path: '/scan', key: 'nav.scan', icon: 'bi-qr-code-scan' },
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
