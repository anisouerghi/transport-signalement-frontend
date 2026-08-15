import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationState } from '../models/report.model';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Confirmation après création : référence informative uniquement.
 * Le suivi des réponses passe par le lien sécurisé envoyé par e-mail.
 */
@Component({
  selector: 'app-report-confirmation-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (!state()) {
      <section class="panel page-state">
        <div class="icon-wrap info"><i class="bi bi-info-circle" aria-hidden="true"></i></div>
        <h1 class="h4">Aucune confirmation disponible</h1>
        <p class="text-secondary mb-4">Déposez d'abord un signalement via un QR Code.</p>
        <a routerLink="/accueil" class="btn btn-transtu">Retour à l'accueil</a>
      </section>
    } @else {
      <section class="panel page-state">
        <div class="icon-wrap success"><i class="bi bi-check2-circle" aria-hidden="true"></i></div>
        <h1 class="h3">Votre signalement a bien été enregistré</h1>

        <p class="small text-secondary mb-1 mt-4">Référence</p>
        <div class="ref-box mb-3" id="report-ref">{{ state()!.reference }}</div>

        <button type="button" class="btn btn-transtu mb-4" (click)="copyReference()">
          <i class="bi bi-clipboard me-1" aria-hidden="true"></i>
          Copier la référence
        </button>

        <p class="text-secondary small mb-3 px-1">
          Conservez cette référence pour vos échanges avec TRANSTU.
        </p>

        <div class="email-nudge text-start mb-4 mx-1">
          <p class="mb-2 fw-semibold">À propos du suivi</p>
          @if (state()!.email) {
            <p class="small mb-0">
              Un <strong>lien de suivi sécurisé</strong> a été envoyé à
              <strong>{{ state()!.email }}</strong> (vérifiez aussi les indésirables).
              Un nouvel e-mail partira lorsque notre équipe vous répondra.
            </p>
          } @else {
            <p class="small mb-0">
              Aucun e-mail n'est associé à ce signalement. Conservez la référence pour vos
              échanges avec TRANSTU.
            </p>
          }
        </div>

        @if (state()!.email) {
          <p class="small text-secondary mb-4 px-1">
            Les notifications seront envoyées à <strong>{{ state()!.email }}</strong>.
          </p>
        }

        <div class="d-grid gap-2 col-md-10 mx-auto">
          @if (state()!.supportUuid) {
            <a class="btn btn-transtu-outline" [routerLink]="['/report', state()!.supportUuid]">
              Retour à l'accueil du support
            </a>
          }
          <a class="btn btn-link" routerLink="/accueil">Retour à l'accueil</a>
        </div>
      </section>
    }
  `,
})
export class ReportConfirmationPage implements OnInit {
  private readonly notifications = inject(NotificationService);

  readonly state = signal<ConfirmationState | null>(null);

  ngOnInit(): void {
    const fromHistory = history.state as ConfirmationState | null;
    if (fromHistory?.reference) {
      this.state.set({
        reference: fromHistory.reference,
        email: fromHistory.email,
        supportUuid: fromHistory.supportUuid,
      });
    }
  }

  async copyReference(): Promise<void> {
    const ref = this.state()?.reference;
    if (!ref) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ref);
      this.notifications.success('Référence copiée dans le presse-papiers.');
    } catch {
      this.notifications.error(
        'Impossible de copier automatiquement. Sélectionnez la référence manuellement.',
      );
    }
  }
}
