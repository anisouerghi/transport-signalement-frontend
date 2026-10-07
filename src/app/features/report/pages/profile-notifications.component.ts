import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

const PLATFORM = 1;
const EMAIL = 2;
const SMS = 3;
const WHATSAPP = 4;

@Component({
  selector: 'app-profile-notifications',
  standalone: true,
  imports: [],
  template: `
    <section class="panel p-4">
      <h2 class="h4 mb-3">Préférences de notification</h2>
      <div class="d-flex flex-column gap-2">
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-platform"
            [checked]="has(PLATFORM)" (change)="toggle(PLATFORM)" />
          <label class="form-check-label" for="notif-platform">Plateforme</label>
        </div>
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-email"
            [checked]="has(EMAIL)" (change)="toggle(EMAIL)" />
          <label class="form-check-label" for="notif-email">Email</label>
        </div>
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-sms"
            [checked]="has(SMS)" (change)="toggle(SMS)" />
          <label class="form-check-label" for="notif-sms">SMS</label>
        </div>
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-whatsapp"
            [checked]="has(WHATSAPP)" (change)="toggle(WHATSAPP)" />
          <label class="form-check-label" for="notif-whatsapp">WhatsApp</label>
        </div>
      </div>
    </section>
  `,
})
export class ProfileNotificationsComponent {
  readonly PLATFORM = PLATFORM;
  readonly EMAIL = EMAIL;
  readonly SMS = SMS;
  readonly WHATSAPP = WHATSAPP;

  readonly auth = inject(AuthService);
  private readonly local = signal<number[]>([]);

  constructor() {
    const fromUser = this.auth.currentUser()?.notifications;
    this.local.set(Array.isArray(fromUser) ? [...fromUser] : []);
  }

  has(id: number): boolean {
    return this.local().includes(id);
  }

  toggle(id: number): void {
    const current = this.local();
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
    this.local.set(next);
    if (this.auth.isAuthenticated() && this.auth.currentUser()?.email) {
      this.auth
        .updateProfile({ email: this.auth.currentUser()!.email, notifications: next })
        .subscribe();
    }
  }
}
