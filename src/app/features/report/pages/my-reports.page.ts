import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { PublicReportListItem } from '../models/report.model';
import { ReportService } from '../services/report.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-my-reports-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, TranslatePipe],
  templateUrl: './my-reports.page.html',
})
export class MyReportsPage implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly language = inject(LanguageService);
  private readonly fb = inject(FormBuilder);
  private langSub?: Subscription;

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly items = signal<PublicReportListItem[]>([]);
  readonly page = signal(0);
  readonly appliedReference = signal('');

  readonly filterForm = this.fb.nonNullable.group({
    reference: '',
  });

  readonly totalPages = computed(() => {
    const n = this.items().length;
    return n === 0 ? 1 : Math.ceil(n / PAGE_SIZE);
  });

  readonly pageItems = computed(() => {
    const start = this.page() * PAGE_SIZE;
    return this.items().slice(start, start + PAGE_SIZE);
  });

  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    this.load();
    this.langSub = this.language.langChanged$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    const reference = this.appliedReference();
    this.reportService.listMine(reference || undefined).subscribe({
      next: (items) => {
        this.items.set(items);
        const maxPage = Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1);
        if (this.page() > maxPage) {
          this.page.set(0);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  search(): void {
    this.appliedReference.set(this.filterForm.controls.reference.value.trim());
    this.page.set(0);
    this.load();
  }

  resetSearch(): void {
    this.filterForm.reset({ reference: '' });
    this.appliedReference.set('');
    this.page.set(0);
    this.load();
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages()) {
      return;
    }
    this.page.set(p);
  }

  supportLine(item: PublicReportListItem): string {
    const type = item.supportTypeLabel?.trim();
    const label = item.supportLabel?.trim();
    if (type && label) {
      return `${type} – ${label}`;
    }
    return type || label || '';
  }
}
