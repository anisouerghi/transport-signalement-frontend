import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IdentityChoiceComponent } from '../components/identity-choice.component';

@Component({
  selector: 'app-report-entry-page',
  standalone: true,
  imports: [IdentityChoiceComponent],
  templateUrl: './report-entry.page.html',
})
export class ReportEntryPage implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly redirecting = signal(false);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.redirecting.set(true);
      void this.router.navigate(['/signalement/anonyme'], {
        queryParamsHandling: 'preserve',
      });
    }
  }

  goToForm(): void {
    void this.router.navigate(['/signalement/anonyme'], {
      queryParamsHandling: 'preserve',
    });
  }

  goToAnonymousForm(): void {
    void this.router.navigate(['/signalement/anonyme'], {
      queryParamsHandling: 'preserve',
    });
  }
}
