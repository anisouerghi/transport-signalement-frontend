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
        <div class="ref-box mb-3" id="report-ref">{{ state()!.reference }}</div>

        <button type="button" class="btn btn-transtu mb-4" (click)="copyReference()">
          <i class="bi bi-clipboard me-1" aria-hidden="true"></i>
          {{ 'confirmation.copy' | translate }}
        </button>

        <p class="text-secondary small mb-3 px-1">{{ 'confirmation.keepRef' | translate }}</p>

        <div class="email-nudge text-start mb-4 mx-1">
          <p class="mb-2 fw-semibold">{{ 'confirmation.aboutFollowUp' | translate }}</p>
          @if (state()!.email) {
            <p class="small mb-0">
              {{ 'confirmation.emailSent' | translate: { email: state()!.email } }}
            </p>
          } @else {
            <p class="small mb-0">{{ 'confirmation.noEmail' | translate }}</p>
          }
        </div>

        @if (state()!.email) {
          <p class="small text-secondary mb-4 px-1">
            {{ 'confirmation.notifyTo' | translate: { email: state()!.email } }}
          </p>
        }

        <div class="d-grid gap-2 col-md-10 mx-auto">
          @if (auth.isAuthenticated()) {
            <a class="btn btn-transtu" routerLink="/mes-signalements">{{ 'nav.myReports' | translate }}</a>
          }
          @if (state()!.supportUuid) {
            <a class="btn btn-transtu-outline" [routerLink]="['/report', state()!.supportUuid]">
              {{ 'confirmation.backSupport' | translate }}
            </a>
          }
          <a class="btn btn-link" routerLink="/accueil">{{ 'common.backHome' | translate }}</a>
        </div>
      </section>
    }
  `,
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
