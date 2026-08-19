import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse, PageResult } from '../../../shared/models/api-response.model';
import {
  PublicHomepageReply,
  PublicReportListItem,
  PublicReportTracking,
  ReportRequest,
  ReportResponse,
} from '../models/report.model';

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

  /** 15 derniers signalements du voyageur authentifié (JWT). */
  listMine(reference?: string): Observable<PublicReportListItem[]> {
    const params: { [key: string]: string } = {};
    const q = reference?.trim();
    if (q) {
      params['reference'] = q;
    }
    return this.http
      .get<ApiResponse<PublicReportListItem[]>>(`${API_CONFIG.public.signalements}/mine`, {
        params,
      })
      .pipe(map((res) => res.data ?? []));
  }

  /** Réponses publiées sur l'accueil (pagination serveur). */
  listHomepageReplies(page: number, size = 5): Observable<PageResult<PublicHomepageReply>> {
    return this.http
      .get<ApiResponse<PageResult<PublicHomepageReply>>>(API_CONFIG.public.reponses, {
        params: { page: String(page), size: String(size) },
      })
      .pipe(map((res) => this.toHomepagePage(res, page, size)));
  }

  private toHomepagePage(
    res: ApiResponse<PageResult<PublicHomepageReply>> | null,
    page: number,
    size: number,
  ): PageResult<PublicHomepageReply> {
    const payload = res?.data;
    const content = Array.isArray(payload?.content) ? payload.content : [];
    return {
      content,
      totalElements: payload?.totalElements ?? content.length,
      totalPages: payload?.totalPages ?? (content.length > 0 ? 1 : 0),
      page: payload?.page ?? page,
      size: payload?.size ?? size,
    };
  }

  /** @deprecated Préférer {@link getFollowUp} */
  getByUuid(uuid: string): Observable<PublicReportTracking> {
    return this.getFollowUp(uuid);
  }
}
