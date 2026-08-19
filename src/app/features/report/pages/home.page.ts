import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';
import { PublicHomepageReply } from '../models/report.model';
import { ReportService } from '../services/report.service';

const PAGE_SIZE = 5;
const EXCERPT_LENGTH = 72;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly language = inject(LanguageService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly replies = signal<PublicHomepageReply[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly expanded = signal<ReadonlySet<number>>(new Set());

  readonly pages = computed(() => {
    const n = this.totalPages();
    return n > 0 ? Array.from({ length: n }, (_, i) => i) : [];
  });

  ngOnInit(): void {
    this.load(0);
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
    const text = (reply.message ?? '').replace(/\s+/g, ' ').trim();
    if (!this.needsExcerpt(text) || this.isExpanded(index)) {
      return text;
    }
    const cut = text.slice(0, EXCERPT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    const excerpt = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
    return `${excerpt}…`;
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
