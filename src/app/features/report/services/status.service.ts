import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { StatusInfo } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class StatusService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<StatusInfo[]> {
    return this.http
      .get<ApiResponse<StatusInfo[]>>(API_CONFIG.public.status)
      .pipe(map((res) => res.data ?? []));
  }
}
