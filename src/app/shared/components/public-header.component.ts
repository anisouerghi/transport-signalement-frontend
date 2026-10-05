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
        padding: 0 1rem 0.65rem;
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
        color: #0f2758;
      }
      @media (max-width: 420px) {
        .brand,
        .brand__logo {
          width: 132px;
          height: 52px;
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
      .user-menu__trigger i {
        font-size: 1.35rem;
      }
      .user-menu__dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        inset-inline-end: 0;
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
        text-align: start;
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
        height: 4px;
        background: linear-gradient(90deg, #006e2f 0 33.33%, #f5bf00 33.33% 66.66%, #0b52a8 66.66% 100%);
      }
      .public-bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: rgba(248, 249, 255, 0.92);
        backdrop-filter: blur(18px);
        padding: 0.25rem 0.35rem calc(0.25rem + env(safe-area-inset-bottom));
        border-radius: 0;
        box-shadow: 0 -4px 16px rgba(27, 36, 48, 0.06);
      }
      .public-bottom-nav a {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.1rem;
        color: #424752;
        text-decoration: none;
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        min-height: 3rem;
        justify-content: center;
      }
      .public-bottom-nav a i {
        font-size: 1.35rem;
      }
      .public-bottom-nav a.is-active,
      .public-bottom-nav a:hover {
        color: #003b7f;
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
