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
    <footer class="public-footer">
      <div class="gold-bar" aria-hidden="true"></div>
      <div class="public-footer__inner">
        <img
          src="assets/images/transtu_logo.png"
          [attr.alt]="'common.logoAlt' | translate"
          class="public-footer__logo"
          width="106"
          height="36"
        />
        <span class="tagline">{{ 'footer.tagline' | translate }}</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .public-footer {
        margin-top: auto;
        background: rgba(248, 249, 255, 0.92);
        color: #131c28;
        font-size: 0.75rem;
        border-top: 0;
        box-shadow: 0 -1px 0 rgba(194, 198, 212, 0.7);
      }
      .public-footer__inner {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 0.85rem 1rem;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.65rem 1rem;
      }
      .public-footer__logo {
        display: block;
        height: 36px;
        width: auto;
        max-width: 100%;
        object-fit: contain;
        flex-shrink: 0;
      }
      .tagline {
        color: #5a6b7d;
        line-height: 1.4;
      }
      @media (max-width: 767.98px) {
        .public-footer {
          margin-bottom: calc(5.25rem + env(safe-area-inset-bottom));
        }
      }
      .gold-bar {
        height: 4px;
        background: linear-gradient(90deg, #006e2f 0 33.33%, #f5bf00 33.33% 66.66%, #0b52a8 66.66% 100%);
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
