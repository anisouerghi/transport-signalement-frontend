import { Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfilePage } from './profile.page';
import { ProfileNotificationsComponent } from './profile-notifications.component';
import { ProfileLanguageComponent } from './profile-language.component';

type AccountTab = 'profile' | 'notifications' | 'language';

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [TranslatePipe, ProfilePage, ProfileNotificationsComponent, ProfileLanguageComponent],
  template: `
    <section class="account-settings">
      <h1 class="h3 mb-3">{{ 'accountSettings.title' | translate }}</h1>
      <div class="account-settings__layout">
        <nav class="account-settings__menu" [attr.aria-label]="'accountSettings.title' | translate">
          <button type="button" class="account-settings__item"
            [class.is-active]="tab() === 'profile'" (click)="tab.set('profile')">
            <i class="bi bi-person" aria-hidden="true"></i>
            {{ 'accountSettings.profile' | translate }}
          </button>
          <button type="button" class="account-settings__item"
            [class.is-active]="tab() === 'notifications'" (click)="tab.set('notifications')">
            <i class="bi bi-bell" aria-hidden="true"></i>
            {{ 'accountSettings.notifications' | translate }}
          </button>
          <button type="button" class="account-settings__item"
            [class.is-active]="tab() === 'language'" (click)="tab.set('language')">
            <i class="bi bi-translate" aria-hidden="true"></i>
            {{ 'accountSettings.language' | translate }}
          </button>
        </nav>

        <div class="account-settings__content">
          @switch (tab()) {
            @case ('profile') { <app-profile-page /> }
            @case ('notifications') { <app-profile-notifications /> }
            @case ('language') { <app-profile-language /> }
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .account-settings__layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 1rem;
      align-items: start;
    }
    .account-settings__menu {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      background: var(--surface-container-low, #f3f6fc);
      border: 1px solid var(--transtu-border, #dde3ee);
      border-radius: 0.85rem;
      padding: 0.6rem;
    }
    .account-settings__item {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.6rem 0.75rem;
      border: 0;
      border-radius: 0.6rem;
      background: transparent;
      color: var(--on-surface-variant, #45474f);
      font-weight: 600;
      font-size: 0.9rem;
      text-align: start;
      cursor: pointer;
    }
    .account-settings__item:hover {
      background: rgba(0, 76, 155, 0.08);
    }
    .account-settings__item.is-active {
      background: var(--primary, #003b7f);
      color: #fff;
    }
    @media (max-width: 640px) {
      .account-settings__layout {
        grid-template-columns: 1fr;
      }
      .account-settings__menu {
        flex-direction: row;
        overflow-x: auto;
      }
      .account-settings__item {
        white-space: nowrap;
      }
    }
  `],
})
export class AccountSettingsPage {
  readonly tab = signal<AccountTab>('profile');
}
