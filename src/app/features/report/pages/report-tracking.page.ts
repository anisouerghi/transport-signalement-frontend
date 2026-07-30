import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ReportResponse } from '../models/report.model';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-report-tracking-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './report-tracking.page.html',
})
export class ReportTrackingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly report = signal<ReportResponse | null>(null);
  readonly searched = signal(false);

  readonly form = this.fb.nonNullable.group({
    reference: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    const ref = this.route.snapshot.paramMap.get('reference');
    if (ref) {
      this.form.controls.reference.setValue(ref);
      this.search(ref);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.search(this.form.controls.reference.value.trim());
  }

  private search(reference: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.searched.set(true);
    this.report.set(null);

    this.reportService.getByReference(reference).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        }
      },
    });
  }
}
