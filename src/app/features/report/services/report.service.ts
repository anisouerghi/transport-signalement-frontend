import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { PublicReportTracking, ReportRequest, ReportResponse } from '../models/report.model';

/**
 * Accès HTTP aux signalements côté interface publique voyageur.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  /**
   * Crée un signalement en {@code multipart/form-data} :
   * part JSON {@code report} + fichiers optionnels {@code files}.
   */
  create(payload: ReportRequest, files: File[] = []): Observable<ReportResponse> {
    const formData = new FormData();
    formData.append(
      'report',
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    );
    for (const file of files) {
      formData.append('files', file, file.name);
    }
    return this.http
      .post<ApiResponse<ReportResponse>>(API_CONFIG.public.signalements, formData)
      .pipe(map((res) => res.data));
  }

  /**
   * Suivi sécurisé par UUID (lien e-mail).
   * N'expose que les réponses visibles pour le voyageur.
   */
  getFollowUp(uuid: string): Observable<PublicReportTracking> {
    return this.http
      .get<ApiResponse<PublicReportTracking>>(
        `${API_CONFIG.public.followUp}/${encodeURIComponent(uuid)}/follow-up`,
      )
      .pipe(map((res) => res.data));
  }

  /** @deprecated Préférer {@link getFollowUp} */
  getByUuid(uuid: string): Observable<PublicReportTracking> {
    return this.getFollowUp(uuid);
  }
}
