import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-notifications',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h2 class="h4 mb-0">{{ 'accountSettings.notifications' | translate }}</h2>
      <p class="text-secondary mt-2 mb-0">{{ 'accountSettings.notificationsEmpty' | translate }}</p>
    </section>
  `,
})
export class ProfileNotificationsComponent {}
