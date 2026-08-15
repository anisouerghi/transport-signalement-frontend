import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="panel p-4 text-center">
      <img
        src="assets/images/transtu_logo.png"
        alt="TRANSTU"
        class="mb-3"
        style="height: 72px; width: auto"
      />
      <div class="gold-rule mx-auto mb-3"></div>
      <h1 class="h3 mb-2">Signalement voyageur</h1>
      <p class="text-secondary mb-4">
        Scannez le QR Code présent sur votre support de transport pour déposer un signalement
        rapidement et en toute sécurité.
      </p>
      <p class="small text-secondary mb-4">
        Le suivi des réponses s'effectue via le lien sécurisé envoyé par e-mail lorsque notre équipe
        vous répond.
      </p>
      <a routerLink="/accueil" class="btn btn-transtu">Retour à l'accueil</a>
    </section>
  `,
})
export class HomePage {}
