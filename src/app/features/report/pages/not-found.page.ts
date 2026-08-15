import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="panel page-state">
      <div class="icon-wrap error"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i></div>
      <h1 class="h4">{{ 'notFound.title' | translate }}</h1>
      <p class="text-secondary mb-4">{{ 'notFound.body' | translate }}</p>
      <div class="d-grid gap-2 col-md-8 mx-auto">
        <a routerLink="/accueil" class="btn btn-transtu">{{ 'common.backHome' | translate }}</a>
      </div>
    </section>
  `,
})
export class NotFoundPage {}
