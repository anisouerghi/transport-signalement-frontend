import { Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-notifications',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h2 class="h4 mb-3">Préférences de notification</h2>
      <div class="d-flex flex-column gap-2">
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-platform" [checked]="platform()" (change)="platform.set(!platform())" />
          <label class="form-check-label" for="notif-platform">Plateforme</label>
        </div>
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-email" [checked]="email()" (change)="email.set(!email())" />
          <label class="form-check-label" for="notif-email">Email</label>
        </div>
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-sms" [checked]="sms()" (change)="sms.set(!sms())" />
          <label class="form-check-label" for="notif-sms">SMS</label>
        </div>
        <div class="form-check form-switch">
          <input type="checkbox" role="switch" class="form-check-input" id="notif-whatsapp" [checked]="whatsapp()" (change)="whatsapp.set(!whatsapp())" />
          <label class="form-check-label" for="notif-whatsapp">WhatsApp</label>
        </div>
      </div>
    </section>
  `,
})
export class ProfileNotificationsComponent {
  readonly platform = signal(false);
  readonly email = signal(false);
  readonly sms = signal(false);
  readonly whatsapp = signal(false);
}
