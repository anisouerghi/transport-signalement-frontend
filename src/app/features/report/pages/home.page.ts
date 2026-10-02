import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';
import { PublicHomepageReply, ReportType } from '../models/report.model';
import { ReportService } from '../services/report.service';
import { ReportTypeService } from '../services/report-type.service';

const PAGE_SIZE = 5;
const EXCERPT_LENGTH = 110;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly reportTypeService = inject(ReportTypeService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly replies = signal<PublicHomepageReply[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly expanded = signal<ReadonlySet<number>>(new Set());
  readonly trackingCode = signal('');
  readonly reportTypes = signal<ReportType[]>([]);
  readonly typesLoading = signal(true);
  readonly typesError = signal(false);

  readonly pages = computed(() => {
    const n = this.totalPages();
    return n > 0 ? Array.from({ length: n }, (_, i) => i) : [];
  });

  ngOnInit(): void {
    this.load(0);
    this.loadReportTypes();
  }

  loadReportTypes(): void {
    this.typesLoading.set(true);
    this.typesError.set(false);
    this.reportTypeService.getActive().subscribe({
      next: (types) => {
        this.reportTypes.set(types);
        this.typesLoading.set(false);
      },
      error: () => {
        this.typesError.set(true);
        this.reportTypes.set([]);
        this.typesLoading.set(false);
      },
    });
  }

  typeLabel(type: ReportType): string {
    const lang = this.language.currentLang();
    if (lang === 'ar' && type.labelAr) {
      return type.labelAr;
    }
    if (lang === 'en' && type.labelEn) {
      return type.labelEn;
    }
    return type.labelFr || type.label;
  }

  typeSecondaryLabel(type: ReportType): string {
    return this.language.currentLang() === 'ar'
      ? type.labelFr || type.label
      : type.label;
  }

  typeIcon(code: string): string {
    switch ((code ?? '').toUpperCase()) {
      case 'INCIDENT':
        return 'bi bi-exclamation-triangle';
      case 'COMPLAINT':
      case 'RECLAMATION':
        return 'bi bi-chat-left-text';
      case 'SUGGESTION':
        return 'bi bi-lightbulb';
      case 'MERCI':
      case 'REMERCIEMENT':
      case 'THANKS':
        return 'bi bi-hand-thumbs-up';
      default:
        return 'bi bi-question-circle';
    }
  }

  typeAccent(code: string): string {
    switch ((code ?? '').toUpperCase()) {
      case 'INCIDENT':
        return '#c62828';
      case 'COMPLAINT':
      case 'RECLAMATION':
        return '#003b7f';
      case 'SUGGESTION':
        return '#f0a500';
      case 'MERCI':
      case 'REMERCIEMENT':
      case 'THANKS':
        return '#2e7d32';
      default:
        return '#6c757d';
    }
  }

  typeIconBg(code: string): string {
    switch ((code ?? '').toUpperCase()) {
      case 'INCIDENT':
        return '#fdecea';
      case 'COMPLAINT':
      case 'RECLAMATION':
        return '#e7eefb';
      case 'SUGGESTION':
        return '#fdf3d7';
      case 'MERCI':
      case 'REMERCIEMENT':
      case 'THANKS':
        return '#e6f4ea';
      default:
        return '#eef1f5';
    }
  }

  goToType(type: ReportType): void {
    void this.router.navigate(['/signalement/anonyme'], {
      queryParams: { type: type.code },
    });
  }

  trackType(index: number, type: ReportType): number {
    return type.reportTypeId;
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.expanded.set(new Set());
    this.reportService.listHomepageReplies(page, PAGE_SIZE).subscribe({
      next: (res) => {
        const content = Array.isArray(res?.content) ? res.content : [];
        this.replies.set(content);
        this.totalPages.set(res?.totalPages ?? 0);
        this.page.set(res?.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.replies.set([]);
        this.loading.set(false);
      },
    });
  }

  onTrackingInput(event: Event): void {
    this.trackingCode.set((event.target as HTMLInputElement).value);
  }

  onTrackSubmit(event: Event): void {
    event.preventDefault();
    this.track();
  }

  track(): void {
    const code = this.trackingCode().trim();
    if (!code) {
      return;
    }
    void this.router.navigate(['/report-followup', code]);
  }

  trackReply(index: number, reply: PublicHomepageReply): string {
    return `${reply.replyDate ?? ''}-${index}`;
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages() || p === this.page()) {
      return;
    }
    this.load(p);
  }

  needsExcerpt(message?: string): boolean {
    return (message ?? '').trim().length > EXCERPT_LENGTH;
  }

  isExpanded(index: number): boolean {
    return this.expanded().has(index);
  }

  toggleExpand(index: number): void {
    const next = new Set(this.expanded());
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.expanded.set(next);
  }

  displayMessage(reply: PublicHomepageReply, index: number): string {
    const text = this.messageOf(reply);
    if (!this.needsExcerpt(text) || this.isExpanded(index)) {
      return text;
    }
    const cut = text.slice(0, EXCERPT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    const excerpt = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
    return `${excerpt}…`;
  }

  displayResponse(reply: PublicHomepageReply, index: number): string {
    const text = this.responseOf(reply);
    if (!this.needsExcerpt(text) || this.isExpanded(index)) {
      return text;
    }
    const cut = text.slice(0, EXCERPT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    const excerpt = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
    return `${excerpt}…`;
  }

  authorLabel(reply: PublicHomepageReply): string | null {
    return this.authorName(reply);
  }

  authorInitials(reply: PublicHomepageReply): string {
    const name = this.authorName(reply);
    if (!name) {
      return 'A';
    }
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  private authorName(reply: PublicHomepageReply): string | null {
    return reply.passengerName?.trim() || reply.passenger?.name?.trim() || null;
  }

  private messageOf(reply: PublicHomepageReply): string {
    return (reply.description ?? reply.reportMessage ?? '').replace(/\s+/g, ' ').trim();
  }

  private responseOf(reply: PublicHomepageReply): string {
    return (reply.responseMessage ?? reply.message ?? '').replace(/\s+/g, ' ').trim();
  }

  formatReplyDate(value?: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(this.language.currentLang(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
