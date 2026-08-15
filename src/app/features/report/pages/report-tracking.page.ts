import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PublicReportTracking } from '../models/report.model';
import { ReportService } from '../services/report.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-report-tracking-page',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './report-tracking.page.html',
})
export class ReportTrackingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly invalidLink = signal(false);
  readonly report = signal<PublicReportTracking | null>(null);

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid')?.trim() ?? '';
    if (!uuid) {
      this.invalidLink.set(true);
      return;
    }
    if (!UUID_RE.test(uuid)) {
      this.invalidLink.set(true);
      return;
    }
    this.load(uuid);
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
