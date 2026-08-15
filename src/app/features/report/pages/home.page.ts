import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="panel p-4 text-center">
      <img
        src="assets/images/transtu_logo.png"
        [attr.alt]="'common.brand' | translate"
        class="mb-3"
        style="height: 72px; width: auto"
      />
      <div class="gold-rule mx-auto mb-3"></div>
      <h1 class="h3 mb-2">{{ 'home.title' | translate }}</h1>
      <p class="text-secondary mb-4">{{ 'home.intro' | translate }}</p>
      <p class="small text-secondary mb-4">{{ 'home.followHint' | translate }}</p>
      <a routerLink="/accueil" class="btn btn-transtu">{{ 'common.backHome' | translate }}</a>
    </section>
  `,
})
export class HomePage {}
