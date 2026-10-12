import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PublicReportTracking } from '../models/report.model';
import { ReportService } from '../services/report.service';

const LEVELS = [
  { code: 'SATISFAIT', emoji: '😊', key: 'satisfaction.satisfied' },
  { code: 'MOYENNEMENT_SATISFAIT', emoji: '😐', key: 'satisfaction.partial' },
  { code: 'NON_SATISFAIT', emoji: '🙁', key: 'satisfaction.dissatisfied' },
] as const;

/**
 * Avis unique affiché sur le suivi par lien UUID.
 * La recherche par référence ne reçoit pas les indicateurs d'envoi.
 */
@Component({
  selector: 'app-report-satisfaction',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  template: `
    @if (visible()) {
      <section class="avis" [attr.aria-label]="'satisfaction.title' | translate">
        <h2 class="avis__title">{{ 'satisfaction.title' | translate }}</h2>

        @if (justSent()) {
          <p class="avis__thanks" role="status">{{ 'satisfaction.thanks' | translate }}</p>
        }

        @if (report.satisfaction; as saved) {
          <p class="avis__saved">
            <span aria-hidden="true">{{ emoji(saved.level) }}</span>
            {{ levelKey(saved.level) | translate }}
          </p>
          @if (saved.comment) {
            <p class="avis__comment">{{ saved.comment }}</p>
          }
        } @else if (report.satisfactionLoginRequired) {
          <p class="avis__intro">{{ 'satisfaction.intro' | translate }}</p>
          <a class="avis__login" [routerLink]="['/connexion']" [queryParams]="{ returnUrl: returnUrl }">
            {{ 'satisfaction.login' | translate }}
          </a>
        } @else if (report.canSubmitSatisfaction) {
          <p class="avis__intro">{{ 'satisfaction.intro' | translate }}</p>
          <div class="avis__choices" role="radiogroup" [attr.aria-label]="'satisfaction.groupLabel' | translate">
            @for (choice of levels; track choice.code) {
              <button
                type="button"
                class="avis__choice"
                role="radio"
                [class.avis__choice--on]="selected() === choice.code"
                [attr.aria-checked]="selected() === choice.code"
                (click)="select(choice.code)"
              >
                <span class="avis__emoji" aria-hidden="true">{{ choice.emoji }}</span>
                <span>{{ choice.key | translate }}</span>
              </button>
            }
          </div>

          @if (selected()) {
            <label class="avis__label" for="satisfaction-comment">{{ 'satisfaction.commentLabel' | translate }}</label>
            <textarea
              id="satisfaction-comment"
              class="avis__field"
              rows="3"
              maxlength="1000"
              [value]="comment()"
              [attr.placeholder]="'satisfaction.commentPlaceholder' | translate"
              (input)="onComment($event)"
            ></textarea>
            @if (error()) {
              <p class="avis__error" role="alert">{{ error() | translate }}</p>
            }
            <div class="avis__actions">
              <button type="button" class="avis__send" [disabled]="saving()" (click)="submit()">
                {{ 'satisfaction.submit' | translate }}
              </button>
              <button type="button" class="avis__cancel" [disabled]="saving()" (click)="cancel()">
                {{ 'satisfaction.cancel' | translate }}
              </button>
            </div>
          }
        }
      </section>
    }
  `,
  styles: `
    .avis {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 0.75rem;
      background: #fff;
      box-shadow: 0 1px 2px rgba(19, 28, 40, 0.06);
    }
    .avis__title { margin: 0 0 0.5rem; font-size: 1.05rem; color: #003b7f; }
    .avis__intro, .avis__comment, .avis__thanks { margin: 0 0 0.75rem; line-height: 1.45; }
    .avis__thanks { color: #006e2f; font-weight: 700; }
    .avis__saved { margin: 0; font-weight: 700; }
    .avis__choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
    .avis__choice {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.25rem; min-height: 4.5rem; padding: 0.4rem; border-radius: 0.65rem;
      border: 1px solid #d5deef; background: #f8f9ff; color: #131c28; font-weight: 700;
      font-size: 0.75rem; text-align: center; cursor: pointer;
    }
    .avis__choice--on { border-color: #003b7f; background: #e7efff; color: #003b7f; }
    .avis__emoji { font-size: 1.4rem; line-height: 1; }
    .avis__label { display: block; margin: 0.85rem 0 0.35rem; font-weight: 700; font-size: 0.9rem; }
    .avis__field {
      width: 100%; box-sizing: border-box; border: 1px solid #d5deef; border-radius: 0.55rem;
      padding: 0.6rem 0.7rem; font: inherit; resize: vertical;
    }
    .avis__error { color: #93000a; margin: 0.5rem 0 0; }
    .avis__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
    .avis__send, .avis__cancel {
      min-height: 2.75rem; padding: 0.4rem 0.9rem; border-radius: 0.55rem; font-weight: 700; cursor: pointer;
    }
    .avis__send { border: 0; background: #003b7f; color: #fff; }
    .avis__send:disabled, .avis__cancel:disabled { opacity: 0.6; }
    .avis__cancel { border: 1px solid #003b7f; background: #fff; color: #003b7f; }
    .avis__login { font-weight: 700; color: #003b7f; }
    @media (max-width: 420px) {
      .avis__choices { grid-template-columns: 1fr; }
      .avis__choice { flex-direction: row; justify-content: flex-start; min-height: 2.75rem; }
      .avis__actions { flex-direction: column; }
      .avis__send, .avis__cancel { width: 100%; }
    }
  `,
})
export class ReportSatisfactionComponent {
  private readonly reports = inject(ReportService);

  @Input({ required: true }) report!: PublicReportTracking;
  @Input() returnUrl = '/accueil';
  @Output() reportChange = new EventEmitter<PublicReportTracking>();

  readonly levels = LEVELS;
  readonly selected = signal<string | null>(null);
  readonly comment = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly justSent = signal(false);

  visible(): boolean {
    return !!(
      this.report?.satisfaction
      || this.report?.canSubmitSatisfaction
      || this.report?.satisfactionLoginRequired
    );
  }

  select(code: string): void {
    this.selected.set(code);
    this.error.set(null);
  }

  onComment(event: Event): void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  cancel(): void {
    this.selected.set(null);
    this.comment.set('');
    this.error.set(null);
  }

  submit(): void {
    const level = this.selected();
    if (!level || this.saving() || !this.report?.uuid) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.reports.submitSatisfaction(this.report.uuid, level, this.comment()).subscribe({
      next: (satisfaction) => {
        this.saving.set(false);
        this.justSent.set(true);
        this.reportChange.emit({
          ...this.report,
          satisfaction,
          canSubmitSatisfaction: false,
          satisfactionLoginRequired: false,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const code = err.error?.errorCode as string | undefined;
        this.error.set(code === 'SATISFACTION_ALREADY_EXISTS' ? 'satisfaction.already' : 'satisfaction.error');
      },
    });
  }

  emoji(level: string): string {
    return LEVELS.find((item) => item.code === level)?.emoji ?? '';
  }

  levelKey(level: string): string {
    return LEVELS.find((item) => item.code === level)?.key ?? 'satisfaction.satisfied';
  }
}
