import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="public-header">
      <div class="public-header__inner">
        <a routerLink="/accueil" class="brand" aria-label="TRANSTU — Accueil">
          <img
            src="assets/images/transtu_logo.png"
            alt="Logo TRANSTU"
            class="brand__logo"
            width="160"
            height="48"
          />
        </a>
        <nav class="public-header__nav" aria-label="Navigation principale">
          <a routerLink="/suivi" class="nav-link-muted">Suivre un signalement</a>
        </nav>
      </div>
      <div class="gold-bar" aria-hidden="true"></div>
    </header>
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
        padding: 0.85rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
      }
      .brand__logo {
        height: 44px;
        width: auto;
        object-fit: contain;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
      }
      .nav-link-muted {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.92rem;
      }
      .nav-link-muted:hover {
        color: #fff;
        text-decoration: underline;
      }
      .gold-bar {
        height: 3px;
        background: linear-gradient(90deg, #e8a317, #0b8a3e 55%, #1a3a7a);
      }
    `,
  ],
})
export class PublicHeaderComponent {}
