import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { SupportSummaryComponent } from '../components/support-summary.component';
import { TransportSupport } from '../models/report.model';
import { SupportService } from '../services/support.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Première étape après scan QR : présentation du service + choix anonyme / authentifié.
 * L'UUID du support est conservé dans l'URL pour tout le parcours.
 */
@Component({
  selector: 'app-report-welcome-page',
  standalone: true,
  imports: [SupportSummaryComponent, TranslatePipe],
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
  readonly showProfile = signal(false);

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

  goLogin(): void {
    void this.router.navigate(['/connexion'], {
      queryParams: { returnUrl: `/report/${this.supportUuid()}` },
    });
  }

  goRegister(): void {
    void this.router.navigate(['/inscription'], {
      queryParams: { returnUrl: `/report/${this.supportUuid()}` },
    });
  }

  goTracking(): void {
    // Le suivi détaillé nécessite le lien sécurisé reçu par e-mail (UUID).
    void this.router.navigate(['/suivi']);
  }

  toggleProfile(): void {
    this.showProfile.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
    this.showProfile.set(false);
  }

  displayName(): string {
    const user = this.auth.currentUser();
    if (!user?.name?.trim()) {
      return user?.email?.split('@')[0] ?? this.translate.instant('common.traveler');
    }
    return user.name;
  }
}
