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
import { IdentityChoiceComponent } from '../components/identity-choice.component';
import { SupportSummaryComponent } from '../components/support-summary.component';
import { ReportSummaryComponent } from '../components/report-summary.component';
import { TurnstileWidgetComponent } from '../components/turnstile-widget.component';
import { VoiceRecorderComponent } from '../components/voice-recorder.component';
import {
  ReportRequest,
  ReportType,
  TransportSupport,
} from '../models/report.model';
import { ReportDraftService } from '../services/report-draft.service';
import { ReportService } from '../services/report.service';
import { ReportTypeService } from '../services/report-type.service';
import { SupportService } from '../services/support.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Couleur de pastille déjà utilisée sur l'accueil. L'icône vient du champ API `icon`. */
const NATURE_TONE: Record<string, string> = {
  COMPLAINT: 'blue',
  INCIDENT: 'red',
  SUGGESTION: 'gold',
  THANKS: 'green',
  OTHER: 'gray',
  ASSAULT: 'red',
};

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
    IdentityChoiceComponent,
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
    .nature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.25rem), 1fr));
      gap: 0.5rem;
    }
    .nature-card {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.5rem;
      width: 100%;
      min-height: 3.25rem;
      padding: 0.55rem 0.7rem;
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
    .nature-card__trail {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-inline-start: auto;
      flex-shrink: 0;
    }
    .nature-card__check {
      display: none;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      margin-inline-start: auto;
      border-radius: 999px;
      background: #003b7f;
      color: #fff;
      font-size: 0.8rem;
      line-height: 1;
    }
    .nature-card__go {
      font-size: 1.25rem;
      color: #424752;
    }
    :host-context(html[dir='rtl']) .nature-card__go {
      transform: rotate(180deg);
    }
    .nature-card--urgence {
      min-height: 3.75rem;
      margin-bottom: 0.85rem;
      padding: 0.75rem 1rem;
      gap: 0.75rem;
      background: #fff8f7;
      border-color: #ffdad6;
    }
    .nature-card--urgence .nature-card__check {
      margin-inline-start: 0;
    }
    .nature-card--urgence .nature-card__icon {
      background: #ba1a1a;
      color: #fff;
      border-radius: 999px;
    }
    .nature-card--urgence .nature-card__name {
      color: #93000a;
    }
    .nature-card--urgence .nature-card__go {
      color: #93000a;
    }
    .nature-card--urgence.is-selected {
      border-color: #ba1a1a;
      box-shadow: inset 0 0 0 1px #ba1a1a;
    }
    .nature-card--urgence.is-selected .nature-card__check {
      background: #ba1a1a;
    }
    .nature-card__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.65rem;
      flex-shrink: 0;
    }
    .nature-card--urgence .nature-card__icon {
      width: 2.75rem;
      height: 2.75rem;
    }
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      font-feature-settings: 'liga';
      -webkit-font-feature-settings: 'liga';
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .nature-card__icon .material-symbols-outlined {
      font-size: 1.25rem;
    }
    .nature-card--urgence .nature-card__icon .material-symbols-outlined {
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
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.3;
      min-width: 0;
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
  private readonly drafts = inject(ReportDraftService);
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
  /** Parcours /signalement : récapitulatif puis choix, sans POST avant. */
  readonly depositFlow = signal(false);
  readonly step = signal<'form' | 'review' | 'choice'>('form');

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
    // /signalement/anonyme (avec ou sans nature) : saisie → récap → choix, jamais de POST avant.
    // Le segment « anonyme » n'est pas un mode définitif. Le QR (/report/:uuid) conserve son flux.
    this.depositFlow.set(!uuid || this.route.snapshot.queryParamMap.get('parcours') === 'depot');

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

  isUrgence(type: ReportType): boolean {
    return type.code?.trim().toUpperCase() === 'URGENCE';
  }

  natureTone(type: ReportType): string {
    return NATURE_TONE[type.code?.trim().toUpperCase() ?? ''] ?? 'gray';
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

  onFormSubmit(): void {
    if (this.depositFlow()) {
      this.openReview();
      return;
    }
    this.submit();
  }

  /** Passe au récapitulatif. Aucun POST. */
  openReview(): void {
    if (!this.readyToSend()) {
      return;
    }
    this.persistDraft(false);
    this.step.set('review');
    window.scrollTo(0, 0);
  }

  editReport(): void {
    this.step.set('form');
    window.scrollTo(0, 0);
  }

  /**
   * Après le récapitulatif.
   * Connecté : enregistrement direct avec le compte (aucun choix de mode).
   * Non connecté : choix anonyme / suivi, sans POST.
   */
  continueToChoice(): void {
    this.persistDraft(false);
    if (this.auth.isAuthenticated()) {
      this.submit();
      return;
    }
    this.step.set('choice');
    window.scrollTo(0, 0);
  }

  chooseFollowUp(): void {
    if (this.auth.isAuthenticated()) {
      this.submit();
      return;
    }
    this.persistDraft(true);
    void this.router.navigate(['/connexion'], {
      queryParams: { returnUrl: this.depositReturnUrl() },
    });
  }

  /** Retour après connexion : même formulaire, nature conservée, étape choix. */
  depositReturnUrl(): string {
    const params = new URLSearchParams({ parcours: 'depot', etape: 'choix' });
    const nature = this.natureQuery();
    if (nature) {
      params.set('nature', nature);
    }
    return `/signalement/anonyme?${params.toString()}`;
  }

  selectedNatureLabel(): string {
    const id = this.form.controls.reportTypeId.value;
    return this.reportTypes().find((type) => String(type.reportTypeId) === id)?.label ?? '';
  }

  reviewContactLines(): string[] {
    const raw = this.form.getRawValue();
    return [raw.name, raw.email, raw.phoneNumber].map((value) => value.trim()).filter((value) => !!value);
  }

  reviewFileNames(): string[] {
    const names = this.selectedFiles().map((file) => file.name);
    const voice = this.voiceFile();
    if (voice) {
      names.push(voice.name);
    }
    return names;
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    if (!this.readyToSend()) {
      this.step.set('form');
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
        this.drafts.clear();
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
        if (this.depositFlow()) {
          this.step.set('form');
        }
      },
    });
  }

  private readyToSend(): boolean {
    this.submitted.set(true);
    this.turnstileError.set(null);
    if (this.form.invalid || (!this.anonymousMode() && !this.support())) {
      this.form.markAllAsTouched();
      return false;
    }
    if (this.turnstileBlocksSubmit()) {
      this.turnstileError.set(this.translate.instant('turnstile.required'));
      this.notifications.error(this.translate.instant('turnstile.required'));
      return false;
    }
    return true;
  }

  private persistDraft(pendingAuth: boolean): void {
    const raw = this.form.getRawValue();
    this.drafts.save({
      reportTypeId: raw.reportTypeId,
      description: raw.description,
      name: raw.name,
      phoneNumber: raw.phoneNumber,
      email: raw.email,
      files: [...this.selectedFiles()],
      voice: this.voiceFile(),
      turnstileToken: this.turnstileToken(),
      supportUuid: this.supportUuid(),
      pendingAuth,
    });
  }

  /** Reprend la saisie après la connexion du mode « avec suivi ». */
  private restoreDepositDraft(): void {
    if (!this.depositFlow()) {
      return;
    }
    const draft = this.drafts.peek();
    const waitingChoice = this.route.snapshot.queryParamMap.get('etape') === 'choix';
    if (!draft || !waitingChoice) {
      return;
    }
    this.form.patchValue({
      reportTypeId: draft.reportTypeId,
      description: draft.description,
      name: draft.name,
      phoneNumber: draft.phoneNumber,
      email: draft.email,
    });
    this.selectedFiles.set(draft.files);
    this.voiceFile.set(draft.voice);
    this.turnstileToken.set(draft.turnstileToken);
    if (this.auth.isAuthenticated()) {
      this.prefillFromSession();
    }
    if (draft.pendingAuth && this.auth.isAuthenticated()) {
      draft.pendingAuth = false;
      this.submit();
      return;
    }
    draft.pendingAuth = false;
    this.step.set('choice');
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
        this.restoreDepositDraft();
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
        this.restoreDepositDraft();
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

  private natureQuery(): string {
    return this.route.snapshot.queryParamMap.get('nature')?.trim().toUpperCase() ?? '';
  }

  private preselectNatureFromQuery(): void {
    if (this.form.controls.reportTypeId.value) {
      return;
    }
    const code = this.natureQuery();
    if (!code) {
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
    return [...types].sort((a, b) => {
      const aUrgent = this.isUrgence(a);
      const bUrgent = this.isUrgence(b);
      if (aUrgent !== bUrgent) {
        return aUrgent ? -1 : 1;
      }
      const left = a.priority ?? Number.MAX_SAFE_INTEGER;
      const right = b.priority ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) {
        return left - right;
      }
      return a.reportTypeId - b.reportTypeId;
    });
  }
}
