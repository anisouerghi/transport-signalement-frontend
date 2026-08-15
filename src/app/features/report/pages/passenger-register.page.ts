import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-passenger-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './passenger-register.page.html',
})
export class PassengerRegisterPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly submitting = signal(false);
  readonly returnUrl = signal('/accueil');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.maxLength(150)],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.maxLength(30), Validators.pattern(/^[+0-9\s().-]{0,30}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.returnUrl.set(this.route.snapshot.queryParamMap.get('returnUrl') || '/accueil');
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.returnUrl());
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const raw = this.form.getRawValue();
    this.auth
      .register({
        name: raw.name.trim() || undefined,
        email: raw.email.trim(),
        phoneNumber: raw.phoneNumber.trim() || undefined,
        password: raw.password,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notifications.success(this.translate.instant('auth.registerSuccess'));
          void this.router.navigateByUrl(this.returnUrl());
        },
        error: () => this.submitting.set(false),
      });
  }
}
