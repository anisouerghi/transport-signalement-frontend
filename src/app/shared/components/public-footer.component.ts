import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  template: `
    @if (notifications.message(); as msg) {
      <div
        class="toast-banner"
        [class.toast-banner--error]="notifications.type() === 'error'"
        [class.toast-banner--success]="notifications.type() === 'success'"
        role="status"
        aria-live="polite"
      >
        <span>{{ msg }}</span>
        <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Fermer" (click)="notifications.clear()"></button>
      </div>
    }
    <footer class="public-footer">
      <div class="public-footer__inner">
        <strong>TRANSTU</strong>
        <span>Société des Transports de Tunis — Signalement voyageur</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .public-footer {
        margin-top: auto;
        background: #0f2758;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.85rem;
      }
      .public-footer__inner {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .toast-banner {
        position: sticky;
        bottom: 0;
        z-index: 20;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        background: #1a3a7a;
        color: #fff;
      }
      .toast-banner--error {
        background: #b42318;
      }
      .toast-banner--success {
        background: #0b8a3e;
      }
    `,
  ],
})
export class PublicFooterComponent {
  readonly notifications = inject(NotificationService);
}
