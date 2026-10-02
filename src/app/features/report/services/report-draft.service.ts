import { Injectable } from '@angular/core';

export interface ReportDraft {
  formValue: {
    reportTypeId: string;
    description: string;
    name: string;
    phoneNumber: string;
    email: string;
  };
  supportUuid: string;
  anonymousMode: boolean;
  files: File[];
  voiceFile: File | null;
  turnstileToken?: string | null;
  /** true → après connexion, enregistrer avec suivi automatiquement. */
  withTracking: boolean;
}

/**
 * Conserve temporairement le brouillon de signalement
 * pendant une redirection vers la connexion (suivi).
 */
@Injectable({ providedIn: 'root' })
export class ReportDraftService {
  private draft: ReportDraft | null = null;

  save(draft: ReportDraft): void {
    this.draft = draft;
  }

  take(): ReportDraft | null {
    const d = this.draft;
    this.draft = null;
    return d;
  }

  clear(): void {
    this.draft = null;
  }
}
