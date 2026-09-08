import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="panel p-4">
      <h1 class="h3 mb-4">{{ 'profile.title' | translate }}</h1>

      <dl class="row mb-0">
        <dt class="col-sm-4">{{ 'profile.name' | translate }}</dt>
        <dd class="col-sm-8">{{ auth.currentUser()?.name || '-' }}</dd>

        <dt class="col-sm-4">{{ 'common.email' | translate }}</dt>
        <dd class="col-sm-8">{{ auth.currentUser()?.email }}</dd>

        <dt class="col-sm-4">{{ 'common.phone' | translate }}</dt>
        <dd class="col-sm-8">{{ auth.currentUser()?.phoneNumber || '-' }}</dd>
      </dl>
    </section>
  `,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
}