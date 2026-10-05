import { Injectable } from '@angular/core';

/** Saisie conservée en mémoire le temps du parcours, sans appel API. */
export interface ReportDraft {
  reportTypeId: string;
  description: string;
  name: string;
  phoneNumber: string;
  email: string;
  files: File[];
  voice: File | null;
  turnstileToken: string | null;
  supportUuid: string;
  /** Vrai seulement après le choix « avec suivi » en attente de connexion. */
  pendingAuth: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportDraftService {
  private draft: ReportDraft | null = null;

  save(draft: ReportDraft): void {
    this.draft = draft;
  }

  peek(): ReportDraft | null {
    return this.draft;
  }

  clear(): void {
    this.draft = null;
  }
}
