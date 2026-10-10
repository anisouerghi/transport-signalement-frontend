import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { PublicReportListItem, StatusInfo } from '../models/report.model';
import { ReportService } from '../services/report.service';
import { StatusService } from '../services/status.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-my-reports-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, TranslatePipe],
  templateUrl: './my-reports.page.html',
  styles: [
    `
      .mine-filters__actions {
        display: flex;
        gap: 0.5rem;
      }
      .mine-filters__actions .btn {
        min-height: 2.75rem;
        min-width: 2.75rem;
      }
      @media (max-width: 991.98px) {
        .mine-filters__field,
        .mine-filters__actions {
          width: 100%;
        }
        .mine-filters__actions .btn {
          flex: 1;
        }
      }
    `,
  ],
})
export class MyReportsPage implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly language = inject(LanguageService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly statusService = inject(StatusService);
  private langSub?: Subscription;

  readonly statuses = signal<StatusInfo[]>([]);

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly items = signal<PublicReportListItem[]>([]);
  readonly page = signal(0);

  readonly filterForm = this.fb.nonNullable.group({
    reference: '',
    statusCode: '',
    creationDate: '',
  });

  readonly appliedReference = signal('');
  readonly appliedStatusCode = signal('');
  readonly appliedCreationDate = signal('');

  /** Statuts disponibles (API /api/public/status), libellés localisés. */
  readonly statusOptions = computed(() => {
    const lang = this.language.currentLang();
    return this.statuses().map((s) => ({
      code: s.code,
      label:
        lang === 'ar' && s.labelAr ? s.labelAr
        : lang === 'en' && s.labelEn ? s.labelEn
        : s.labelFr || s.label,
    }));
  });

  /** Filtres appliqués côté client (statut + date) sur la liste reçue. */
  readonly filteredItems = computed(() =>
    this.items().filter((item) => {
      const status = this.appliedStatusCode();
      if (status && item.statusCode !== status) {
        return false;
      }
      const date = this.appliedCreationDate();
      if (date && !(item.creationDate ?? '').startsWith(date)) {
        return false;
      }
      return true;
    }),
  );

  readonly totalPages = computed(() => {
    const n = this.filteredItems().length;
    return n === 0 ? 1 : Math.ceil(n / PAGE_SIZE);
  });

  readonly pageItems = computed(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filteredItems().slice(start, start + PAGE_SIZE);
  });

  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  ngOnInit(): void {
    const reference = (this.route.snapshot.queryParamMap.get('reference') ?? '').trim();
    if (reference) {
      this.filterForm.controls.reference.setValue(reference);
      this.appliedReference.set(reference);
    }
    if (!this.auth.isAuthenticated()) {
      return;
    }
    this.refreshStatuses();
    this.load();
    this.langSub = this.language.langChanged$.subscribe(() => {
      this.refreshStatuses();
      this.load();
    });
  }

  private refreshStatuses(): void {
    this.statusService.getAll().subscribe({
      next: (statuses) => this.statuses.set(statuses),
      error: () => this.statuses.set([]),
    });
  }

  authReturnUrl(): string {
    const reference = this.appliedReference();
    return reference
      ? `/mes-signalements?reference=${encodeURIComponent(reference)}`
      : '/mes-signalements';
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    const reference = this.appliedReference();
    this.reportService
      .listMine(reference || undefined, this.appliedStatusCode() || undefined, this.appliedCreationDate() || undefined)
      .subscribe({
      next: (items) => {
        this.items.set(items);
        const maxPage = Math.max(0, Math.ceil(this.filteredItems().length / PAGE_SIZE) - 1);
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
    this.appliedStatusCode.set(this.filterForm.controls.statusCode.value);
    this.appliedCreationDate.set(this.filterForm.controls.creationDate.value);
    this.page.set(0);
    this.load();
  }

  resetSearch(): void {
    this.filterForm.reset({ reference: '', statusCode: '', creationDate: '' });
    this.appliedReference.set('');
    this.appliedStatusCode.set('');
    this.appliedCreationDate.set('');
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
