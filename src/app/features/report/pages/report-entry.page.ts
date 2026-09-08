import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityChoiceComponent } from '../components/identity-choice.component';

@Component({
  selector: 'app-report-entry-page',
  standalone: true,
  imports: [IdentityChoiceComponent],
  templateUrl: './report-entry.page.html',
})
export class ReportEntryPage {
  private readonly router = inject(Router);

  goToForm(): void {
    void this.router.navigate(['/scan']);
  }
}
