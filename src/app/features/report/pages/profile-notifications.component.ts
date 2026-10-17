import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PassengerPreferenceService } from '../../../core/services/passenger-preference.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NOTIFICATION_CHANNEL } from '../../../core/models/preference.model';

@Component({
  selector: 'app-profile-notifications',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h2 class="h4 mb-3">{{ 'accountSettings.notificationsTitle' | translate }}</h2>
      @if (loading()) {
        <p class="text-body-secondary mb-0">{{ 'accountSettings.loading' | translate }}</p>
      } @else {
        <div class="d-flex flex-column gap-2">
          <div class="form-check form-switch">
            <input type="checkbox" role="switch" class="form-check-input" id="notif-platform"
              [checked]="has(PLATFORM)" [disabled]="saving()" (change)="toggle(PLATFORM)" />
            <label class="form-check-label" for="notif-platform">{{ 'accountSettings.channelPlatform' | translate }}</label>
          </div>
          <div class="form-check form-switch">
            <input type="checkbox" role="switch" class="form-check-input" id="notif-email"
              [checked]="has(EMAIL)" [disabled]="saving()" (change)="toggle(EMAIL)" />
            <label class="form-check-label" for="notif-email">{{ 'accountSettings.channelEmail' | translate }}</label>
          </div>
          <div class="form-check form-switch">
            <input type="checkbox" role="switch" class="form-check-input" id="notif-sms"
              [checked]="has(SMS)" [disabled]="saving()" (change)="toggle(SMS)" />
            <label class="form-check-label" for="notif-sms">{{ 'accountSettings.channelSms' | translate }}</label>
          </div>
          <div class="form-check form-switch">
            <input type="checkbox" role="switch" class="form-check-input" id="notif-whatsapp"
              [checked]="has(WHATSAPP)" [disabled]="saving()" (change)="toggle(WHATSAPP)" />
            <label class="form-check-label" for="notif-whatsapp">{{ 'accountSettings.channelWhatsapp' | translate }}</label>
          </div>
        </div>
        @if (saving()) {
          <p class="small text-body-secondary mt-2 mb-0">{{ 'accountSettings.saving' | translate }}</p>
        }
      }
    </section>
  `,
})
export class ProfileNotificationsComponent implements OnInit {
  readonly PLATFORM = NOTIFICATION_CHANNEL.PLATFORM;
  readonly EMAIL = NOTIFICATION_CHANNEL.EMAIL;
  readonly SMS = NOTIFICATION_CHANNEL.SMS;
  readonly WHATSAPP = NOTIFICATION_CHANNEL.WHATSAPP;

  private readonly preferences = inject(PassengerPreferenceService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  private readonly local = signal<number[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.preferences.get().subscribe({
      next: (prefs) => {
        this.local.set([...(prefs.notifications ?? [])]);
        this.loading.set(false);
      },
      error: () => {
        this.local.set([]);
        this.loading.set(false);
        this.notifications.error(this.translate.instant('accountSettings.loadError'));
      },
    });
  }

  has(id: number): boolean {
    return this.local().includes(id);
  }

  toggle(id: number): void {
    if (this.saving()) {
      return;
    }
    const previous = [...this.local()];
    const next = previous.includes(id) ? previous.filter((v) => v !== id) : [...previous, id];
    this.local.set(next);
    this.saving.set(true);
    this.preferences.update({ notifications: next }).subscribe({
      next: (prefs) => {
        this.local.set([...(prefs.notifications ?? [])]);
        this.saving.set(false);
        this.notifications.success(this.translate.instant('accountSettings.saved'));
      },
      error: () => {
        this.local.set(previous);
        this.saving.set(false);
        this.notifications.error(this.translate.instant('accountSettings.saveError'));
      },
    });
  }
}
