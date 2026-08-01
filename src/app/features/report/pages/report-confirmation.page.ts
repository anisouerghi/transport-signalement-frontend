import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationState } from '../models/report.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-report-confirmation-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (!state()) {
      <section class="panel page-state">
        <div class="icon-wrap info"><i class="bi bi-info-circle" aria-hidden="true"></i></div>
        <h1 class="h4">Aucune confirmation disponible</h1>
        <p class="text-secondary mb-4">Déposez d’abord un signalement via un QR Code.</p>
        <a routerLink="/accueil" class="btn btn-transtu">Retour à l’accueil</a>
      </section>
    } @else {
      <section class="panel page-state">
        <div class="icon-wrap success"><i class="bi bi-check2-circle" aria-hidden="true"></i></div>
        <h1 class="h3">Merci pour votre signalement</h1>
        <p class="text-secondary mb-3">
          Votre demande a bien été enregistrée. Conservez la référence ci-dessous pour le suivi.
        </p>

        <p class="small text-secondary mb-1">Référence / code de suivi</p>
        <div class="ref-box mb-3" id="report-ref">{{ state()!.reference }}</div>

        @if (state()!.email) {
          <p class="small mb-4 px-2">
            Les prochaines notifications et réponses vous seront transmises à
            <strong>{{ state()!.email }}</strong>.
          </p>
        } @else {
          <p class="small text-secondary mb-4 px-2">
            Aucune adresse e-mail n’a été renseignée. Conservez précieusement votre référence pour
            consulter le suivi.
          </p>
        }

        <div class="d-grid gap-2 col-md-10 mx-auto">
          <button type="button" class="btn btn-transtu" (click)="copyReference()">
            <i class="bi bi-clipboard me-1" aria-hidden="true"></i>
            Copier la référence
          </button>
          @if (state()!.uuid) {
            <a class="btn btn-transtu-outline" [routerLink]="['/suivi', state()!.uuid]">
              Consulter le suivi
            </a>
          } @else {
            <a class="btn btn-transtu-outline" routerLink="/suivi">Consulter le suivi</a>
          }
          @if (state()!.supportUuid) {
            <a class="btn btn-link" [routerLink]="['/report', state()!.supportUuid]">
              Créer un nouveau signalement
            </a>
          } @else {
            <a class="btn btn-link" routerLink="/accueil">Retour à l’accueil</a>
          }
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
        uuid: fromHistory.uuid,
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
