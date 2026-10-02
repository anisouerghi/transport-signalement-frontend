import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { ConfigService } from '../../../core/config/config.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmailNudgeComponent } from '../components/email-nudge.component';
import { AttachmentPickerComponent } from '../components/attachment-picker.component';
import { SupportSummaryComponent } from '../components/support-summary.component';
import { ReportSummaryComponent } from '../components/report-summary.component';
import { TurnstileWidgetComponent } from '../components/turnstile-widget.component';
import { VoiceRecorderComponent } from '../components/voice-recorder.component';
import {
  ReportRequest,
  ReportType,
  TransportSupport,
} from '../models/report.model';
import { ReportService } from '../services/report.service';
import { ReportTypeService } from '../services/report-type.service';
import { ReportDraftService } from '../services/report-draft.service';
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
    ReportSummaryComponent,
    EmailNudgeComponent,
    AttachmentPickerComponent,
    VoiceRecorderComponent,
    TurnstileWidgetComponent,
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
      background: var(--surface-container-high);
      color: var(--on-surface-variant);
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
      color: var(--on-surface-variant);
      text-align: center;
      white-space: nowrap;
    }
    .step.completed .step__icon {
      background: var(--secondary);
      color: var(--on-secondary);
    }
    .step.completed .step__label {
      color: var(--secondary);
    }
    .step.active .step__icon {
      background: var(--tertiary-fixed-dim);
      color: var(--on-tertiary-fixed);
      box-shadow: 0 0 0 4px rgba(245, 191, 0, 0.3);
    }
    .step.active .step__label {
      color: var(--on-surface);
      font-weight: 700;
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: var(--surface-container-high);
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
    }
    .step-line.completed {
      background: var(--secondary);
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
  private readonly draftService = inject(ReportDraftService);
  readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly config = inject(ConfigService);

  @ViewChild(TurnstileWidgetComponent) private turnstileWidget?: TurnstileWidgetComponent;

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly invalidQr = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly step = signal<'form' | 'summary' | 'choice'>('form');
  readonly support = signal<TransportSupport | null>(null);
  readonly reportTypes = signal<ReportType[]>([]);
  readonly supportUuid = signal('');
  readonly anonymousMode = signal(false);
  readonly fromDirect = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly voiceFile = signal<File | null>(null);
  readonly turnstileToken = signal<string | null>(null);
  readonly turnstileError = signal<string | null>(null);

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

    if (!uuid) {
      this.anonymousMode.set(true);
      this.reportTypeService.getActive().subscribe({
        next: (types) => {
          this.reportTypes.set(types);
          this.preselectType(types);
          this.prefillFromSession();
          this.loading.set(false);
          this.maybeResumeDraft();
        },
        error: () => {
          this.loading.set(false);
          this.invalidQr.set(true);
          this.errorMessage.set(this.translate.instant('errors.supportLoadFailed'));
        },
      });
      return;
    }

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
        this.preselectType(types);
        this.prefillFromSession();
        this.loading.set(false);
        this.maybeResumeDraft();
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

  onVoiceChange(file: File | null): void {
    this.voiceFile.set(file);
  }

  onTurnstileToken(token: string | null): void {
    this.turnstileToken.set(token);
    if (token) {
      this.turnstileError.set(null);
    }
  }

  /** Turnstile requis et pas encore validé → bloquer l'envoi. */
  turnstileBlocksSubmit(): boolean {
    return this.config.cloudflareEnabled && !!this.config.cloudflareSiteKey && !this.turnstileToken();
  }

  /** Présélectionne le type depuis ?type=CODE, sinon le premier actif. */
  private preselectType(types: ReportType[]): void {
    const code = this.route.snapshot.queryParamMap.get('type')?.trim();
    const match = code
      ? types.find((t) => t.code?.toUpperCase() === code.toUpperCase())
      : undefined;
    const chosen = match ?? types[0];
    if (chosen) {
      this.form.controls.reportTypeId.setValue(String(chosen.reportTypeId));
    }
  }

  /** Étape 1 → validation du formulaire puis passage au récapitulatif. */
  goToSummary(): void {
    this.submitted.set(true);
    this.turnstileError.set(null);
    if (this.form.invalid || (!this.anonymousMode() && !this.support())) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.turnstileBlocksSubmit()) {
      this.turnstileError.set(this.translate.instant('turnstile.required'));
      this.notifications.error(this.translate.instant('turnstile.required'));
      return;
    }
    this.step.set('summary');
  }

  backToForm(): void {
    this.step.set('form');
  }

  backToSummary(): void {
    this.step.set('summary');
  }

  /** Étape 2 validée → étape 3 : choix suivi ou sans suivi. */
  goToChoice(): void {
    this.step.set('choice');
  }

  /** Sans suivi : enregistrement immédiat en mode anonyme. */
  submitAnonymous(): void {
    this.doSubmit(false);
  }

  /** Avec suivi : connexion requise, puis enregistrement. */
  submitTracking(): void {
    if (this.auth.isAuthenticated()) {
      this.doSubmit(true);
      return;
    }
    this.draftService.save({
      formValue: this.form.getRawValue(),
      supportUuid: this.supportUuid(),
      anonymousMode: this.anonymousMode(),
      files: [...this.selectedFiles()],
      voiceFile: this.voiceFile(),
      turnstileToken: this.turnstileToken(),
      withTracking: true,
    });
    const type = this.route.snapshot.queryParamMap.get('type');
    const params = type ? `?type=${encodeURIComponent(type)}&resume=1` : '?resume=1';
    void this.router.navigate(['/connexion'], {
      queryParams: { returnUrl: `/signalement/anonyme${params}` },
    });
  }

  /** Reprend un brouillon après redirection vers la connexion. */
  private maybeResumeDraft(): void {
    const resume = this.route.snapshot.queryParamMap.get('resume');
    if (!resume) {
      return;
    }
    const draft = this.draftService.take();
    if (!draft) {
      return;
    }
    this.supportUuid.set(draft.supportUuid);
    this.anonymousMode.set(draft.anonymousMode);
    this.form.patchValue(draft.formValue);
    this.selectedFiles.set(draft.files);
    this.voiceFile.set(draft.voiceFile);
    if (draft.turnstileToken) {
      this.turnstileToken.set(draft.turnstileToken);
    }
    // Pour une réclamation avec suivi, l'enregistrement se fait au nom
    // du voyageur connecté : coordonnées issues de la session (champs verrouillés).
    if (draft.withTracking && this.auth.isAuthenticated()) {
      this.prefillFromSession();
    }
    this.step.set('choice');
    if (draft.withTracking && this.auth.isAuthenticated()) {
      if (this.turnstileBlocksSubmit()) {
        // Le token Turnstile n'est plus valide : retour au formulaire pour le revalider.
        this.step.set('form');
        this.turnstileError.set(this.translate.instant('turnstile.required'));
        return;
      }
      this.doSubmit(true);
    }
  }

  selectedReportType(): ReportType | undefined {
    return this.reportTypes().find(
      (t) => String(t.reportTypeId) === this.form.controls.reportTypeId.value,
    );
  }

  submit(): void {
    if (this.step() === 'form') {
      this.goToSummary();
      return;
    }
    if (this.step() === 'summary') {
      this.goToChoice();
      return;
    }
  }

  doSubmit(withTracking: boolean): void {
    this.submitted.set(true);
    this.turnstileError.set(null);
    if (this.form.invalid || (!this.anonymousMode() && !this.support())) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.turnstileBlocksSubmit()) {
      this.turnstileError.set(this.translate.instant('turnstile.required'));
      this.notifications.error(this.translate.instant('turnstile.required'));
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ReportRequest = {
      reportTypeId: Number(raw.reportTypeId),
      description: raw.description.trim(),
      passenger: {
        name: raw.name.trim() || undefined,
        email: raw.email.trim() || undefined,
        phoneNumber: raw.phoneNumber.trim() || undefined,
      },
    };
    if (this.supportUuid()) {
      payload.supportUuid = this.supportUuid();
    }
    const token = this.turnstileToken();
    if (token) {
      payload.turnstileToken = token;
    }

    const files = [...this.selectedFiles()];
    const voice = this.voiceFile();
    if (voice) {
      files.push(voice);
    }

    this.submitting.set(true);
    this.reportService.create(payload, files).subscribe({
      next: (report) => {
        this.submitting.set(false);
        this.notifications.success(this.translate.instant('report.success'));
        void this.router.navigate(['/confirmation'], {
          state: {
            reference: report.reference,
            uuid: withTracking ? report.uuid : undefined,
            email: payload.passenger.email,
            supportUuid: this.supportUuid() || undefined,
            withTracking,
          },
        });
      },
      error: () => {
        this.submitting.set(false);
        this.turnstileToken.set(null);
        this.turnstileWidget?.reset();
      },
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
    return this.anonymousMode() || this.fromDirect()
      ? ['/signalement']
      : ['/report', this.supportUuid()];
  }
}
