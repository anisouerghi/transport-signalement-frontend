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
  styleUrls: ['./report-entry.page.scss'],
  styles: [`
    .stepper-container {
      background: #ffffff;
      padding: 1rem;
      border-radius: 0.85rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 500px;
      margin: 0 auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      position: relative;
      z-index: 1;
    }
    .step__icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #e9ecef;
      color: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }
    .step__label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6c757d;
      text-align: center;
      white-space: nowrap;
    }
    .step.completed .step__icon {
      background: #0b8a3e;
      color: #fff;
    }
    .step.completed .step__label {
      color: #0b8a3e;
    }
    .step.active .step__icon {
      background: #e8a317;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(232, 163, 23, 0.25);
    }
    .step.active .step__label {
      color: #142033;
      font-weight: 700;
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: #e9ecef;
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
    }
    .step-line.completed {
      background: #0b8a3e;
    }
  `]
})
export class ReportEntryPage implements OnInit {
  private readonly supportService = inject(SupportService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly submitted = signal(false);
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

  /**
   * Note UX:
   * on calcule ces valeurs à la volée (pas via `computed` signal),
   * car elles dépendent directement des valeurs du `FormControl`.
   * Sinon l'étape suivante (identité / formulaire) peut ne pas apparaître.
   */
  filteredSupports(): TransportSupport[] {
    const typeId = this.form.controls.supportTypeId.value;
    const all = this.supports();
    if (!typeId) {
      return [];
    }
    return all.filter((s) => String(s.supportTypeId ?? s.supportTypeCode ?? '') === typeId);
  }

  selectedSupport(): TransportSupport | null {
    const uuid = this.form.controls.supportUuid.value;
    return this.supports().find((s) => s.uuid === uuid) ?? null;
  }

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
      this.submitted.set(false);
    });

    this.form.controls.supportUuid.valueChanges.subscribe(() => {
      this.submitted.set(false);
    });
  }

  returnUrl(): string {
    const uuid = this.form.controls.supportUuid.value;
    return uuid ? `/report/${uuid}/signaler?source=direct` : '/signalement';
  }

  goToForm(): void {
    this.submitted.set(true);
    const uuid = this.form.controls.supportUuid.value;
    if (!uuid) {
      return;
    }
    void this.router.navigate(['/report', uuid, 'signaler'], {
      queryParams: { source: 'direct' },
    });
  }
}
