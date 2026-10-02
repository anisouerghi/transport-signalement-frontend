import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Choix anonyme / authentifié après identification du support.
 * Réutilisé après scan QR et après sélection manuelle.
 */
@Component({
  selector: 'app-identity-choice',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (auth.isAuthenticated()) {
      <div class="identity-choice panel p-4">
        <p class="mb-1">{{ 'identity.greeting' | translate }} <strong>{{ displayName() }}</strong></p>
        <p class="text-secondary small mb-3">{{ 'identity.connectedHint' | translate }}</p>
        <button type="button" class="btn btn-transtu btn-lg w-100" (click)="continue.emit()">
          {{ 'identity.continue' | translate }}
        </button>
      </div>
    } @else {
      <section class="identity-choice panel p-4">
        <h2 class="h5 mb-3">{{ 'identity.title' | translate }}</h2>
        <div class="d-grid gap-2">
          <button type="button" class="choice-card" (click)="anonymousContinue.emit()">
            <span class="choice-card__icon" aria-hidden="true"><i class="bi bi-incognito"></i></span>
            <span>
              <strong class="d-block">{{ 'identity.anonymous' | translate }}</strong>
              <span class="small text-secondary">{{ 'identity.anonymousHint' | translate }}</span>
            </span>
          </button>
          <button type="button" class="choice-card" (click)="goAuth()">
            <span class="choice-card__icon" aria-hidden="true"><i class="bi bi-person-check"></i></span>
            <span>
              <strong class="d-block">{{ 'identity.auth' | translate }}</strong>
              <span class="small text-secondary">{{ 'identity.authHint' | translate }}</span>
            </span>
          </button>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .choice-card {
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        text-align: start;
        background: var(--surface-container-lowest);
        border: 1px solid rgba(194, 198, 212, 0.55);
        border-radius: 0.75rem;
        padding: 1rem 1.05rem;
        min-height: 4.5rem;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(19, 28, 40, 0.08);
        transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
      }
      .choice-card:hover {
        border-color: rgba(11, 82, 168, 0.4);
        background: var(--surface-container-low);
        box-shadow: 0 4px 12px rgba(19, 28, 40, 0.1);
      }
      .choice-card__icon {
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 0.5rem;
        display: grid;
        place-items: center;
        background: var(--surface-container);
        color: var(--primary-container);
        font-size: 1.15rem;
        flex-shrink: 0;
      }
    `,
  ],
})
export class IdentityChoiceComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** URL de retour après connexion / inscription. */
  @Input({ required: true }) returnUrl = '/accueil';
  @Output() continue = new EventEmitter<void>();
  @Output() anonymousContinue = new EventEmitter<void>();

  goAuth(): void {
    void this.router.navigate(['/connexion'], { queryParams: { returnUrl: this.returnUrl } });
  }

  displayName(): string {
    const user = this.auth.currentUser();
    return user?.name?.trim() || user?.email?.split('@')[0] || '';
  }
}
