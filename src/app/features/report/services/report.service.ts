import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { ReportRequest, ReportResponse } from '../models/report.model';

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

  /** Consulte le suivi d'un signalement via sa référence publique. */
  getByReference(reference: string): Observable<ReportResponse> {
    return this.http
      .get<ApiResponse<ReportResponse>>(`${API_CONFIG.public.suivi}/${encodeURIComponent(reference)}`)
      .pipe(map((res) => res.data));
  }
}
