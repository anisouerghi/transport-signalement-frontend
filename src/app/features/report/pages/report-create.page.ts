import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription, forkJoin } from 'rxjs';
import { ConfigService } from '../../../core/config/config.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmailNudgeComponent } from '../components/email-nudge.component';
import { AttachmentPickerComponent } from '../components/attachment-picker.component';
import { SupportSummaryComponent } from '../components/support-summary.component';
import { TurnstileWidgetComponent } from '../components/turnstile-widget.component';
import { VoiceRecorderComponent } from '../components/voice-recorder.component';
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

/** Ordre fixe des natures voyageur (indépendant de la langue et des IDs). */
const NATURE_ORDER = [
  'COMPLAINT',
  'ASSAULT',
  'INCIDENT',
  'SUGGESTION',
  'THANKS',
  'OTHER',
] as const;

/** Mêmes icônes et tons que les cartes de l'accueil. Affichage uniquement. */
const NATURE_VISUAL: Record<string, { icon: string; tone: string }> = {
  COMPLAINT: { icon: 'rate_review', tone: 'blue' },
  INCIDENT: { icon: 'photo_camera', tone: 'red' },
  SUGGESTION: { icon: 'tips_and_updates', tone: 'gold' },
  THANKS: { icon: 'thumb_up', tone: 'green' },
  OTHER: { icon: 'contact_support', tone: 'gray' },
};

@Component({
  selector: 'app-report-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SupportSummaryComponent,
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
    .nature-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.5rem;
    }
    .nature-card {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.75rem;
      width: 100%;
      min-height: 4.25rem;
      padding: 0.85rem 1rem;
      border: 1.5px solid #e5e8f0;
      border-radius: 0.75rem;
      background: #fff;
      color: #131c28;
      text-align: start;
      line-height: 1.35;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(19, 28, 40, 0.06);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .nature-card:hover:not(:disabled) {
      border-color: rgba(11, 82, 168, 0.35);
      box-shadow: 0 4px 12px rgba(19, 28, 40, 0.08);
    }
    .nature-card:focus-visible {
      outline: 3px solid rgba(11, 82, 168, 0.35);
      outline-offset: 2px;
    }
    .nature-card:disabled {
      cursor: default;
      opacity: 0.7;
    }
    .nature-card.is-selected {
      border-color: #003b7f;
      box-shadow: inset 0 0 0 1px #003b7f;
    }
    .nature-card.is-selected .nature-card__check {
      display: inline-flex;
    }
    .nature-card__check {
      display: none;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      margin-inline-start: auto;
      border-radius: 999px;
      background: #003b7f;
      color: #fff;
      font-size: 0.9rem;
      line-height: 1;
    }
    .nature-card__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      flex-shrink: 0;
    }
    .nature-card__icon .material-symbols-outlined {
      font-size: 1.5rem;
    }
    .nature-card--blue .nature-card__icon { background: rgba(11, 82, 168, 0.1); color: #0b52a8; }
    .nature-card--red .nature-card__icon { background: #ffdad6; color: #93000a; }
    .nature-card--gold .nature-card__icon { background: rgba(255, 223, 149, 0.4); color: #6a5100; }
    .nature-card--green .nature-card__icon { background: #8cfa9f; color: #007432; }
    .nature-card--gray .nature-card__icon { background: #e5eeff; color: #424752; }
    .nature-card__text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }
    .nature-card__name {
      color: #131c28;
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.35;
    }
    .nature-card__desc {
      color: #424752;
      font-size: 0.75rem;
      font-weight: 400;
      line-height: 1.45;
    }
    .nature-card.is-invalid {
      border-color: #dc3545;
    }
  `]
})
export class ReportCreatePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly supportService = inject(SupportService);
  private readonly reportTypeService = inject(ReportTypeService);
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly config = inject(ConfigService);
  private langSub?: Subscription;

  @ViewChild(TurnstileWidgetComponent) private turnstileWidget?: TurnstileWidgetComponent;

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly invalidQr = signal(false);
  readonly errorMessage = signal<string | null>(null);
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
      this.loadAnonymous();
      this.langSub = this.language.langChanged$.subscribe(() => this.reloadTypesOnly());
      return;
    }

    if (!UUID_RE.test(uuid)) {
      this.invalidQr.set(true);
      this.loading.set(false);
      this.errorMessage.set(this.translate.instant('errors.invalidQr'));
      return;
    }

    this.loadWithSupport(uuid);
    this.langSub = this.language.langChanged$.subscribe(() => this.reloadTypesOnly());
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  selectNature(type: ReportType): void {
    this.form.controls.reportTypeId.setValue(String(type.reportTypeId));
    this.form.controls.reportTypeId.markAsTouched();
  }

  natureIcon(type: ReportType): string | null {
    return NATURE_VISUAL[type.code?.toUpperCase()]?.icon ?? null;
  }

  natureTone(type: ReportType): string | null {
    return NATURE_VISUAL[type.code?.toUpperCase()]?.tone ?? null;
  }

  natureCode(type: ReportType): string {
    return type.code?.toUpperCase() ?? '';
  }

  isNatureSelected(type: ReportType): boolean {
    return this.form.controls.reportTypeId.value === String(type.reportTypeId);
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

  submit(): void {
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
            email: payload.passenger.email,
            supportUuid: this.supportUuid() || undefined,
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

  private loadAnonymous(): void {
    this.reportTypeService.getActive().subscribe({
      next: (types) => {
        this.applyTypes(types);
        this.preselectNatureFromQuery();
        this.prefillFromSession();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.invalidQr.set(true);
        this.errorMessage.set(this.translate.instant('errors.supportLoadFailed'));
      },
    });
  }

  private loadWithSupport(uuid: string): void {
    forkJoin({
      support: this.supportService.getByUuid(uuid),
      types: this.reportTypeService.getActive(),
    }).subscribe({
      next: ({ support, types }) => {
        this.support.set(support);
        this.applyTypes(types);
        this.preselectNatureFromQuery();
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

  /** Recharge les libellés localisés sans perdre la sélection ni le support. */
  private reloadTypesOnly(): void {
    const selectedId = this.form.controls.reportTypeId.value;
    this.reportTypeService.getActive().subscribe({
      next: (types) => {
        this.applyTypes(types, selectedId);
      },
    });
  }

  private preselectNatureFromQuery(): void {
    if (this.form.controls.reportTypeId.value) {
      return;
    }
    const code = this.route.snapshot.queryParamMap.get('nature')?.trim().toUpperCase();
    if (!code || !NATURE_ORDER.includes(code as (typeof NATURE_ORDER)[number])) {
      return;
    }
    const match = this.reportTypes().find((type) => type.code?.toUpperCase() === code);
    if (match) {
      this.selectNature(match);
    }
  }

  private applyTypes(types: ReportType[], preserveId?: string): void {
    const ordered = this.orderNatures(types);
    this.reportTypes.set(ordered);
    const keep = preserveId ?? this.form.controls.reportTypeId.value;
    if (keep && ordered.some((t) => String(t.reportTypeId) === keep)) {
      this.form.controls.reportTypeId.setValue(keep);
    }
  }

  private orderNatures(types: ReportType[]): ReportType[] {
    const byCode = new Map(types.map((t) => [t.code?.toUpperCase(), t]));
    const ordered: ReportType[] = [];
    for (const code of NATURE_ORDER) {
      const hit = byCode.get(code);
      if (hit) {
        ordered.push(hit);
      }
    }
    return ordered;
  }
}
