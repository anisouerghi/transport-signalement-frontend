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
      <a routerLink="/suivi" class="btn btn-transtu">Suivre un signalement existant</a>
    </section>
  `,
})
export class HomePage {}
