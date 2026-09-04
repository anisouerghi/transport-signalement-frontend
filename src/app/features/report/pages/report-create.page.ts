import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmailNudgeComponent } from '../components/email-nudge.component';
import { AttachmentPickerComponent } from '../components/attachment-picker.component';
import { SupportSummaryComponent } from '../components/support-summary.component';
import {
  ReportRequest,
  ReportType,
  TransportSupport,
} from '../models/report.model';
import { ReportService } from '../services/report.service';
import { ReportTypeService } from '../services/report-type.service';
import { SupportService } from '../services/support.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-report-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SupportSummaryComponent,
    EmailNudgeComponent,
    AttachmentPickerComponent,
    TranslatePipe,
  ],
  templateUrl: './report-create.page.html',
  styles: [`
    .stepper-container {
      background: #ffffff;
      padding: 1rem;
      border-radius: 0.85rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 500px;
      margin: 0 auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      position: relative;
      z-index: 1;
    }
    .step__icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #e9ecef;
      color: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }
    .step__label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6c757d;
      text-align: center;
      white-space: nowrap;
    }
    .step.completed .step__icon {
      background: #0b8a3e;
      color: #fff;
    }
    .step.completed .step__label {
      color: #0b8a3e;
    }
    .step.active .step__icon {
      background: #e8a317;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(232, 163, 23, 0.25);
    }
    .step.active .step__label {
      color: #142033;
      font-weight: 700;
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: #e9ecef;
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
    }
    .step-line.completed {
      background: #0b8a3e;
    }
  `]
})
export class ReportCreatePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly supportService = inject(SupportService);
  private readonly reportTypeService = inject(ReportTypeService);
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly invalidQr = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly support = signal<TransportSupport | null>(null);
  readonly reportTypes = signal<ReportType[]>([]);
  readonly supportUuid = signal('');
  readonly fromDirect = signal(false);
  readonly selectedFiles = signal<File[]>([]);

  readonly form = this.fb.nonNullable.group({
    reportTypeId: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    name: ['', Validators.maxLength(150)],
    phoneNumber: ['', [Validators.maxLength(30), Validators.pattern(/^[+0-9\s().-]{0,30}$/)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid')?.trim() ?? '';
    this.supportUuid.set(uuid);
    this.fromDirect.set(this.route.snapshot.queryParamMap.get('source') === 'direct');

    if (!UUID_RE.test(uuid)) {
      this.invalidQr.set(true);
      this.loading.set(false);
      this.errorMessage.set(this.translate.instant('errors.invalidQr'));
      return;
    }

    forkJoin({
      support: this.supportService.getByUuid(uuid),
      types: this.reportTypeService.getActive(),
    }).subscribe({
      next: ({ support, types }) => {
        this.support.set(support);
        this.reportTypes.set(types);
        if (types.length > 0) {
          this.form.controls.reportTypeId.setValue(String(types[0].reportTypeId));
        }
        this.prefillFromSession();
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

  onAttachmentsChange(files: File[]): void {
    this.selectedFiles.set(files);
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || !this.support()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ReportRequest = {
      supportUuid: this.supportUuid(),
      reportTypeId: Number(raw.reportTypeId),
      description: raw.description.trim(),
      passenger: {
        name: raw.name.trim() || undefined,
        email: raw.email.trim() || undefined,
        phoneNumber: raw.phoneNumber.trim() || undefined,
      },
    };

    this.submitting.set(true);
    this.reportService.create(payload, this.selectedFiles()).subscribe({
      next: (report) => {
        this.submitting.set(false);
        this.notifications.success(this.translate.instant('report.success'));
        void this.router.navigate(['/confirmation'], {
          state: {
            reference: report.reference,
            email: payload.passenger.email,
            supportUuid: this.supportUuid(),
          },
        });
      },
      error: () => this.submitting.set(false),
    });
  }

  controlInvalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  /** Préremplit et verrouille nom / e-mail / téléphone si le voyageur est connecté. */
  private prefillFromSession(): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.form.patchValue({
      name: user.name ?? '',
      email: user.email ?? '',
      phoneNumber: user.phoneNumber ?? '',
    });
    this.form.controls.name.disable();
    this.form.controls.email.disable();
    this.form.controls.phoneNumber.disable();
  }

  backLink(): string[] {
    return this.fromDirect() ? ['/signalement'] : ['/report', this.supportUuid()];
  }
}
