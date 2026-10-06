import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PublicReportTracking, PublicReplyView } from '../models/report.model';
import {
  REPLY_AUTHOR,
  REPLY_TYPE,
  authorLabelKey,
  isClosedStatus,
  replyIcon,
  replyTypeLabelKey,
} from '../models/reply-kinds';
import { ReportService } from '../services/report.service';

interface TimelineItem {
  date?: string;
  timeLabel: string;
  authorKey: string;
  typeKey: string;
  icon: string;
  message: string;
  transtu: boolean;
  ask: boolean;
  expect: boolean;
  last: boolean;
}

interface TimelineGroup {
  dayKey: string;
  labelKey: string | null;
  label: string;
  items: TimelineItem[];
}

/**
 * Suivi chronologique d'un dossier. Le premier événement est la description
 * du signalement. Le type de chaque message vient de l'API.
 */
@Component({
  selector: 'app-report-conversation',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  template: `
    <section class="dossier" [attr.aria-label]="'followUp.conversationTitle' | translate">
      <header class="dossier__head">
        <div class="dossier__identity">
          <p class="dossier__kicker">{{ 'common.reference' | translate }}</p>
          <p class="dossier__ref">{{ report.reference }}</p>
          @if (report.reportTypeLabel || report.supportLabel) {
            <p class="dossier__meta">
              @if (report.reportTypeLabel) {
                <span>{{ report.reportTypeLabel }}</span>
              }
              @if (report.supportLabel) {
                <span>{{ report.supportLabel }}</span>
              }
            </p>
          }
          @if (lastUpdate()) {
            <p class="dossier__updated">
              {{ 'followUp.lastUpdate' | translate }} · {{ lastUpdate() }}
            </p>
          }
        </div>
        @if (report.statusLabel) {
          <span class="dossier__status" [class.dossier__status--closed]="closed()" [class.dossier__status--wait]="waiting()">
            <span class="material-symbols-outlined" aria-hidden="true">{{ statusIcon() }}</span>
            {{ report.statusLabel }}
          </span>
        }
      </header>

      @if (waiting()) {
        <div class="dossier__action" role="status">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          <div>
            <p class="dossier__action-title">{{ 'followUp.waitingTitle' | translate }}</p>
            <p class="mb-2">{{ 'followUp.askComplement' | translate }}</p>
            @if (auth.isAuthenticated()) {
              @if (!composerOpen()) {
                <button type="button" class="dossier__btn" (click)="openComposer()">
                  {{ 'followUp.replyRespond' | translate }}
                </button>
              }
            } @else {
              <a class="dossier__btn" [routerLink]="['/connexion']" [queryParams]="{ returnUrl: returnUrl() }">
                {{ 'followUp.replyLoginAction' | translate }}
              </a>
              <p class="dossier__login">{{ 'followUp.replyLogin' | translate }}</p>
            }
          </div>
        </div>
      }

      @if (composerOpen()) {
        <form class="composer" (submit)="send($event)">
          <label for="complement-reply">{{ 'followUp.you' | translate }}</label>
          <textarea
            id="complement-reply"
            rows="4"
            maxlength="2000"
            [attr.placeholder]="'followUp.replyPlaceholder' | translate"
            [value]="draft()"
            (input)="onDraft($event)"
          ></textarea>
          <div class="composer__foot">
            @if (draftError()) {
              <p class="composer__error" role="alert">{{ 'followUp.replyRequired' | translate }}</p>
            } @else {
              <span class="composer__count">{{ draft().trim().length }}/2000</span>
            }
          </div>
          <div class="composer__actions">
            <button type="button" class="dossier__btn dossier__btn--ghost" [disabled]="sending()" (click)="closeComposer()">
              {{ 'followUp.replyCancel' | translate }}
            </button>
            <button type="submit" class="dossier__btn" [disabled]="sending()">
              @if (sending()) {
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              }
              {{ 'followUp.replySend' | translate }}
            </button>
          </div>
        </form>
      }

      <h2 class="dossier__title">{{ 'followUp.conversationTitle' | translate }}</h2>

      @if (groups().length === 0) {
        <p class="dossier__empty">{{ 'followUp.noReplies' | translate }}</p>
      } @else {
        <ol class="tl">
          @for (group of groups(); track group.dayKey) {
            <li class="tl__day">
              {{ group.labelKey ? (group.labelKey | translate) : group.label }}
            </li>
            @for (item of group.items; track item.date + item.message + item.typeKey) {
              <li
                class="tl__event"
                [class.tl__event--you]="!item.transtu"
                [class.tl__event--ask]="item.ask"
                [class.tl__event--last]="item.last"
              >
                <span class="tl__mark" aria-hidden="true">
                  <span class="material-symbols-outlined">{{ item.icon }}</span>
                </span>
                <article class="tl__card">
                  <header class="tl__head">
                    <strong>{{ item.authorKey | translate }}</strong>
                    <time>{{ item.timeLabel }}</time>
                  </header>
                  <p class="tl__kind">{{ item.typeKey | translate }}</p>
                  <p class="tl__text">{{ item.message }}</p>
                  @if (item.expect && waiting()) {
                    <p class="tl__hint">
                      <span class="material-symbols-outlined" aria-hidden="true">info</span>
                      {{ 'followUp.expectedHint' | translate }}
                    </p>
                  }
                </article>
              </li>
            }
          }
        </ol>
      }

      @if (closed()) {
        <div class="dossier__closed" role="status">
          <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          <div>
            <p class="dossier__action-title">{{ 'followUp.closedTitle' | translate }}</p>
            <p class="mb-0">{{ 'followUp.closedBody' | translate }}</p>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .dossier {
      background: #fff;
      border: 1px solid var(--transtu-border, #c2c6d4);
      border-radius: 1rem;
      padding: 1.15rem 1rem 1.25rem;
      max-width: 46rem;
      box-shadow: 0 1px 0 rgba(0, 59, 127, 0.04);
    }
    .dossier__head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.85rem;
      margin-bottom: 1.1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e6ebf5;
    }
    .dossier__kicker {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--transtu-muted, #424752);
    }
    .dossier__ref {
      margin: 0.15rem 0 0;
      font-weight: 700;
      font-size: 1.35rem;
      line-height: 1.2;
      color: var(--transtu-blue-deep, #003b7f);
      word-break: break-word;
    }
    .dossier__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin: 0.55rem 0 0;
    }
    .dossier__meta span {
      background: #eff4ff;
      color: var(--transtu-blue-deep, #003b7f);
      border-radius: 999px;
      padding: 0.15rem 0.55rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .dossier__updated,
    .dossier__login,
    .dossier__empty {
      margin: 0.2rem 0 0;
      color: var(--transtu-muted, #5c6570);
      font-size: 0.82rem;
    }
    .dossier__status {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      flex-shrink: 0;
      border-radius: 999px;
      padding: 0.4rem 0.75rem;
      background: #e8f0ff;
      color: var(--transtu-blue-deep, #003b7f);
      font-weight: 700;
      font-size: 0.78rem;
      line-height: 1;
    }
    .dossier__status--wait {
      background: var(--transtu-gold-soft, #fff6db);
      color: #6a4b00;
    }
    .dossier__status--closed {
      background: var(--transtu-green-soft, #e1f5e7);
      color: #0d5c32;
    }
    .dossier__status .material-symbols-outlined,
    .dossier__action .material-symbols-outlined,
    .dossier__closed .material-symbols-outlined,
    .tl__hint .material-symbols-outlined {
      font-size: 1.05rem;
    }
    .dossier__action,
    .dossier__closed,
    .composer {
      display: flex;
      gap: 0.7rem;
      align-items: flex-start;
      border-radius: 0.85rem;
      padding: 0.9rem 0.95rem;
      margin-bottom: 1rem;
    }
    .dossier__action {
      background: #fff9eb;
      border: 1px solid #f0d48a;
      border-inline-start: 4px solid var(--transtu-gold, #f5bf00);
    }
    .dossier__closed {
      background: #f3fbf6;
      border: 1px solid #b7dfc4;
      border-inline-start: 4px solid #006e2f;
      margin: 1rem 0 0;
    }
    .dossier__action-title {
      font-weight: 700;
      margin: 0 0 0.2rem;
    }
    .dossier__title {
      font-size: 0.78rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--transtu-muted, #5c6570);
      margin: 0 0 0.75rem;
    }
    .dossier__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      min-height: 2.5rem;
      border: 0;
      border-radius: 0.6rem;
      background: var(--transtu-blue-deep, #003b7f);
      color: #fff;
      font-weight: 700;
      padding: 0.45rem 1rem;
      text-decoration: none;
    }
    .dossier__btn:disabled {
      opacity: 0.55;
    }
    .dossier__btn:focus-visible,
    .composer textarea:focus-visible {
      outline: 2px solid var(--transtu-blue-deep, #003b7f);
      outline-offset: 2px;
    }
    .dossier__btn--ghost {
      background: transparent;
      color: var(--transtu-blue-deep, #003b7f);
      border: 1px solid var(--transtu-blue-deep, #003b7f);
    }
    .composer {
      flex-direction: column;
      gap: 0.55rem;
      background: #f7f9fd;
      border: 1px solid #d5deef;
    }
    .composer label {
      font-weight: 700;
      color: var(--transtu-blue-deep, #003b7f);
    }
    .composer textarea {
      width: 100%;
      min-height: 6.5rem;
      border: 1px solid #c2c6d4;
      border-radius: 0.7rem;
      padding: 0.75rem 0.85rem;
      resize: vertical;
      background: #fff;
      line-height: 1.45;
    }
    .composer__foot {
      min-height: 1.1rem;
    }
    .composer__count {
      color: var(--transtu-muted, #424752);
      font-size: 0.75rem;
    }
    .composer__actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .composer__error {
      color: #ba1a1a;
      font-size: 0.8rem;
      font-weight: 600;
      margin: 0;
    }
    .tl {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .tl__day {
      width: fit-content;
      margin: 0.2rem auto 0.85rem;
      padding: 0.22rem 0.7rem;
      border-radius: 999px;
      background: #eff4ff;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--transtu-blue-deep, #003b7f);
    }
    .tl {
      position: relative;
    }
    .tl__event {
      position: relative;
      display: grid;
      grid-template-columns: 2.15rem minmax(0, 1fr);
      column-gap: 0.8rem;
      padding-bottom: 1rem;
    }
    .tl__event::before {
      content: '';
      position: absolute;
      inset-inline-start: 1rem;
      top: 2rem;
      bottom: 0;
      width: 2px;
      background: #d7e0f0;
    }
    .tl__event--last::before {
      display: none;
    }
    .tl__mark {
      width: 2.15rem;
      height: 2.15rem;
      border-radius: 50%;
      border: 2px solid var(--transtu-blue, #0b52a8);
      background: #fff;
      color: var(--transtu-blue, #0b52a8);
      display: grid;
      place-items: center;
      z-index: 1;
      box-shadow: 0 0 0 4px #fff;
    }
    .tl__mark .material-symbols-outlined {
      font-size: 1rem;
    }
    .tl__event--you .tl__mark {
      border-color: #0d5c32;
      color: #0d5c32;
    }
    .tl__event--last .tl__mark {
      background: var(--transtu-blue-deep, #003b7f);
      color: #fff;
    }
    .tl__event--you.tl__event--last .tl__mark {
      background: #0d5c32;
      color: #fff;
    }
    .tl__card {
      border: 1px solid #e3e9f4;
      border-inline-start: 3px solid var(--transtu-blue, #0b52a8);
      border-radius: 0.85rem;
      background: #f5f8fd;
      padding: 0.75rem 0.9rem;
      min-width: 0;
    }
    .tl__event--you .tl__card {
      background: #fff;
      border-inline-start-color: #006e2f;
    }
    .tl__event--ask .tl__card {
      background: #fffdf8;
      border-color: #f0d48a;
      border-inline-start-color: var(--transtu-gold, #f5bf00);
    }
    .tl__head {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      align-items: baseline;
    }
    .tl__head strong {
      color: var(--transtu-blue-deep, #003b7f);
    }
    .tl__event--you .tl__head strong {
      color: #0d5c32;
    }
    .tl__head time,
    .tl__kind {
      font-size: 0.8rem;
    }
    .tl__head time {
      color: var(--transtu-muted, #5c6570);
      white-space: nowrap;
    }
    .tl__kind {
      margin: 0.2rem 0 0.4rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .tl__text {
      margin: 0;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .tl__hint {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0.55rem 0 0;
      padding: 0.4rem 0.5rem;
      border-radius: 0.4rem;
      background: #fff;
      font-size: 0.8rem;
      font-weight: 600;
    }
    @media (min-width: 768px) {
      .dossier {
        padding: 1.35rem 1.4rem 1.5rem;
      }
      .tl__event--you .tl__card {
        margin-inline-start: 14%;
      }
      .tl__event:not(.tl__event--you) .tl__card {
        margin-inline-end: 8%;
      }
    }
  `,
})
export class ReportConversationComponent {
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(AuthService);

