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
        <span>{{ msg }}</span>
        <button
          type="button"
          class="btn-close btn-close-white btn-sm"
          [attr.aria-label]="'common.close' | translate"
          (click)="notifications.clear()"
        ></button>
      </div>
    }
    <footer class="public-footer d-none d-md-block">
      <div class="gold-bar" aria-hidden="true"></div>
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
        background: #ffffff;
        color: #142033;
        font-size: 0.85rem;
        border-top: 1px solid #e9ecef;
      }
      .public-footer__inner {
        width: min(720px, 100%);
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .tagline {
        color: #5a6b7d;
      }
      .gold-bar {
        height: 3px;
        background: linear-gradient(90deg, #e8a317, #0b8a3e 55%, #1a3a7a);
      }
      .toast-banner {
        position: sticky;
        bottom: 4.4rem;
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
      @media (min-width: 768px) {
        .toast-banner {
          bottom: 0;
        }
      }
    `,
  ],
})
export class PublicFooterComponent {
  readonly notifications = inject(NotificationService);
}
