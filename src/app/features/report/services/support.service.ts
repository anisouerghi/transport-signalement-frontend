import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { TransportSupport } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.public.supports;

  getByUuid(uuid: string): Observable<TransportSupport> {
    return this.http
      .get<ApiResponse<TransportSupport>>(`${this.baseUrl}/${uuid}`)
      .pipe(map((res) => res.data));
  }
}