  @Input({ required: true }) report!: PublicReportTracking;
  @Output() reportChange = new EventEmitter<PublicReportTracking>();

  readonly draft = signal('');
  readonly draftError = signal(false);
  readonly sending = signal(false);
  readonly composerOpen = signal(false);

  returnUrl(): string {
    return this.router.url || '/accueil';
  }

  closed(): boolean {
    return isClosedStatus(this.report?.statusCode);
  }

  waiting(): boolean {
    return !!this.report?.canPassengerReply && !this.closed();
  }

  statusIcon(): string {
    if (this.closed()) {
      return 'check_circle';
    }
    if (this.waiting()) {
      return 'pending';
    }
    return 'schedule';
  }

  lastUpdate(): string {
    const dates = [this.report?.creationDate, ...(this.report?.replies ?? []).map((reply) => reply.replyDate)]
      .filter((value): value is string => !!value)
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value));
    if (dates.length === 0) {
      return '';
    }
    return this.formatStamp(new Date(Math.max(...dates)));
  }

  groups(): TimelineGroup[] {
    this.language.currentLang();
    const built = this.buildItems();
    const groups: TimelineGroup[] = [];
    for (const item of built) {
      const key = this.dayKey(item.date);
      const current = groups[groups.length - 1];
      if (!current || current.dayKey !== key) {
        const today = this.isToday(item.date);
        groups.push({
          dayKey: key,
          labelKey: today ? 'followUp.today' : null,
          label: today ? '' : this.formatDay(item.date),
          items: [item],
        });
      } else {
        current.items.push(item);
      }
    }
    return groups;
  }

  openComposer(): void {
    this.composerOpen.set(true);
    this.draftError.set(false);
    queueMicrotask(() => document.getElementById('complement-reply')?.focus());
  }

  closeComposer(): void {
    this.composerOpen.set(false);
    this.draft.set('');
    this.draftError.set(false);
  }

  onDraft(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
    this.draftError.set(false);
  }

  send(event: Event): void {
    event.preventDefault();
    const text = this.draft().trim();
    if (!text || text.length > 2000) {
      this.draftError.set(true);
      return;
    }
    const uuid = this.report?.uuid;
    if (!uuid || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.reportService.replyToComplement(uuid, text).subscribe({
      next: () => {
        const current = this.report;
        this.reportChange.emit({
          ...current,
          canPassengerReply: false,
          replies: [
            ...(current.replies ?? []),
            {
              message: text,
              replyDate: new Date().toISOString(),
              replyType: REPLY_TYPE.complementResponse,
              authorType: REPLY_AUTHOR.passenger,
            },
          ],
        });
        this.closeComposer();
        this.sending.set(false);
        this.notifications.success(this.translate.instant('followUp.replySent'));
        this.reportService.getFollowUp(uuid).subscribe({
          next: (fresh) => this.reportChange.emit(fresh),
        });
      },
      error: () => this.sending.set(false),
    });
  }

  private buildItems(): TimelineItem[] {
    const report = this.report;
    const items: TimelineItem[] = [];
    if (report?.description?.trim()) {
      items.push({
        date: report.creationDate,
        timeLabel: this.formatTime(report.creationDate),
        authorKey: 'followUp.you',
        typeKey: 'followUp.typeInitial',
        icon: 'description',
        message: report.description,
        transtu: false,
        ask: false,
        expect: false,
        last: false,
      });
    }
    for (const reply of report?.replies ?? []) {
      items.push(this.toItem(reply));
    }
    if (items.length > 0) {
      items[items.length - 1].last = true;
    }
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index].ask) {
        items[index].expect = true;
        break;
      }
    }
    return items;
  }

  private toItem(reply: PublicReplyView): TimelineItem {
    const author = (reply.authorType ?? REPLY_AUTHOR.agent).toUpperCase();
    const type = (reply.replyType ?? REPLY_TYPE.response).toUpperCase();
    return {
      date: reply.replyDate,
      timeLabel: this.formatTime(reply.replyDate),
      authorKey: authorLabelKey(author),
      typeKey: replyTypeLabelKey(type) ?? 'followUp.typeResponse',
      icon: replyIcon(type),
      message: reply.message,
      transtu: author !== REPLY_AUTHOR.passenger,
      ask: type === REPLY_TYPE.complementRequest,
      expect: false,
      last: false,
    };
  }

  private locale(): string {
    const lang = this.language.currentLang();
    if (lang === 'ar') {
      return 'ar';
    }
    if (lang === 'en') {
      return 'en';
    }
    return 'fr';
  }

  private formatDay(value?: string): string {
    const date = this.parse(value);
    if (!date) {
      return '';
    }
    return new Intl.DateTimeFormat(this.locale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private formatTime(value?: string): string {
    const date = this.parse(value);
    if (!date) {
      return '';
    }
    return new Intl.DateTimeFormat(this.locale(), {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatStamp(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private dayKey(value?: string): string {
    const date = this.parse(value);
    if (!date) {
      return 'unknown';
    }
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private isToday(value?: string): boolean {
    const date = this.parse(value);
    if (!date) {
      return false;
    }
    const now = new Date();
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }

  private parse(value?: string): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
