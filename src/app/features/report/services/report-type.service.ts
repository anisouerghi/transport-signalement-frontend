import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { ReportType } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.public.reportTypes;

  getActive(): Observable<ReportType[]> {
    return this.http
      .get<ApiResponse<ReportType[]>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }
}
