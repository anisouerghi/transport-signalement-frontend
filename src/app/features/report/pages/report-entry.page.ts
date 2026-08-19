import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IdentityChoiceComponent } from '../components/identity-choice.component';
import { SupportSummaryComponent } from '../components/support-summary.component';
import { TransportSupport } from '../models/report.model';
import { SupportService } from '../services/support.service';

@Component({
  selector: 'app-report-entry-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, SupportSummaryComponent, IdentityChoiceComponent],
  templateUrl: './report-entry.page.html',
})
export class ReportEntryPage implements OnInit {
  private readonly supportService = inject(SupportService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly supports = signal<TransportSupport[]>([]);

  readonly form = this.fb.nonNullable.group({
    supportTypeId: '',
    supportUuid: '',
  });

  readonly types = computed(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const s of this.supports()) {
      const id = String(s.supportTypeId ?? s.supportTypeCode ?? '');
      if (!id || map.has(id)) {
        continue;
      }
      map.set(id, { id, label: s.supportTypeLabel || s.supportTypeCode || id });
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  });

  readonly filteredSupports = computed(() => {
    const typeId = this.form.controls.supportTypeId.value;
    const all = this.supports();
    if (!typeId) {
      return all;
    }
    return all.filter(
      (s) => String(s.supportTypeId ?? s.supportTypeCode ?? '') === typeId,
    );
  });

  readonly selectedSupport = computed(() => {
    const uuid = this.form.controls.supportUuid.value;
    return this.supports().find((s) => s.uuid === uuid) ?? null;
  });

  ngOnInit(): void {
    this.supportService.listActive().subscribe({
      next: (items) => {
        this.supports.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });

    this.form.controls.supportTypeId.valueChanges.subscribe(() => {
      this.form.controls.supportUuid.setValue('');
    });
  }

  returnUrl(): string {
    const uuid = this.form.controls.supportUuid.value;
    return uuid ? `/report/${uuid}/signaler` : '/signalement';
  }

  goToForm(): void {
    const uuid = this.form.controls.supportUuid.value;
    if (!uuid) {
      return;
    }
    void this.router.navigate(['/report', uuid, 'signaler']);
  }
}
