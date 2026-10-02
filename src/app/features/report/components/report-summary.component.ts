import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ReportType, TransportSupport } from '../models/report.model';

/**
 * Étape 2 : récapitulatif du signalement avant validation.
 */
@Component({
  selector: 'app-report-summary',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-3 p-md-4" aria-labelledby="summary-title">
      <h2 id="summary-title" class="h5 mb-1">{{ 'summary.title' | translate }}</h2>
      <p class="text-secondary small mb-3">{{ 'summary.subtitle' | translate }}</p>

      <dl class="summary-list">
        @if (type) {
          <div class="summary-row">
            <dt>{{ 'summary.type' | translate }}</dt>
            <dd>{{ typeLabel }}</dd>
          </div>
        }
        @if (support) {
          <div class="summary-row">
            <dt>{{ 'summary.support' | translate }}</dt>
            <dd>{{ support.label }}</dd>
          </div>
        }
        <div class="summary-row">
          <dt>{{ 'summary.description' | translate }}</dt>
          <dd class="summary-description">{{ description }}</dd>
        </div>
        @if (name) {
          <div class="summary-row">
            <dt>{{ 'summary.name' | translate }}</dt>
            <dd>{{ name }}</dd>
          </div>
        }
        @if (phone) {
          <div class="summary-row">
            <dt>{{ 'summary.phone' | translate }}</dt>
            <dd>{{ phone }}</dd>
          </div>
        }
        @if (email) {
          <div class="summary-row">
            <dt>{{ 'summary.email' | translate }}</dt>
            <dd>{{ email }}</dd>
          </div>
        }
        <div class="summary-row">
          <dt>{{ 'summary.attachments' | translate }}</dt>
          <dd>
            {{ 'summary.filesCount' | translate: { count: attachmentsCount } }}
          </dd>
        </div>
      </dl>
    </section>
  `,
  styles: [`
    .summary-list {
      margin: 0;
    }
    .summary-row {
      display: grid;
      grid-template-columns: 8.5rem 1fr;
      gap: 0.5rem;
      padding: 0.55rem 0;
      border-bottom: 1px dashed rgba(115, 119, 131, 0.25);
    }
    .summary-row:last-child {
      border-bottom: 0;
    }
    .summary-row dt {
      color: var(--on-surface-variant, #5b6472);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .summary-row dd {
      margin: 0;
      color: var(--on-surface, #131c28);
      font-size: 0.9rem;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .summary-description {
      line-height: 1.5;
    }
  `],
})
export class ReportSummaryComponent {
  @Input() type?: ReportType;
  @Input() typeLabel = '';
  @Input() support?: TransportSupport | null;
  @Input() description = '';
  @Input() name = '';
  @Input() phone = '';
  @Input() email = '';
  @Input() attachmentsCount = 0;
}
