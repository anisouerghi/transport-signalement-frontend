import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfirmationState } from '../models/report.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-report-confirmation-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <!-- Stepper -->
    <div class="stepper-container mb-4">
      <div class="stepper">
        <div class="step completed">
          <div class="step__icon"><i class="bi bi-check-lg"></i></div>
          <div class="step__label">Type</div>
        </div>
        <div class="step-line completed"></div>
        <div class="step completed">
          <div class="step__icon"><i class="bi bi-check-lg"></i></div>
          <div class="step__label">Détails</div>
        </div>
        <div class="step-line completed"></div>
        <div class="step active">
          <div class="step__icon">3</div>
          <div class="step__label">Succès</div>
        </div>
      </div>
    </div>

    @if (!state()) {
      <section class="panel page-state">
        <div class="icon-wrap info"><i class="bi bi-info-circle" aria-hidden="true"></i></div>
        <h1 class="h4">{{ 'confirmation.emptyTitle' | translate }}</h1>
        <p class="text-secondary mb-4">{{ 'confirmation.emptyBody' | translate }}</p>
        <a routerLink="/accueil" class="btn btn-transtu">{{ 'common.backHome' | translate }}</a>
      </section>
    } @else {
      <section class="panel page-state">
        <div class="icon-wrap success"><i class="bi bi-check2-circle" aria-hidden="true"></i></div>
        <h1 class="h3">{{ 'confirmation.title' | translate }}</h1>

        <p class="small text-secondary mb-1 mt-4">{{ 'common.reference' | translate }}</p>
        <div class="ref-box reference-row mb-4" id="report-ref">
          <span>{{ state()!.reference }}</span>
          <i
            class="copy-reference"
            (click)="copyReference()"
            (keydown.enter)="copyReference()"
            (keydown.space)="copyReference()"
            role="button"
            tabindex="0"
            [attr.aria-label]="'confirmation.copy' | translate"
            [attr.title]="'confirmation.copy' | translate"
          >
            <span class="bi bi-clipboard" aria-hidden="true"></span>
          </i>
        </div>

        <p class="text-secondary small mb-3 px-1">{{ 'confirmation.keepRef' | translate }}</p>

        @if (state()!.email) {
          <p class="small text-secondary mb-4 px-1">
            {{ 'confirmation.notifyTo' | translate: { email: state()!.email } }}
          </p>
        }

        <div class="d-grid gap-2 col-md-10 mx-auto">
          @if (auth.isAuthenticated()) {
            <a class="btn btn-transtu" routerLink="/mes-signalements">{{ 'nav.myReports' | translate }}</a>
          }
          <a class="btn confirmation-home-button" routerLink="/accueil">
            {{ 'common.backHome' | translate }}
          </a>
        </div>
      </section>
    }
  `,
  styles: [`
    .reference-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
    }
    .copy-reference {
      width: 1.5rem;
      height: 1.5rem;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      padding: 0;
      border: 0;
      background: transparent;
      color: #6c757d;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .copy-reference:hover,
    .copy-reference:focus-visible {
      color: #495057;
      outline: 2px solid rgba(108, 117, 125, 0.3);
      outline-offset: 2px;
    }
    .confirmation-home-button {
      background: #fff;
      border: 1px solid var(--transtu-green);
      color: var(--transtu-green);
      font-weight: 600;
    }
    .confirmation-home-button:hover,
    .confirmation-home-button:focus-visible {
      background: var(--transtu-green);
      border-color: var(--transtu-green);
      color: #fff;
    }
    .stepper-container {
      background: #ffffff;
      padding: 1rem;
      border-radius: 0.85rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 500px;
      margin: 0 auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      position: relative;
      z-index: 1;
    }
    .step__icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #e9ecef;
      color: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }
    .step__label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6c757d;
      text-align: center;
      white-space: nowrap;
    }
    .step.completed .step__icon {
      background: #0b8a3e;
      color: #fff;
    }
    .step.completed .step__label {
      color: #0b8a3e;
    }
    .step.active .step__icon {
      background: #0b8a3e;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(11, 138, 62, 0.25);
    }
    .step.active .step__label {
      color: #0b8a3e;
      font-weight: 700;
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: #e9ecef;
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
    }
    .step-line.completed {
      background: #0b8a3e;
    }
  `]
})
export class ReportConfirmationPage implements OnInit {
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  readonly auth = inject(AuthService);

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
      this.notifications.success(this.translate.instant('confirmation.copied'));
    } catch {
      this.notifications.error(this.translate.instant('confirmation.copyFailed'));
    }
  }
}
