import { Component } from '@angular/core';

@Component({
  selector: 'app-email-nudge',
  standalone: true,
  template: `
    <aside class="email-nudge mb-3" role="note">
      <div class="d-flex gap-2">
        <i class="bi bi-envelope-check fs-4 text-warning" aria-hidden="true"></i>
        <div>
          <strong class="d-block mb-1">Pourquoi renseigner votre e-mail ?</strong>
          <p class="mb-0 small text-secondary">
            Vous pouvez effectuer votre signalement de manière anonyme. Toutefois, si vous
            renseignez votre adresse e-mail, vous serez automatiquement informé de l’évolution
            de votre dossier et recevrez la réponse de notre équipe directement par e-mail.
          </p>
        </div>
      </div>
    </aside>
  `,
})
export class EmailNudgeComponent {}
