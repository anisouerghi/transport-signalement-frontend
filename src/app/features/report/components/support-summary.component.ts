import { Component, Input } from '@angular/core';
import { TransportSupport } from '../models/report.model';

@Component({
  selector: 'app-support-summary',
  standalone: true,
  imports: [],
  template: `
    @if (support) {
      <span class="support-chip">
        <i class="support-chip__icon bi" [class]="getSupportIcon()" aria-hidden="true"></i>
        <span class="support-chip__type">{{ support.supportTypeLabel || support.supportTypeCode || '' }}</span>
        <span class="support-chip__label">{{ support.label }}</span>
      </span>
    }
  `,
  styles: [
    `
    :host {
      display: block;
      margin-bottom: 1rem;
      text-align: center;
    }
    .support-chip {
      flex-direction: column;
      justify-content: center;
      min-width: 7rem;
      padding: 0.65rem 0.9rem;
      text-align: center;
      line-height: 1.2;
    }
    .support-chip__icon {
      font-size: 5.0rem;
      line-height: 1;
    }
    .support-chip__type {
      margin-top: 0.3rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .support-chip__label {
      max-width: 10rem;
      margin-top: 0.15rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.68rem;
      font-weight: 500;
      opacity: 0.8;
    }
    `,
  ],
})
export class SupportSummaryComponent {
  @Input({ required: true }) support!: TransportSupport;

  getSupportIcon(): string {
    const code = (this.support?.supportTypeCode || '').toLowerCase();
    if (code.includes('bus')) {
      return 'bi-bus-front';
    }
    if (code.includes('metro')) {
      return 'bi-train-lightrail-front';
    }
    if (code.includes('station')) {
      return 'bi-geo-alt';
    }
    if (code.includes('train') || code.includes('tgm')) {
      return 'bi-train-front';
    }
    return 'bi-app-indicator';
  }
}
