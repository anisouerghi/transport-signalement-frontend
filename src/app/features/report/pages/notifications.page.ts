import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { InboxNotificationService } from '../../../core/services/inbox-notification.service';
import { InboxNotificationItem } from '../../../core/models/inbox-notification.model';

/**
 * Page dédiée à l'affichage des notifications (mobile : ouverte par la cloche du header).
 * Desktop conserve le menu déroulant de la cloche ; cette page reste accessible par URL.
 */
@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [TranslatePipe, RouterLink, DatePipe],
  template: `
    <section class="mb-3 d-flex align-items-center justify-content-between gap-3">
      <h1 class="h3 mb-0">{{ 'header.notifications' | translate }}</h1>
      @if (inbox.hasUnread()) {
        <button type="button" class="notifications-page__mark" (click)="markAllRead()">
          {{ 'header.markAllRead' | translate }}
        </button>
      }
    </section>

    @if (!auth.isAuthenticated()) {
      <section class="panel p-4">
        <p class="mb-4">{{ 'myReports.anonymousHint' | translate }}</p>
        <div class="d-grid gap-2">
          <a routerLink="/inscription" [queryParams]="{ returnUrl: '/notifications' }" class="btn btn-transtu btn-lg">
            {{ 'welcome.createAccount' | translate }}
          </a>
          <a routerLink="/connexion" [queryParams]="{ returnUrl: '/notifications' }" class="btn btn-transtu-outline btn-lg">
            {{ 'welcome.signIn' | translate }}
          </a>
        </div>
      </section>
    } @else if (inbox.items().length === 0) {
      <section class="panel p-4 text-center text-secondary">
        {{ 'header.notificationsEmpty' | translate }}
      </section>
    } @else {
      <ul class="notifications-page__list">
        @for (item of inbox.items(); track item.id) {
          <li>
            <button
              type="button"
              class="notifications-page__item"
              [class.notifications-page__item--unread]="!item.read"
              (click)="openNotification(item)"
            >
              <span class="notifications-page__ref">{{ item.reportReference }}</span>
              <span class="notifications-page__msg">{{ item.message }}</span>
              <span class="notifications-page__date">{{ item.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .notifications-page__mark {
        border: 0;
        background: transparent;
        color: #003b7f;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .notifications-page__list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .notifications-page__item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
        width: 100%;
        padding: 0.75rem 0.85rem;
        border: 1px solid #e5e8f0;
        border-radius: 0.75rem;
        background: #fff;
        text-align: start;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(19, 28, 40, 0.06);
      }
      .notifications-page__item--unread {
        border-color: #cfe0f7;
        background: #f6faff;
      }
      .notifications-page__item:hover {
        background: #eef3f9;
      }
      .notifications-page__ref {
        font-size: 0.75rem;
        font-weight: 700;
        color: #003b7f;
      }
      .notifications-page__msg {
        font-size: 0.85rem;
        color: #131c28;
        line-height: 1.35;
      }
      .notifications-page__date {
        font-size: 0.72rem;
        color: #5a6575;
      }
    `,
  ],
})
export class NotificationsPage {
  readonly auth = inject(AuthService);
  readonly inbox = inject(InboxNotificationService);
  private readonly router = inject(Router);

  openNotification(item: InboxNotificationItem): void {
    this.inbox.markRead(item.id);
    void this.router.navigate(['/report-followup', item.reportUuid]);
  }

  markAllRead(): void {
    this.inbox.markAllRead();
  }
}
