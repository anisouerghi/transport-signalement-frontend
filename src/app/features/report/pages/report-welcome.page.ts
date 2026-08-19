import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { IdentityChoiceComponent } from '../components/identity-choice.component';
import { SupportSummaryComponent } from '../components/support-summary.component';
import { TransportSupport } from '../models/report.model';
import { SupportService } from '../services/support.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Après scan QR : le support est identifié automatiquement, puis choix anonyme / authentifié.
 */
@Component({
  selector: 'app-report-welcome-page',
  standalone: true,
  imports: [SupportSummaryComponent, IdentityChoiceComponent, TranslatePipe, RouterLink],
  templateUrl: './report-welcome.page.html',
  styleUrl: './report-welcome.page.scss',
})
export class ReportWelcomePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supportService = inject(SupportService);
  private readonly translate = inject(TranslateService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly invalidQr = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly support = signal<TransportSupport | null>(null);
  readonly supportUuid = signal('');

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid')?.trim() ?? '';
    this.supportUuid.set(uuid);

    if (!UUID_RE.test(uuid)) {
      this.invalidQr.set(true);
      this.loading.set(false);
      this.errorMessage.set(this.translate.instant('errors.invalidQr'));
      return;
    }

    this.supportService.getByUuid(uuid).subscribe({
      next: (support) => {
        this.support.set(support);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.invalidQr.set(true);
        if (err.status === 404) {
          this.errorMessage.set(this.translate.instant('errors.supportMissing'));
        } else {
          this.errorMessage.set(this.translate.instant('errors.supportLoadFailed'));
        }
      },
    });
  }

  goToForm(): void {
    void this.router.navigate(['/report', this.supportUuid(), 'signaler']);
  }

  formReturnUrl(): string {
    return `/report/${this.supportUuid()}/signaler`;
  }
}
