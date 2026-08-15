import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="panel page-state">
      <div class="icon-wrap error"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i></div>
      <h1 class="h4">Page introuvable</h1>
      <p class="text-secondary mb-4">
        Cette adresse n’existe pas. Scannez un QR Code TRANSTU ou suivez un signalement existant.
      </p>
      <div class="d-grid gap-2 col-md-8 mx-auto">
        <a routerLink="/accueil" class="btn btn-transtu">Retour à l’accueil</a>
        <a routerLink="/accueil" class="btn btn-transtu-outline">Retour à l'accueil</a>
      </div>
    </section>
  `,
})
export class NotFoundPage {}
