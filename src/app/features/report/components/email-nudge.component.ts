import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-email-nudge',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <aside class="email-nudge mb-3" role="note">
      <div class="d-flex gap-2">
        <i class="bi bi-envelope-check fs-4 text-warning" aria-hidden="true"></i>
        <div>
          <strong class="d-block mb-1">{{ 'emailNudge.title' | translate }}</strong>
          <p class="mb-0 small text-secondary">{{ 'emailNudge.body' | translate }}</p>
        </div>
      </div>
    </aside>
  `,
})
export class EmailNudgeComponent {}
