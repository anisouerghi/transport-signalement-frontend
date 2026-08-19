import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="panel p-4 text-center home-hero">
      <img
        src="assets/images/transtu_logo.png"
        [attr.alt]="'common.brand' | translate"
        class="home-hero__logo mb-3"
      />
      <div class="gold-rule mx-auto mb-3"></div>
      <h1 class="h3 mb-2">{{ 'home.title' | translate }}</h1>
      <p class="text-secondary mb-4 home-hero__intro">{{ 'home.intro' | translate }}</p>

      <ol class="home-steps mb-4">
        <li>
          <span class="home-steps__icon" aria-hidden="true"><i class="bi bi-qr-code-scan"></i></span>
          <span>{{ 'home.step1' | translate }}</span>
        </li>
        <li class="home-steps__arrow" aria-hidden="true"><i class="bi bi-arrow-down"></i></li>
        <li>
          <span class="home-steps__icon" aria-hidden="true"><i class="bi bi-pencil-square"></i></span>
          <span>{{ 'home.step2' | translate }}</span>
        </li>
        <li class="home-steps__arrow" aria-hidden="true"><i class="bi bi-arrow-down"></i></li>
        <li>
          <span class="home-steps__icon" aria-hidden="true"><i class="bi bi-envelope-check"></i></span>
          <span>{{ 'home.step3' | translate }}</span>
        </li>
      </ol>

      <a routerLink="/signalement" class="btn btn-transtu btn-lg w-100">
        {{ 'home.cta' | translate }}
      </a>
    </section>
  `,
})
export class HomePage {}
