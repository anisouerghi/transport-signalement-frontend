import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PublicReportTracking } from '../models/report.model';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-report-tracking-page',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './report-tracking.page.html',
  styles: [`
    .tracking-search {
      background: #eef3fd;
      border-radius: 0.8rem;
      padding: 0.6rem 0.8rem 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .tracking-search__label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #004c9b;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .tracking-search__row {
      display: flex;
      align-items: stretch;
      gap: 0.5rem;
    }
    .tracking-search__field {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .tracking-search__field input {
      width: 100%;
      height: 2.7rem;
      border: 1px solid #d5deef;
      border-radius: 0.55rem;
      background: #fff;
      padding-inline: 0.9rem 2.2rem;
      font-size: 0.85rem;
    }
    .tracking-search__hash {
      position: absolute;
      inset-inline-end: 0.8rem;
      top: 50%;
      translate: 0 -50%;
      color: #8a94a6;
      font-weight: 700;
    }
    .tracking-search__btn {
      height: 2.7rem;
      padding: 0 1.4rem;
      border: 0;
      border-radius: 0.55rem;
      background: #004c9b;
      color: #fff;
      font-weight: 700;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }
    .tracking-search__btn:disabled {
      opacity: 0.55;
    }
  `],
})
export class ReportTrackingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly invalidLink = signal(false);
  readonly report = signal<PublicReportTracking | null>(null);
  readonly trackingCode = signal('');

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('uuid')?.trim() ?? '';
      this.trackingCode.set(code);
      this.invalidLink.set(false);
      if (!code) {
        this.invalidLink.set(true);
        return;
      }
      this.load(code);
    });
  }

  onTrackingInput(event: Event): void {
    this.trackingCode.set((event.target as HTMLInputElement).value);
  }

  onTrackSubmit(event: Event): void {
    event.preventDefault();
    const code = this.trackingCode().trim();
    if (!code) {
      return;
    }
    void this.router.navigate(['/report-followup', code]);
  }

  private load(uuid: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.report.set(null);

    this.reportService.getFollowUp(uuid).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.notFound.set(true);
        }
      },
    });
  }
}
