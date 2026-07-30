import { Component, Input } from '@angular/core';
import { TransportSupport } from '../models/report.model';

@Component({
  selector: 'app-support-summary',
  standalone: true,
  template: `
    @if (support) {
      <section class="panel p-3 p-md-4 mb-3" aria-labelledby="support-title">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <h2 id="support-title" class="h5 mb-0">Support concerné</h2>
          <span class="support-chip">
            <i class="bi bi-bus-front" aria-hidden="true"></i>
            {{ support.supportTypeLabel || support.supportTypeCode || 'Support' }}
          </span>
        </div>
        <div class="gold-rule mb-3"></div>
        <dl class="row mb-0 gy-2">
          <dt class="col-4 text-secondary">Référence</dt>
          <dd class="col-8 mb-0 fw-semibold">{{ support.reference }}</dd>
          <dt class="col-4 text-secondary">Libellé</dt>
          <dd class="col-8 mb-0 fw-semibold">{{ support.label }}</dd>
        </dl>
      </section>
    }
  `,
})
export class SupportSummaryComponent {
  @Input({ required: true }) support!: TransportSupport;
}
