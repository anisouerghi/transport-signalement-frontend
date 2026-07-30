import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { ReportRequest, ReportResponse } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  create(payload: ReportRequest): Observable<ReportResponse> {
    return this.http
      .post<ApiResponse<ReportResponse>>(API_CONFIG.public.signalements, payload)
      .pipe(map((res) => res.data));
  }

  getByReference(reference: string): Observable<ReportResponse> {
    return this.http
      .get<ApiResponse<ReportResponse>>(`${API_CONFIG.public.suivi}/${encodeURIComponent(reference)}`)
      .pipe(map((res) => res.data));
  }
}
