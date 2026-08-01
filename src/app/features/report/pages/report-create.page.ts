import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
  imports: [ReactiveFormsModule, SupportSummaryComponent, EmailNudgeComponent, AttachmentPickerComponent],
  templateUrl: './report-create.page.html',
})
export class ReportCreatePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly supportService = inject(SupportService);
  private readonly reportTypeService = inject(ReportTypeService);
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly invalidQr = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly support = signal<TransportSupport | null>(null);
  readonly reportTypes = signal<ReportType[]>([]);
  readonly supportUuid = signal('');
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

    if (!UUID_RE.test(uuid)) {
      this.invalidQr.set(true);
      this.loading.set(false);
      this.errorMessage.set(
        'Ce QR Code est invalide. Vérifiez qu’il s’agit bien d’un QR Code TRANSTU officiel.',
      );
      return;
    }

    forkJoin({
      support: this.supportService.getByUuid(uuid),
      types: this.reportTypeService.getActive(),
    }).subscribe({
      next: ({ support, types }) => {
        this.support.set(support);
        this.reportTypes.set(types);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.invalidQr.set(true);
        if (err.status === 404) {
          this.errorMessage.set(
            'Ce support de transport est introuvable ou n’est plus actif. Le QR Code peut être obsolète.',
          );
        } else {
          this.errorMessage.set(
            'Impossible de charger les informations du support. Réessayez dans quelques instants.',
          );
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
        this.notifications.success('Votre signalement a bien été enregistré.');
        void this.router.navigate(['/confirmation'], {
          state: {
            reference: report.reference,
            uuid: report.uuid,
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
}
