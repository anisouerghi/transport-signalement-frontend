import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PublicReportTracking } from '../models/report.model';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-report-reference-page',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslatePipe],
  template: `
    <section class="ref-search mb-3">
      <label class="ref-search__label" for="reference-search-input">
        <span class="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
        <span>{{ 'home.referenceTitle' | translate }}</span>
      </label>
      <form class="ref-search__form" (submit)="$event.preventDefault(); onSearch()">
        <div class="ref-search__field">
          <input
            #referenceInput
            id="reference-search-input"
            class="ref-search__input"
            type="search"
            dir="ltr"
            autocomplete="off"
            [attr.placeholder]="'home.referencePlaceholder' | translate"
            [attr.aria-invalid]="referenceError()"
            [value]="reference()"
            (input)="onInput($event)"
          />
          <span class="material-symbols-outlined ref-search__tag" aria-hidden="true">tag</span>
        </div>
        <button class="ref-search__submit" type="submit">
          <span>{{ 'home.referenceSearch' | translate }}</span>
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
        </button>
      </form>
      @if (referenceError()) {
        <p class="ref-search__error" role="alert">{{ 'home.referenceRequired' | translate }}</p>
      }
    </section>

    @if (loading()) {
      <div class="panel p-4 text-center text-secondary">
        <div class="spinner-border text-success mb-2" role="status"></div>
        <div>{{ 'followUp.loading' | translate }}</div>
      </div>
    } @else if (notFound()) {
      <section class="panel page-state">
        <div class="icon-wrap error"><i class="bi bi-search" aria-hidden="true"></i></div>
        <h2 class="h5">{{ 'followUp.notFoundTitle' | translate }}</h2>
        <p class="text-secondary mb-0">{{ 'followUp.notFoundBody' | translate }}</p>
      </section>
    } @else if (report(); as r) {
      <section class="panel p-3 p-md-4 mb-3">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
          <div>
            <p class="small text-secondary mb-1">{{ 'common.reference' | translate }}</p>
            <div class="fw-bold fs-5" style="color: var(--transtu-blue-deep)">{{ r.reference }}</div>
          </div>
          @if (r.statusLabel) {
            <span class="support-chip">{{ r.statusLabel }}</span>
          }
        </div>

        <dl class="row gy-2 mb-0">
          <dt class="col-5 text-secondary">{{ 'common.status' | translate }}</dt>
          <dd class="col-7 mb-0">{{ r.statusLabel || ('common.dash' | translate) }}</dd>
          <dt class="col-5 text-secondary">{{ 'common.type' | translate }}</dt>
          <dd class="col-7 mb-0">{{ r.reportTypeLabel || ('common.dash' | translate) }}</dd>
          <dt class="col-5 text-secondary">{{ 'followUp.createdAt' | translate }}</dt>
          <dd class="col-7 mb-0">{{ r.creationDate | date: 'dd/MM/yyyy HH:mm' }}</dd>
          <dt class="col-5 text-secondary">{{ 'common.support' | translate }}</dt>
          <dd class="col-7 mb-0">{{ r.supportLabel || ('common.dash' | translate) }}</dd>
          <dt class="col-5 text-secondary">{{ 'followUp.description' | translate }}</dt>
          <dd class="col-7 mb-0" style="white-space: pre-wrap; word-break: break-word">{{
            r.description || ('common.dash' | translate)
          }}</dd>
        </dl>
      </section>

      <section class="panel p-3 p-md-4">
        <h2 class="h5 mb-3">{{ 'followUp.repliesTitle' | translate }}</h2>
        @if (r.replies?.length) {
          @for (reply of r.replies; track reply.replyDate + reply.message) {
            <article class="mb-3 p-3 border rounded-2">
              <div class="small text-secondary mb-1 fw-semibold">{{ 'followUp.replyFrom' | translate }}</div>
              <div class="small text-secondary mb-2">
                {{ reply.replyDate | date: 'dd/MM/yyyy – HH:mm' }}
              </div>
              <p class="mb-0" style="white-space: pre-wrap">{{ reply.message }}</p>
            </article>
          }
        } @else {
          <p class="text-secondary mb-0">{{ 'followUp.noReplies' | translate }}</p>
        }
      </section>
    }

    <p class="text-center mt-3 mb-0">
      <a routerLink="/accueil">{{ 'common.backHome' | translate }}</a>
    </p>
  `,
  styles: [`
    .ref-search {
      background: var(--surface-container-low, #f3f6fc);
      border-radius: 0.75rem;
      padding: 0.75rem;
    }
    .ref-search__label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--primary, #003b7f);
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .ref-search__form {
      display: flex;
      gap: 0.5rem;
    }
    .ref-search__field {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .ref-search__input {
      width: 100%;
      height: 3rem;
      border: 1px solid var(--transtu-border, #c2c6d4);
      border-radius: 0.5rem;
      background: #fff;
      padding-inline: 0.9rem 2.2rem;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 1px 3px rgba(19, 28, 40, 0.08);
    }
    .ref-search__tag {
      position: absolute;
      inset-inline-end: 0.6rem;
      top: 50%;
      translate: 0 -50%;
      color: var(--outline, #737783);
    }
    .ref-search__submit {
      height: 3rem;
      padding: 0 1.25rem;
      border: 0;
      border-radius: 0.5rem;
      background: var(--primary, #003b7f);
      color: #fff;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }
    .ref-search__error {
      color: #ba1a1a;
      font-size: 0.8rem;
      font-weight: 600;
      margin: 0.5rem 0 0;
    }
  `],
})
export class ReportReferencePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly report = signal<PublicReportTracking | null>(null);
  readonly reference = signal('');
  readonly referenceError = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const ref = params.get('reference')?.trim() ?? '';
      this.reference.set(ref);
      this.referenceError.set(false);
      if (!ref) {
        this.notFound.set(true);
        return;
      }
      this.load(ref);
    });
  }

  onInput(event: Event): void {
    this.reference.set((event.target as HTMLInputElement).value);
    this.referenceError.set(false);
  }

  onSearch(): void {
    const ref = this.reference().trim();
    if (!ref) {
      this.referenceError.set(true);
      return;
    }
    void this.router.navigate(['/reference', ref]);
  }

  private load(reference: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.report.set(null);
    this.reportService.getByReference(reference).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.notFound.set(true);
        void err;
      },
    });
  }
}
