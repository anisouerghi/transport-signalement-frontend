import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../../core/config/config.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PassengerOtpPendingResponse } from '../../../core/models/auth.model';
import { GoogleSignInButtonComponent } from '../components/google-sign-in-button.component';
import { OtpInputComponent } from '../components/otp-input.component';
import { TurnstileWidgetComponent } from '../components/turnstile-widget.component';

type LoginStep = 'credentials' | 'otp';

@Component({
  selector: 'app-passenger-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    GoogleSignInButtonComponent,
    OtpInputComponent,
    TurnstileWidgetComponent,
  ],
  templateUrl: './passenger-login.page.html',
})
export class PassengerLoginPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly config = inject(ConfigService);

  @ViewChild(TurnstileWidgetComponent) private turnstileWidget?: TurnstileWidgetComponent;

  readonly submitting = signal(false);
  readonly resending = signal(false);
  readonly returnUrl = signal('/accueil');
  readonly step = signal<LoginStep>('credentials');
  readonly otpPending = signal<PassengerOtpPendingResponse | null>(null);
  readonly resendCountdown = signal(0);
  readonly turnstileToken = signal<string | null>(null);

  private resendTimer: ReturnType<typeof setInterval> | null = null;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    this.returnUrl.set(this.route.snapshot.queryParamMap.get('returnUrl') || '/accueil');
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.returnUrl());
    }
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  onTurnstileToken(token: string | null): void {
    this.turnstileToken.set(token);
  }

  turnstileBlocksSubmit(): boolean {
    return this.config.cloudflareEnabled && !!this.config.cloudflareSiteKey && !this.turnstileToken();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.turnstileBlocksSubmit()) {
      this.notifications.error(this.translate.instant('turnstile.required'));
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    const token = this.turnstileToken();
    this.auth
      .login({
        email: email.trim(),
        password,
        ...(token ? { turnstileToken: token } : {}),
      })
      .subscribe({
        next: (outcome) => {
          this.submitting.set(false);
          if (outcome.kind === 'otp') {
            this.otpPending.set(outcome.pending);
            this.step.set('otp');
            this.otpForm.reset();
            this.startResendCountdown(outcome.pending.resendDelaySeconds);
            if (outcome.pending.emailSent === false) {
              this.notifications.error(this.translate.instant('auth.otpEmailFailed'));
            } else {
              this.notifications.info(
                this.translate.instant('auth.otpSent', {
                  email: outcome.pending.maskedEmail ?? email.trim(),
                }),
              );
            }
            return;
          }
          this.notifications.success(this.translate.instant('auth.loginSuccess'));
          void this.router.navigateByUrl(this.returnUrl());
        },
        error: () => {
          this.submitting.set(false);
          this.turnstileToken.set(null);
          this.turnstileWidget?.reset();
        },
      });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    const pending = this.otpPending();
    if (!pending) {
      return;
    }
    this.submitting.set(true);
    const { otp } = this.otpForm.getRawValue();
    this.auth.verifyOtp(pending.otpTransactionId, otp).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success(this.translate.instant('auth.loginSuccess'));
        void this.router.navigateByUrl(this.returnUrl());
      },
      error: () => this.submitting.set(false),
    });
  }

  resendOtp(): void {
    if (this.resendCountdown() > 0 || this.resending()) {
      return;
    }
    const pending = this.otpPending();
    if (!pending) {
      return;
    }
    this.resending.set(true);
    this.auth.resendOtp(pending.otpTransactionId).subscribe({
      next: (updated) => {
        this.resending.set(false);
        this.otpPending.set(updated);
        this.startResendCountdown(updated.resendDelaySeconds);
        this.notifications.success(this.translate.instant('auth.otpResent'));
      },
      error: () => this.resending.set(false),
    });
  }

  backToLogin(): void {
    this.clearResendTimer();
    this.step.set('credentials');
    this.otpPending.set(null);
    this.otpForm.reset();
    this.turnstileToken.set(null);
  }

  private startResendCountdown(seconds: number): void {
    this.clearResendTimer();
    this.resendCountdown.set(seconds);
    this.resendTimer = setInterval(() => {
      const next = this.resendCountdown() - 1;
      if (next <= 0) {
        this.resendCountdown.set(0);
        this.clearResendTimer();
        return;
      }
      this.resendCountdown.set(next);
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
