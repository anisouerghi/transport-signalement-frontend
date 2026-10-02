import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (notifications.message(); as msg) {
      <div
        class="toast-banner"
        [class.toast-banner--error]="notifications.type() === 'error'"
        [class.toast-banner--success]="notifications.type() === 'success'"
        role="status"
        aria-live="polite"
      >
        <span class="material-symbols-outlined toast-banner__icon" aria-hidden="true">
          @switch (notifications.type()) {
            @case ('error') {
              error
            }
            @case ('success') {
              check_circle
            }
            @default {
              info
            }
          }
        </span>
        <span class="toast-banner__msg">{{ msg }}</span>
        <button
          type="button"
          class="btn-close btn-close-white btn-sm"
          [attr.aria-label]="'common.close' | translate"
          (click)="notifications.clear()"
        ></button>
      </div>
    }
    <footer class="public-footer d-none d-md-block">
      <div class="brand-ribbon" aria-hidden="true">
        <span class="brand-ribbon__green"></span>
        <span class="brand-ribbon__gold"></span>
        <span class="brand-ribbon__blue"></span>
      </div>
      <div class="public-footer__inner">
        <strong>{{ 'common.brand' | translate }}</strong>
        <span class="tagline">{{ 'footer.tagline' | translate }}</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .public-footer {
        margin-top: auto;
        background: var(--surface-container-lowest);
        color: var(--on-surface);
        font-size: 0.85rem;
        box-shadow: 0 -2px 8px rgba(27, 36, 48, 0.05);
      }
      .public-footer__inner {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .public-footer__inner strong {
        color: var(--primary);
        font-weight: 700;
      }
      .tagline {
        color: var(--on-surface-variant);
      }
      .toast-banner {
        position: sticky;
        bottom: calc(4.75rem + env(safe-area-inset-bottom));
        z-index: 60;
        width: min(720px, calc(100% - 2rem));
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        border-radius: 0.75rem;
        background: var(--primary);
        color: var(--on-primary);
        box-shadow: 0 8px 24px rgba(19, 28, 40, 0.25);
      }
      .toast-banner__icon {
        font-size: 1.35rem;
        flex-shrink: 0;
      }
      .toast-banner__msg {
        flex: 1;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .toast-banner--error {
        background: var(--error);
        color: var(--on-error);
      }
      .toast-banner--success {
        background: var(--secondary);
        color: var(--on-secondary);
      }
      @media (min-width: 768px) {
        .toast-banner {
          bottom: 1rem;
        }
      }
    `,
  ],
})
export class PublicFooterComponent {
  readonly notifications = inject(NotificationService);
}
