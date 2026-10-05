import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-report-entry-page',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './report-entry.page.html',
})
export class ReportEntryPage {
  private readonly router = inject(Router);

  goToForm(): void {
    void this.router.navigate(['/signalement/anonyme'], { queryParams: { parcours: 'depot' } });
  }
}
