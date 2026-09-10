import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="panel p-4">
      <div class="d-flex align-items-center justify-content-between gap-3 mb-4">
        <h1 class="h3 mb-0">{{ 'profile.title' | translate }}</h1>
        @if (!editing()) {
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            [attr.aria-label]="'profile.edit' | translate"
            [title]="'profile.edit' | translate"
            (click)="startEditing()"
          >
            <i class="bi bi-pencil-square" aria-hidden="true"></i>
          </button>
        }
      </div>

      @if (editing()) {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="mb-3">
            <label class="form-label fw-semibold" for="profile-name">{{ 'profile.name' | translate }}</label>
            <input id="profile-name" type="text" class="form-control" formControlName="name"
              [class.is-invalid]="form.controls.name.touched && form.controls.name.invalid" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
              <div class="invalid-feedback">{{ 'profile.nameRequired' | translate }}</div>
            }
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold" for="profile-email">{{ 'common.email' | translate }}</label>
            <input id="profile-email" type="email" class="form-control" formControlName="email"
              autocomplete="email"
              [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <div class="invalid-feedback">{{ 'profile.emailInvalid' | translate }}</div>
            }
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold" for="profile-phone">{{ 'common.phone' | translate }}</label>
            <input id="profile-phone" type="tel" class="form-control" formControlName="phoneNumber" autocomplete="tel" />
          </div>

          <button
            type="button"
            class="btn btn-link p-0 mb-3"
            [attr.aria-expanded]="passwordFields()"
            aria-controls="password-fields"
            (click)="togglePasswordFields()"
          >
            <i
              class="bi"
              [class.bi-chevron-up]="passwordFields()"
              [class.bi-chevron-down]="!passwordFields()"
              aria-hidden="true"
            ></i>
            {{ 'profile.changePassword' | translate }}
          </button>

          @if (passwordFields()) {
            <div id="password-fields" class="password-fields mb-3">
              <div class="mb-3">
                <label class="form-label fw-semibold" for="profile-current-password">{{ 'profile.currentPassword' | translate }}</label>
                <input id="profile-current-password" type="password" class="form-control"
                  formControlName="currentPassword" autocomplete="current-password"
                  [class.is-invalid]="form.controls.currentPassword.touched && form.controls.currentPassword.invalid" />
                @if (form.controls.currentPassword.touched && form.controls.currentPassword.invalid) {
                  <div class="invalid-feedback">{{ 'profile.passwordRequired' | translate }}</div>
                }
              </div>
              <div>
                <label class="form-label fw-semibold" for="profile-password">{{ 'profile.newPassword' | translate }}</label>
                <input id="profile-password" type="password" class="form-control"
                  formControlName="password" autocomplete="new-password"
                  [class.is-invalid]="form.controls.password.touched && form.controls.password.invalid" />
                @if (form.controls.password.touched && form.controls.password.invalid) {
                  <div class="invalid-feedback">{{ 'profile.passwordMin' | translate }}</div>
                }
              </div>
            </div>
          }

          <div class="d-flex gap-2 mt-4">
            <button type="submit" class="btn btn-transtu" [disabled]="submitting()">
              {{ submitting() ? ('profile.submitting' | translate) : ('profile.save' | translate) }}
            </button>
            <button type="button" class="btn btn-outline-secondary" (click)="cancelEditing()">
              {{ 'common.cancel' | translate }}
            </button>
          </div>
        </form>
      } @else {
        <dl class="row mb-0">
          <dt class="col-sm-4">{{ 'profile.name' | translate }}</dt>
          <dd class="col-sm-8">{{ auth.currentUser()?.name || '-' }}</dd>
          <dt class="col-sm-4">{{ 'common.email' | translate }}</dt>
          <dd class="col-sm-8">{{ auth.currentUser()?.email }}</dd>
          <dt class="col-sm-4">{{ 'common.phone' | translate }}</dt>
          <dd class="col-sm-8">{{ auth.currentUser()?.phoneNumber || '-' }}</dd>
        </dl>
      }
    </section>
  `,
  styles: [`
    .password-fields {
      padding: 1rem;
      border: 1px solid var(--transtu-border);
      border-radius: 0.75rem;
      background: var(--transtu-surface);
    }
  `],
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  readonly editing = signal(false);
  readonly passwordFields = signal(false);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    currentPassword: [''],
    password: ['', [Validators.minLength(8)]],
  });

  startEditing(): void {
    const user = this.auth.currentUser();
    this.form.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      currentPassword: '',
      password: '',
    });
    this.resetPasswordValidators();
    this.passwordFields.set(false);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.passwordFields.set(false);
    this.form.reset();
    this.resetPasswordValidators();
  }

  togglePasswordFields(): void {
    if (this.passwordFields()) {
      this.passwordFields.set(false);
      this.form.controls.currentPassword.reset('');
      this.form.controls.password.reset('');
      this.resetPasswordValidators();
      return;
    }

    this.passwordFields.set(true);
    this.form.controls.currentPassword.setValidators([Validators.required]);
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.currentPassword.updateValueAndValidity();
    this.form.controls.password.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const request = {
      name: values.name.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim() || undefined,
      ...(this.passwordFields()
        ? { currentPassword: values.currentPassword, password: values.password }
        : {}),
    };
    this.submitting.set(true);
    this.auth.updateProfile(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.editing.set(false);
        this.passwordFields.set(false);
        this.notifications.success(this.translate.instant('profile.updated'));
      },
      error: () => this.submitting.set(false),
    });
  }

  private resetPasswordValidators(): void {
    this.form.controls.currentPassword.clearValidators();
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.controls.currentPassword.updateValueAndValidity();
    this.form.controls.password.updateValueAndValidity();
  }
}
